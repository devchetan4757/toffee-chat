import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { USERS } from "../config/users.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import { getEffectivePfp } from "../lib/profile.js";
import UserProfile from "../models/userProfile.model.js";
import { io } from "../lib/socket.js";

export const login = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }
    const USER1 = process.env.USER_1;
    const USER2 = process.env.USER_2;
    const rolePasswords = {
      [USER1]: process.env.PASSWORD_1,
      [USER2]: process.env.PASSWORD_2,
    };

    let role;

    for (const [r, hash] of Object.entries(rolePasswords)) {
      const match = await bcrypt.compare(password, hash);

      if (match) {
        role = r;
        break;
      }
    }

    if (!role) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const pfp = await getEffectivePfp(role);

    const user = {
      _id: role,
      role,
      pfp,
    };
    generateToken(res, user);

    res.status(200).json({
      message: "Login successful",
      role,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });

    res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log("Error in logout controller", error.message);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const authUser = req.user; // from protect middleware
    const otherRole = Object.keys(USERS).find((r) => r !== authUser.role);

    const [selfPfp, otherPfp] = await Promise.all([
      getEffectivePfp(authUser.role),
      getEffectivePfp(otherRole),
    ]);

    res.status(200).json({
      authenticated: true,
      user: {
        _id: authUser._id,
        role: authUser.role,
        pfp: selfPfp,
      },
      otherUser: {
        _id: otherRole,
        role: otherRole,
        pfp: otherPfp,
      },
    });
  } catch (error) {
    console.error("checkAuth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const MAX_PFP_BYTES = 4 * 1024 * 1024; // 4MB — keeps profile documents small
const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/;

const parseDataUrl = (dataUrl) => {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) return null;
  const [, contentType, base64Data] = match;
  return { contentType, buffer: Buffer.from(base64Data, "base64") };
};

/**
 * UPDATE PROFILE PHOTO
 * Body shapes (send exactly one):
 *   { image: "data:image/jpeg;base64,...." }  -> decode & store those
 *                                                 bytes directly (the
 *                                                 normal path, used by
 *                                                 the crop tool)
 *   { imageUrl: "https://..." }               -> fetch the bytes
 *                                                 ourselves server-side
 *                                                 and store those (used
 *                                                 only as a fallback if
 *                                                 the browser couldn't
 *                                                 export a crop of a
 *                                                 cross-origin image)
 *   { image: null }                           -> reset to the app
 *                                                 default for this role
 *
 * Every branch overwrites pfpData/pfpContentType on the SAME document
 * (findOneAndUpdate, one doc per role) — a new photo always fully
 * replaces the old binary, nothing is kept or appended.
 * Only ever touches the caller's own role (req.user.role from the
 * JWT), never an arbitrary one passed in the body.
 */
export const updatePfp = async (req, res) => {
  try {
    const { role } = req.user;
    const { image, imageUrl } = req.body;

    if (image === null && !imageUrl) {
      // Reset: wipe any stored binary so it's fully replaced, not left behind
      await UserProfile.findOneAndUpdate(
        { role },
        { pfpData: null, pfpContentType: null },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (typeof image === "string") {
      const parsed = parseDataUrl(image);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid image data" });
      }
      if (parsed.buffer.length > MAX_PFP_BYTES) {
        return res.status(400).json({ message: "Image is too large" });
      }

      await UserProfile.findOneAndUpdate(
        { role },
        { pfpData: parsed.buffer, pfpContentType: parsed.contentType },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (typeof imageUrl === "string") {
      if (!/^https?:\/\//i.test(imageUrl)) {
        return res.status(400).json({ message: "Invalid image URL" });
      }

      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        maxContentLength: MAX_PFP_BYTES,
      });
      const buffer = Buffer.from(response.data);

      if (buffer.length > MAX_PFP_BYTES) {
        return res.status(400).json({ message: "Image is too large" });
      }

      await UserProfile.findOneAndUpdate(
        { role },
        {
          pfpData: buffer,
          pfpContentType: response.headers["content-type"] || "image/jpeg",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      return res.status(400).json({ message: "No image provided" });
    }

    const effectivePfp = await getEffectivePfp(role);

    // Let the other person's client (and any other open tab of this
    // user's own session) update the avatar live, without a refresh.
    io.emit("pfpUpdated", { role, pfp: effectivePfp });

    res.status(200).json({
      message: "Profile photo updated",
      pfp: effectivePfp,
    });
  } catch (error) {
    console.error("updatePfp error:", error);
    res.status(500).json({ message: "Failed to update profile photo" });
  }
};

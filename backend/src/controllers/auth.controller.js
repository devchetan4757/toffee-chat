import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { USERS } from "../config/users.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import { getEffectivePfp, getEffectiveWallpaper } from "../lib/profile.js";
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

    const [pfp, wallpaper] = await Promise.all([
      getEffectivePfp(role),
      getEffectiveWallpaper(role),
    ]);

    // IMPORTANT: the JWT itself must only carry small identity claims.
    // pfp/wallpaper are data URLs of the actual image bytes (can be
    // several MB) — signing those into the token bloats the resulting
    // Set-Cookie header way past the ~4KB limit browsers enforce per
    // cookie, so the browser silently refuses to store it. That looks
    // exactly like "login succeeded but I'm still not authenticated,"
    // and it gets worse the moment someone uploads a wallpaper/photo.
    // The auth middleware only ever reads decoded._id/decoded.role
    // anyway (it re-derives pfp from USERS by role), so nothing here
    // was actually using the image data in the token.
    generateToken(res, { _id: role, role });

    // The full pfp/wallpaper still go out in the response body (no
    // size limit there) so the client has them immediately on login
    // without a second round trip.
    const user = {
      _id: role,
      role,
      pfp,
      wallpaper,
    };

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

    const [selfPfp, otherPfp, wallpaper] = await Promise.all([
      getEffectivePfp(authUser.role),
      getEffectivePfp(otherRole),
      // Wallpaper is a personal display setting — only fetched for
      // the caller's own role, never sent as part of otherUser.
      getEffectiveWallpaper(authUser.role),
    ]);

    res.status(200).json({
      authenticated: true,
      user: {
        _id: authUser._id,
        role: authUser.role,
        pfp: selfPfp,
        wallpaper,
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
const MAX_WALLPAPER_BYTES = 6 * 1024 * 1024; // 6MB
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

/**
 * UPDATE CHAT WALLPAPER
 * Body shapes (send exactly one):
 *   { image: "data:image/jpeg;base64,...." }  -> decode & store those
 *                                                 bytes as the new saved
 *                                                 wallpaper, and switch
 *                                                 it on immediately (the
 *                                                 normal path, used by
 *                                                 the crop tool)
 *   { imageUrl: "https://..." }               -> fetch the bytes
 *                                                 ourselves server-side
 *                                                 and store those (used
 *                                                 only as a fallback if
 *                                                 the browser couldn't
 *                                                 export a crop of a
 *                                                 cross-origin app-media
 *                                                 image)
 *   { active: true }                          -> switch back on to the
 *                                                 wallpaper already saved
 *                                                 (400 if nothing is saved)
 *   { active: false }                         -> switch off, back to the
 *                                                 plain chat background —
 *                                                 the saved bytes are kept
 *                                                 as-is so it can be
 *                                                 switched back on later
 *
 * Only ever touches the caller's own role (req.user.role from the
 * JWT). This is a personal display setting, not shared conversation
 * data, so it's never applied to (or readable for) the other role.
 */
export const updateWallpaper = async (req, res) => {
  try {
    const { role } = req.user;
    const { image, imageUrl, active } = req.body;

    if (typeof image === "string") {
      const parsed = parseDataUrl(image);
      if (!parsed) {
        return res.status(400).json({ message: "Invalid image data" });
      }
      if (parsed.buffer.length > MAX_WALLPAPER_BYTES) {
        return res.status(400).json({ message: "Image is too large" });
      }

      // A fresh upload always fully replaces the old binary (same
      // pattern as pfp) and activates immediately.
      await UserProfile.findOneAndUpdate(
        { role },
        {
          wallpaperData: parsed.buffer,
          wallpaperContentType: parsed.contentType,
          wallpaperActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (typeof imageUrl === "string") {
      if (!/^https?:\/\//i.test(imageUrl)) {
        return res.status(400).json({ message: "Invalid image URL" });
      }

      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        maxContentLength: MAX_WALLPAPER_BYTES,
      });
      const buffer = Buffer.from(response.data);

      if (buffer.length > MAX_WALLPAPER_BYTES) {
        return res.status(400).json({ message: "Image is too large" });
      }

      await UserProfile.findOneAndUpdate(
        { role },
        {
          wallpaperData: buffer,
          wallpaperContentType: response.headers["content-type"] || "image/jpeg",
          wallpaperActive: true,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else if (typeof active === "boolean") {
      if (active) {
        // Can't switch on a wallpaper that was never saved.
        const existing = await UserProfile.findOne({ role }).lean();
        if (!existing?.wallpaperData?.length) {
          return res
            .status(400)
            .json({ message: "No saved wallpaper to switch back to" });
        }
      }

      await UserProfile.findOneAndUpdate(
        { role },
        { wallpaperActive: active },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    } else {
      return res
        .status(400)
        .json({ message: "No image, imageUrl, or active flag provided" });
    }

    const wallpaper = await getEffectiveWallpaper(role);

    // Multi-tab/device sync for this same role only — mirrors
    // pfpUpdated, and the frontend filters on role the same way so
    // this never reaches the other person's client.
    io.emit("wallpaperUpdated", { role, wallpaper });

    res.status(200).json({
      message: "Chat wallpaper updated",
      wallpaper,
    });
  } catch (error) {
    console.error("updateWallpaper error:", error);
    res.status(500).json({ message: "Failed to update chat wallpaper" });
  }
};

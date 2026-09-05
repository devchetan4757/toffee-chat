import UserProfile from "../models/userProfile.model.js";
import { USERS } from "../config/users.js";

/**
 * The static, env-configured photo for a role (USER1_PFP / USER2_PFP).
 * This is what "reset to default" resolves to.
 */
export const getDefaultPfp = (role) => USERS[role]?.pfp || null;

/**
 * The photo that should actually be shown for a role right now: a
 * custom photo the user picked (stored as raw bytes in Mongo) takes
 * priority over the static default, and is returned as a data URL so
 * the frontend can drop it straight into an <img src>. Falls back to
 * the default on any DB error so a Mongo hiccup never breaks
 * login/checkAuth.
 */
export const getEffectivePfp = async (role) => {
  if (!role) return null;

  try {
    const profile = await UserProfile.findOne({ role }).lean();

    if (profile?.pfpData?.length) {
      // .lean() can hand back either a native Buffer or a BSON
      // Binary wrapper depending on driver version — normalize both.
      const buffer = Buffer.isBuffer(profile.pfpData)
        ? profile.pfpData
        : Buffer.from(profile.pfpData.buffer || profile.pfpData);

      const contentType = profile.pfpContentType || "image/jpeg";
      return `data:${contentType};base64,${buffer.toString("base64")}`;
    }
  } catch (err) {
    console.error("getEffectivePfp error:", err.message);
  }

  return getDefaultPfp(role);
};

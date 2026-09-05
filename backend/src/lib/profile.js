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

/**
 * The chat wallpaper state for a role. Unlike the profile photo,
 * there's no static default image to fall back to — the default IS
 * no wallpaper (the plain chat background).
 *
 * A role can have a saved wallpaper (custom bytes in Mongo) that is
 * either active (currently applied) or inactive (kept in storage so
 * the user can switch back to it later without re-uploading). Returns:
 *   - savedUrl: data URL of the stored wallpaper, or null if nothing
 *     has ever been saved — present even while toggled off, so the
 *     frontend can still show a "recent wallpaper" thumbnail
 *   - active: whether the saved wallpaper is the one currently applied
 *   - hasSaved: whether any wallpaper is stored at all
 *
 * Falls back to the "nothing saved" shape on any DB error, same
 * reasoning as getEffectivePfp above.
 */
export const getEffectiveWallpaper = async (role) => {
  if (!role) return { savedUrl: null, active: false, hasSaved: false };

  try {
    const profile = await UserProfile.findOne({ role }).lean();
    const hasSaved = !!profile?.wallpaperData?.length;

    if (!hasSaved) {
      return { savedUrl: null, active: false, hasSaved: false };
    }

    const buffer = Buffer.isBuffer(profile.wallpaperData)
      ? profile.wallpaperData
      : Buffer.from(profile.wallpaperData.buffer || profile.wallpaperData);

    const contentType = profile.wallpaperContentType || "image/jpeg";
    const savedUrl = `data:${contentType};base64,${buffer.toString("base64")}`;

    return { savedUrl, active: !!profile.wallpaperActive, hasSaved: true };
  } catch (err) {
    console.error("getEffectiveWallpaper error:", err.message);
    return { savedUrl: null, active: false, hasSaved: false };
  }
};

import mongoose from "mongoose";

// Stores the *custom* profile photo a user has picked, keyed by role
// ("USER_1" / "USER_2") — as raw image bytes, not a link to any
// external storage. Each role only ever has one document, and every
// update overwrites pfpData/pfpContentType in place, so picking a new
// photo fully replaces the old binary rather than accumulating them.
//
// If no document exists for a role (or pfpData is empty), the app
// falls back to the static default configured via USER1_PFP /
// USER2_PFP in config/users.js — see lib/profile.js.
const userProfileSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, unique: true },
    pfpData: { type: Buffer, default: null },
    pfpContentType: { type: String, default: null },
  },
  { timestamps: true }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

export default UserProfile;

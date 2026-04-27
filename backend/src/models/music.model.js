import mongoose from "mongoose";

const musicSchema = new mongoose.Schema(
  {
    userId: {
      type: String,        // ✅ FIXED (role-based system)
      required: true,
    },

    title: {
      type: String,
      default: "Untitled",
    },

    url: {
      type: String,
      required: true,
    },

    videoId: {
      type: String,
      required: true,
    },

    showVideo: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Music = mongoose.model("Music", musicSchema);

export default Music;

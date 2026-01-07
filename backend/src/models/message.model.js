import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    audio: {
      type: String,
  },
},
  { timestamps: true }
);

messageSchema.index({ createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;

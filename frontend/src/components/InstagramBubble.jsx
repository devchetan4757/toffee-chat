// src/components/InstagramBubble.jsx
import { useState } from "react";
import { RotateCw } from "lucide-react";
import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url, type }) => {
  const isReel = type === "reel";
  const [replayKey, setReplayKey] = useState(0); // to force reload

  const handleReplay = () => {
    setReplayKey((prev) => prev + 1); // reload the reel
  };

  if (isReel) {
    return (
      <div
        className="instagram-bubble"
        style={{
          width: "250px",
          height: "380px",
          borderRadius: "12px",
          overflow: "hidden",
          margin: "5px 0",
          position: "relative",
          backgroundColor: "#000",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-58px",
            left: "-39px",
            width: "300px",
            height: "530px",
          }}
        >
          <ReelPlayer key={replayKey} url={url} />
        </div>

        {/* Replay Icon */}
        <button
          onClick={handleReplay}
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            background: "rgba(255,255,255,0.8)",
            borderRadius: "50%",
            padding: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <RotateCw size={18} />
        </button>
      </div>
    );
  }

  // Posts
  return (
    <div
      className="instagram-post-bubble"
      style={{
        width: "280px",
        height: "220px",
        borderRadius: "12px",
        overflow: "hidden",
        margin: "5px 0",
        position: "relative",
        backgroundColor: "#000",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-30px",
          left: "-25px",
          width: "260px",
          height: "260px",
        }}
      >
        <ReelPlayer url={url} />
      </div>
    </div>
  );
};

export default InstagramBubble;

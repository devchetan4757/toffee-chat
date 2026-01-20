import { useState } from "react";
import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url }) => {
  const [key, setKey] = useState(0); // changing key will reload embed

  const handleReplay = () => {
    setKey((prev) => prev + 1); // triggers re-render of ReelPlayer
  };

  return (
    <div
      className="instagram-bubble"
      style={{
        width: "250px",       // bubble width
        height: "380px",      // bubble height
        borderRadius: "12px",
        overflow: "hidden",   // crop the inner iframe
        margin: "5px 0",
        position: "relative",
        backgroundColor: "#000",
      }}
    >
      {/* Inner wrapper to crop and shift */}
      <div
        style={{
          position: "absolute",
          top: "-58px",        // crops top black space
          left: "-39px",
          width: "300px",      // must be larger than container width
          height: "530px",     // larger than container height
        }}
      >
        <ReelPlayer key={key} url={url} />
      </div>

      {/* Replay Button */}
      <button
        onClick={handleReplay}
        style={{
          position: "absolute",
          bottom: "5px",
          right: "5px",
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          padding: "2px 6px",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        Replay
      </button>
    </div>
  );
};

export default InstagramBubble;

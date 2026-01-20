import { useState } from "react";
import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url }) => {
  const [replayKey, setReplayKey] = useState(0);

  const handleReplay = () => {
    setReplayKey((prev) => prev + 1); // triggers re-mount
  };

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

      <button
        onClick={handleReplay}
        style={{
          position: "absolute",
          bottom: "5px",
          right: "5px",
          zIndex: 10,
          padding: "4px 8px",
          fontSize: "12px",
        }}
      >
        Replay
      </button>
    </div>
  );
};

export default InstagramBubble;

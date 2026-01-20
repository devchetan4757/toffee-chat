import { useState } from "react";
import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url, type }) => {
  const [replayKey, setReplayKey] = useState(0);

  const handleReplay = () => {
    // Force remount to reload Instagram embed
    setReplayKey((prev) => prev + 1);
  };

  // Bubble styling (kept your crop & resize)
  const bubbleStyles = {
    width: type === "post" ? "250px" : "250px",
    height: type === "post" ? "380px" : "430px", // posts shorter than reels
    borderRadius: "12px",
    overflow: "hidden",
    margin: "5px 0",
    position: "relative",
    backgroundColor: "#000",
  };

  const innerWrapper = {
    position: "absolute",
    top: type === "post" ? "-70px" : "-58px", // crop top differently for posts
    left: type === "post" ? "-20px" : "-39px",
    width: type === "post" ? "300px" : "300px",
    height: type === "post" ? "470px" : "530px",
  };

  return (
    <div className="flex flex-col items-start">
      <div style={bubbleStyles}>
        <div style={innerWrapper}>
          <ReelPlayer key={replayKey} url={url} />
        </div>
      </div>

      {/* Replay button */}
      <button
        onClick={handleReplay}
        className="mt-1 px-2 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300"
      >
        Replay
      </button>
    </div>
  );
};

export default InstagramBubble;

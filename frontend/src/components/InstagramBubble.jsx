import ReelPlayer from "./ReelPlayer";
import { useState, useEffect } from "react";

const InstagramBubble = ({ url, maxWidth = 250, maxHeight = 380 }) => {
  const [aspectRatio, setAspectRatio] = useState(9 / 16); // default IG reel ratio

  useEffect(() => {
    // Optional: Instagram doesn't expose exact video size via embed
    // But you can adjust ratio by detecting "post" vs "reel"
    if (url.includes("/p/")) setAspectRatio(4 / 5); // typical IG post
    else if (url.includes("/reel/")) setAspectRatio(9 / 16); // IG reel
  }, [url]);

  const width = maxWidth;
  let height = width / aspectRatio;

  if (height > maxHeight) height = maxHeight; // limit height to your bubble max

  return (
    <div
      className="instagram-bubble"
      style={{
        width: `${width}px`,
        height: `${height}px`,
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
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <ReelPlayer url={url} />
      </div>
    </div>
  );
};

export default InstagramBubble;

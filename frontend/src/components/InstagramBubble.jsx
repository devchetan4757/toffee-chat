import ReelPlayer from "./ReelPlayer";
import { useState, useEffect } from "react";

const InstagramBubble = ({ url }) => {
  const [height, setHeight] = useState(380); // default bubble height for reels

  useEffect(() => {
    // Only adjust height if this is a post
    if (url.includes("/p/")) {
      const postAspectRatio = 4 / 5; // typical IG post
      const width = 250; // keep your bubble width same as reels
      let calculatedHeight = width / postAspectRatio;

      // limit height to max 380 (same as reel bubble)
      if (calculatedHeight > 380) calculatedHeight = 380;

      setHeight(calculatedHeight);
    }
  }, [url]);

  return (
    <div
      className="instagram-bubble"
      style={{
        width: "250px",      // same width for reels and posts
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
          top: url.includes("/p/") ? "0" : "-58px",  // keep your reel top crop
          left: url.includes("/p/") ? "0" : "-39px", // keep your reel left crop
          width: url.includes("/p/") ? "100%" : "300px",
          height: url.includes("/p/") ? "100%" : "530px",
        }}
      >
        <ReelPlayer url={url} />
      </div>
    </div>
  );
};

export default InstagramBubble;

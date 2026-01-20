import ReelPlayer from "./ReelPlayer";
import { useState, useEffect } from "react";

const InstagramBubble = ({ url }) => {
  const [height, setHeight] = useState(380); // default bubble height

  useEffect(() => {
    if (url.includes("/p/")) {
      const postAspectRatio = 4 / 5; // typical IG post ratio
      const width = 250; // keep bubble width same
      let calculatedHeight = width / postAspectRatio;

      if (calculatedHeight > 380) calculatedHeight = 380;

      setHeight(calculatedHeight);
    }
  }, [url]);

  return (
    <div
      className="instagram-bubble"
      style={{
        width: "250px",
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
          top: url.includes("/p/") ? "-30px" : "-58px", // crop top for post
          left: url.includes("/p/") ? "0" : "-39px",   // reels keep left crop
          width: url.includes("/p/") ? "100%" : "300px",
          height: url.includes("/p/") ? "calc(100% + 30px)" : "530px", // extra height to compensate top crop
        }}
      >
        <ReelPlayer url={url} />
      </div>
    </div>
  );
};

export default InstagramBubble;

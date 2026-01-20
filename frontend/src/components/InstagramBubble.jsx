import { useEffect, useRef } from "react";
import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url, type }) => {
  const bubbleRef = useRef(null);

  // Reload page when Instagram iframe becomes black (replay issue)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const iframe = bubbleRef.current?.querySelector("iframe");
      if (iframe && iframe.clientHeight === 0) {
        window.location.reload();
      }
    });

    if (bubbleRef.current) {
      observer.observe(bubbleRef.current, {
        childList: true,
        subtree: true,
      });
    }

    return () => observer.disconnect();
  }, []);

  // ===== YOUR ORIGINAL REEL SIZING (UNCHANGED) =====
  const reelStyle = {
    width: "250px",
    height: "380px",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  };

  const reelInner = {
    position: "absolute",
    top: "-58px",
    left: "-39px",
    width: "300px",
    height: "530px",
  };

  // ===== POST SIZING (NEW, CROPPED TOP) =====
  const postStyle = {
    width: "260px",
    height: "260px",
    borderRadius: "12px",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#000",
  };

  const postInner = {
    position: "absolute",
    top: "-30px",
    left: "-20px",
    width: "300px",
    height: "340px",
  };

  const isReel = type === "reel";

  return (
    <div
      ref={bubbleRef}
      style={isReel ? reelStyle : postStyle}
    >
      <div style={isReel ? reelInner : postInner}>
        <ReelPlayer url={url} />
      </div>
    </div>
  );
};

export default InstagramBubble;

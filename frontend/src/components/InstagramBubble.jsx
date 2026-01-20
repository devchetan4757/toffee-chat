// src/components/InstagramBubble.jsx
import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url, type }) => {
  // Check type to decide sizing
  const isReel = type === "reel";

  if (isReel) {
    // --- Reels: keep your current sizing ---
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
        <div          style={{
            position: "absolute",
            top: "-58px",
            left: "-39px",
            width: "300px",
            height: "530px",
          }}
        >
          <ReelPlayer url={url} />
        </div>
      </div>
    );
  }

  // --- Posts: separate sizing and cropping ---
  return (
    <div
      className="instagram-bubble-post"
      style={{
        width: "320px",
        height: "300px",
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
          top: "-80px", // crop top part
          left: "-30px", // crop left side
          width: "260px",
          height: "360px",
        }}
      >
        <ReelPlayer url={url} />
      </div>
    </div>
  );
};

export default InstagramBubble;

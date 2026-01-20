import { RotateCw } from "lucide-react";
import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url, type }) => {
  const isReel = type === "reel";

  // Page reload function
  const handleReplay = () => {
    window.location.reload(); // reloads the whole page
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
          <ReelPlayer url={url} />
        </div>

        {/* Replay Icon */}
        <button
          onClick={handleReplay}
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            background: "rgba(0,123,255,0.9)", // blue
            borderRadius: "50%",
            padding: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <RotateCw size={18} color="#fff" /> {/* white icon on blue circle */}
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
          top: "-50px",
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

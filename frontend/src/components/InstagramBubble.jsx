import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url, type }) => {
  // type can be "reel" or "post" if you want separate sizing for posts later

  // Function to reload page on replay
  const handleReplay = () => {
    window.location.reload(); // reloads the entire page to replay the reel
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
        <ReelPlayer url={url} />
      </div>

      {/* Replay button */}
      <button
        onClick={handleReplay}
        style={{
          position: "absolute",
          bottom: "8px",
          right: "8px",
          padding: "4px 8px",
          fontSize: "12px",
          borderRadius: "6px",
          backgroundColor: "rgba(255,255,255,0.8)",
          color: "#000",
          cursor: "pointer",
          zIndex: 10,
        }}
      >
        Replay
      </button>
    </div>
  );
};

export default InstagramBubble;

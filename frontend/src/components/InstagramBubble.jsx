import ReelPlayer from "./ReelPlayer";

const InstagramBubble = ({ url }) => {
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
      {/* Inner wrapper to crop and shift */}
      <div
        style={{
          position: "absolute",
          top: "-58px",        // crops top black space
          left: "-39px",
          width: "300px",
          height: "530px",
        }}
      >
        <ReelPlayer url={url} />
      </div>
    </div>
  );
};

export default InstagramBubble;

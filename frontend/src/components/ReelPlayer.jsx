// src/components/ReelPlayer.jsx
import { useEffect, useRef } from "react";

const ReelPlayer = ({ type, url }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // For Instagram embeds, reprocess embeds when the element changes
    if (type.startsWith("instagram") && window.instgrm) {
      window.instgrm.Embeds.process();
    }
  }, [url, type]);

  // Instagram embed
  if (type === "instagram" || type === "instagram_post") {
    return (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "auto",
        }}
      >
        <blockquote
          className="instagram-media"
          data-instgrm-permalink={url}
          data-instgrm-version="14"
          style={{ margin: "0 auto" }}
        ></blockquote>
        {/* Load Instagram embed script */}
        {!window.instgrm && (
          <script
            async
            src="https://www.instagram.com/embed.js"
          ></script>
        )}
      </div>
    );
  }

  // YouTube Shorts embed
  if (type === "youtube") {
    return (
      <div
        style={{
          position: "relative",
          paddingBottom: "177.77%", // 9:16 aspect ratio
          height: 0,
          overflow: "hidden",
          maxWidth: "240px",
          marginTop: "4px",
        }}
      >
        <iframe
          src={url.replace("shorts/", "embed/shorts/")}
          title="YouTube Shorts"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    );
  }

  return null;
};

export default ReelPlayer;

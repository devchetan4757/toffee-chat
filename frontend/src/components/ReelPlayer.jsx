// src/components/ReelPlayer.jsx
import { useEffect, useRef } from "react";

const ReelPlayer = ({ url }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Load Instagram embeds script if not already loaded
    if (!window.instgrm) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      script.onload = () => window.instgrm.Embeds.process();
      document.body.appendChild(script);
    } else {
      window.instgrm.Embeds.process();
    }
  }, [url]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        maxWidth: "400px", // max width for desktop, scales down on mobile
        margin: "10px auto",
      }}
    >
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ margin: "0 auto" }}
      ></blockquote>
    </div>
  );
};

export default ReelPlayer;

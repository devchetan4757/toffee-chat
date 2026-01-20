import { useEffect, useRef } from "react";

const ReelPlayer = ({ url }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    // Only load script once
    const loadInstagramScript = () => {
      if (!window.instgrm) {
        const script = document.createElement("script");
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        script.onload = () => {
          window.instgrm.Embeds.process();
        };
        document.body.appendChild(script);
      } else {
        // Wait a tick for React render to complete, then process
        setTimeout(() => {
          window.instgrm.Embeds.process();
        }, 50);
      }
    };

    loadInstagramScript();
  }, [url]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{
          margin: 0,
          width: "100% !important",
          height: "100% !important",
        }}
      ></blockquote>
    </div>
  );
};

export default ReelPlayer;

// src/components/ReelPlayer.jsx
import { useEffect, useRef } from "react";

const ReelPlayer = ({ type, url }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    containerRef.current.innerHTML = `
      <blockquote class="instagram-media"
        data-instgrm-permalink="${url}"
        data-instgrm-version="14">
      </blockquote>
    `;

    if (!window.instgrm) {
      const script = document.createElement("script");
      script.src = "https://www.instagram.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    } else {
      window.instgrm.Embeds.process();
    }
  }, [url]);

  return <div ref={containerRef} className="w-full" />;
};

export default ReelPlayer;

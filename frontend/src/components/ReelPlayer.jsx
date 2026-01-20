import { useEffect, useRef } from "react";

const ReelPlayer = ({ url }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Remove old Instagram script if exists
    const oldScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    if (oldScript) oldScript.remove();

    // Add new script
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => window.instgrm && window.instgrm.Embeds.process();
    document.body.appendChild(script);

    return () => {
      script.remove(); // cleanup
    };
  }, [url]);

  return (
    <blockquote
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      style={{ margin: 0, width: "100%", height: "100%" }}
      ref={containerRef}
    ></blockquote>
  );
};

export default ReelPlayer;

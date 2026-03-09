import { useEffect, useRef } from "react";

const ReelPlayer = ({ url }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    // Clear previous content
    if (containerRef.current) containerRef.current.innerHTML = "";

    // Create blockquote for Instagram embed
    const blockquote = document.createElement("blockquote");
    blockquote.className = "instagram-media";
    blockquote.dataset.instgrmPermalink = url;
    blockquote.dataset.instgrmVersion = "14";
    blockquote.style.margin = "0";
    blockquote.style.width = "100%";
    blockquote.style.height = "100%";

    containerRef.current.appendChild(blockquote);

    // Remove old script if exists
    const oldScript = document.querySelector('script[src="https://www.instagram.com/embed.js"]');
    if (oldScript) oldScript.remove();

    // Add Instagram embed script
    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = () => window.instgrm && window.instgrm.Embeds.process();
    document.body.appendChild(script);

    return () => {
      script.remove();
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [url]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
};

export default ReelPlayer;

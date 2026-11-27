import { useEffect, useRef } from "react";

const EMBED_SCRIPT_SRC = "https://www.instagram.com/embed.js";
let embedScriptPromise;

const loadInstagramEmbedScript = () => {
  if (window.instgrm?.Embeds) return Promise.resolve();
  if (embedScriptPromise) return embedScriptPromise;

  embedScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${EMBED_SCRIPT_SRC}"]`);

    if (script?.dataset.loaded === "true") {
      resolve();
      return;
    }

    if (!script) {
      script = document.createElement("script");
      script.src = EMBED_SCRIPT_SRC;
      script.async = true;
    }

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => {
        script.remove();
        reject(new Error("Instagram embed script failed to load"));
      },
      { once: true }
    );

    if (!script.isConnected) document.body.appendChild(script);
  }).catch((error) => {
    embedScriptPromise = null;
    throw error;
  });

  return embedScriptPromise;
};

const ReelPlayer = ({ url, type }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url) return;

    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const blockquote = document.createElement("blockquote");
    blockquote.className = "instagram-media";
    blockquote.dataset.instgrmPermalink = url;
    blockquote.dataset.instgrmVersion = "14";
    blockquote.style.margin = "0";
    blockquote.style.width = "100%";
    blockquote.style.maxWidth = "100%";
    if (type === "reel") blockquote.style.height = "100%";

    container.appendChild(blockquote);

    let active = true;

    loadInstagramEmbedScript()
      .then(() => {
        if (active) window.instgrm?.Embeds?.process();
      })
      .catch((error) => {
        console.error("Unable to load Instagram embed", error);
      });

    return () => {
      active = false;
      container.innerHTML = "";
    };
  }, [url, type]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: type === "reel" ? "100%" : "auto",
      }}
    />
  );
};

export default ReelPlayer;

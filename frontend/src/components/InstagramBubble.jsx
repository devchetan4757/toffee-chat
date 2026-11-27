import { useState } from "react";
import { RotateCw } from "lucide-react";
import ReelPlayer from "./ReelPlayer";
import { axiosInstance } from "../lib/axios";

const getInstagramPostImageUrl = (url) => {
  const parsedUrl = new URL(url);
  if (!["instagram.com", "www.instagram.com"].includes(parsedUrl.hostname)) {
    return null;
  }

  const shortcode = parsedUrl.pathname.match(/^\/p\/([\w-]+)\/?$/)?.[1];

  if (!shortcode) return null;

  const apiBaseUrl = axiosInstance.defaults.baseURL || "/api";
  const endpoint = `${apiBaseUrl.replace(/\/+$/, "")}/upload/instagram-post/${encodeURIComponent(shortcode)}`;
  return new URL(endpoint, window.location.origin).toString();
};

const InstagramBubble = ({ url, type }) => {
  const isReel = type === "reel";
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  const handleReplay = () => {
    window.location.reload();
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
          <ReelPlayer url={url} type={type} />
        </div>

        <button
          onClick={handleReplay}
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            background: "rgba(0,123,255,0.9)",
            borderRadius: "50%",
            padding: "6px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          }}
        >
          <RotateCw size={18} color="#fff" />
        </button>
      </div>
    );
  }

  const imageUrl = getInstagramPostImageUrl(url);

  return (
    <div
      className="instagram-post-bubble"
      style={{
        width: "min(540px, 85vw)",
        maxWidth: "100%",
        overflow: "visible",
        margin: "5px 0",
      }}
    >
      {imageUrl && !imageLoadFailed ? (
        <img
          src={imageUrl}
          alt="Instagram post"
          loading="lazy"
          decoding="async"
          crossOrigin="use-credentials"
          onError={() => setImageLoadFailed(true)}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            borderRadius: "12px",
          }}
        />
      ) : (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-sm text-primary underline"
        >
          Unable to load the post image. Open it on Instagram.
        </a>
      )}
    </div>
  );
};

export default InstagramBubble;

import axios from "axios";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const IMAGE_CONTENT_TYPES = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const getInstagramPostImage = async (req, res) => {
  const { shortcode } = req.params;

  if (!/^[\w-]{1,32}$/.test(shortcode)) {
    return res.status(400).json({ message: "Invalid Instagram post ID" });
  }

  try {
    const response = await axios.get(
      `https://www.instagram.com/p/${encodeURIComponent(shortcode)}/media/?size=l`,
      {
        responseType: "arraybuffer",
        timeout: 10000,
        maxRedirects: 5,
        maxContentLength: MAX_IMAGE_BYTES,
        headers: { Accept: "image/*" },
      }
    );

    const contentType = response.headers["content-type"]
      ?.split(";")[0]
      .trim()
      .toLowerCase();

    if (!IMAGE_CONTENT_TYPES.has(contentType)) {
      return res.status(502).json({ message: "Instagram returned an unsupported image" });
    }

    res.set("Content-Type", contentType);
    res.set("Cache-Control", "private, max-age=3600");
    res.set("X-Content-Type-Options", "nosniff");
    return res.status(200).send(Buffer.from(response.data));
  } catch (error) {
    console.error("getInstagramPostImage error:", error);
    return res.status(502).json({ message: "Unable to fetch Instagram post image" });
  }
};

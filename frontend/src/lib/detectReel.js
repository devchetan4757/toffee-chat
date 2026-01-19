export const detectReel = (text) => {
  if (!text) return null;

  // Instagram Reel
  const insta = text.match(
    /(https?:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+)/
  );
  if (insta) return { type: "instagram", url: insta[1] };

  // YouTube Shorts
  const yt = text.match(
    /(https?:\/\/(www\.)?youtube\.com\/shorts\/[A-Za-z0-9_-]+)/
  );
  if (yt) return { type: "youtube", url: yt[1] };

  return null;
};

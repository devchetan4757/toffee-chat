export const getYouTubeId = (url) => {
  const regex =
    /(?:youtube\.com.*[?&]v=|youtu\.be\/)([^"&?/ ]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

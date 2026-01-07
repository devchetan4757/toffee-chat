let currentAudio = null;

export const setCurrentAudio = (audio) => {
  if (currentAudio && currentAudio !== audio) {
    currentAudio.pause();
  }
  currentAudio = audio;
};

export const clearCurrentAudio = (audio) => {
  if (currentAudio === audio) {
    currentAudio = null;
  }
};

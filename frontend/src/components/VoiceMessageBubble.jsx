import { useState, useRef, useEffect } from "react";
import { Play, Pause } from "lucide-react";

const VoiceMessageBubble = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const togglePlay = (e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) audio.pause();
    else audio.play();

    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Ensure duration is loaded
    const handleLoadedMetadata = () => {
      setProgress(0); // start at 0
    };

    // Update progress continuously
    const updateProgress = () => {
      // If duration not yet known, estimate using buffered audio
      let duration = audio.duration;
      if (!duration || duration === Infinity) {
        duration = audio.buffered.length
          ? audio.buffered.end(audio.buffered.length - 1)
          : 0.1; // fallback
      }
      setProgress(Math.min((audio.currentTime / duration) * 100, 100));
    };

    const handleEnded = () => {
      setProgress(100); // snap to full
      setIsPlaying(false);
      setTimeout(() => setProgress(0), 200); // reset
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("ended", handleEnded);

    // Start updating immediately in case timeupdate is delayed
    const interval = setInterval(updateProgress, 50);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("ended", handleEnded);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="mt-2 w-[220px]">
      <div className="flex items-center gap-3 bg-slate-800 px-3 py-2 rounded-xl">
        <button onClick={togglePlay} className="text-white shrink-0">
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="relative w-full h-2 bg-slate-600 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-green-400"
            style={{
              width: `${progress}%`,
              transition: isPlaying ? "none" : "width 0.1s linear",
            }}
          />
        </div>

        <audio ref={audioRef} src={src} preload="metadata" />
      </div>
    </div>
  );
};

export default VoiceMessageBubble;

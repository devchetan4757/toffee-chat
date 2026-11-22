import { useRef, useState } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";

const formatTime = (seconds = 0) => {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
};

const VideoPlayer = ({
  src,
  className = "",
  fit = "contain",
  autoPlay = false,
  compact = false,
  naturalRatio = false,
}) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [videoRatio, setVideoRatio] = useState(null);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        await video.play();
      } catch {
        setPlaying(false);
      }
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  };

  const enterFullscreen = async () => {
    const element = containerRef.current;
    if (!element) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch {
      // Fullscreen may be unavailable in embedded browsers.
    }
  };

  const seek = (event) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const time = Number(event.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div
      ref={containerRef}
      className={`video-player relative overflow-hidden bg-black group ${className}`}
      style={
        naturalRatio && videoRatio
          ? { aspectRatio: videoRatio }
          : undefined
      }
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={autoPlay}
        muted={muted}
        loop={false}
        playsInline
        preload="metadata"
        className={`h-full w-full ${
          fit === "cover" ? "object-cover" : "object-contain"
        }`}
        onLoadedData={() => setLoaded(true)}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setDuration(video.duration || 0);
          if (naturalRatio && video.videoWidth && video.videoHeight) {
            setVideoRatio(`${video.videoWidth} / ${video.videoHeight}`);
          }
        }}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
      />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="loading loading-spinner loading-md text-white"></span>
        </div>
      )}

      {!playing && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/65 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-105"
          aria-label="Play video"
        >
          <Play size={22} fill="currentColor" className="ml-0.5" />
        </button>
      )}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2.5 pb-2 pt-8 transition-opacity ${
          compact ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <input
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={currentTime}
          onChange={seek}
          aria-label="Video progress"
          className="video-progress mb-1 h-1 w-full cursor-pointer"
        />

        <div className="flex items-center gap-2 text-white">
          <button
            type="button"
            onClick={togglePlay}
            className="rounded p-1 hover:bg-white/15"
            aria-label={playing ? "Pause video" : "Play video"}
          >
            {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="rounded p-1 hover:bg-white/15"
            aria-label={muted ? "Unmute video" : "Mute video"}
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          <span className="min-w-max text-[10px] tabular-nums opacity-90">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            type="button"
            onClick={enterFullscreen}
            className="ml-auto rounded p-1 hover:bg-white/15"
            aria-label="View fullscreen"
          >
            <Maximize size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;

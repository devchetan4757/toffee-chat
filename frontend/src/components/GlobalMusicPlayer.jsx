import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";

const GlobalMusicPlayer = ({
  currentSong,
  setCurrentSong,
  autoPlay,
}) => {
  const playerRef = useRef(null);
  const isReadyRef = useRef(false);

  const autoPlayRef = useRef(autoPlay);
  const musicListRef = useRef([]);
  const currentIndexRef = useRef(-1);

  const [musicList, setMusicList] = useState([]);
  const [isMusicReady, setIsMusicReady] = useState(false);

  // -------------------------
  // KEEP LATEST AUTOPLAY
  // -------------------------
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  // -------------------------
  // KEEP MUSIC LIST
  // -------------------------
  useEffect(() => {
    musicListRef.current = musicList;
  }, [musicList]);

  // -------------------------
  // LOAD MUSIC
  // -------------------------
  useEffect(() => {
    const fetchMusic = async () => {
      try {
        const res = await axiosInstance.get("/music");
        const songs = res.data || [];

        setMusicList(songs);
        musicListRef.current = songs;
        setIsMusicReady(true);
      } catch {
        setIsMusicReady(false);
      }
    };

    fetchMusic();
  }, []);

  // -------------------------
  // RANDOM INDEX
  // -------------------------
  const getRandomIndex = () => {
    const songs = musicListRef.current;
    if (!songs.length) return 0;
    return Math.floor(Math.random() * songs.length);
  };

  // -------------------------
  // PLAY BY INDEX
  // -------------------------
  const playSongByIndex = (index) => {
    const songs = musicListRef.current;

    if (
      !songs.length ||
      !songs[index] ||
      !playerRef.current ||
      !isReadyRef.current
    )
      return;

    currentIndexRef.current = index;

    const song = songs[index];
    setCurrentSong(song);

    try {
      playerRef.current.loadVideoById(song.videoId);
    } catch {}
  };

  // -------------------------
  // NEXT SONG
  // -------------------------
  const playNextSong = () => {
    const songs = musicListRef.current;
    if (!songs.length) return;

    const next =
      (currentIndexRef.current + 1) % songs.length;

    playSongByIndex(next);
  };

  // -------------------------
  // START AUTOPLAY (SAFE RESET)
  // -------------------------
  const startAutoPlay = () => {
    const songs = musicListRef.current;
    if (!songs.length || !playerRef.current) return;

    const index = getRandomIndex();

    // 🔥 IMPORTANT RESET
    currentIndexRef.current = index;

    const song = songs[index];
    setCurrentSong(song);

    try {
      playerRef.current.stopVideo();
      playerRef.current.loadVideoById(song.videoId);
    } catch {}
  };

  // -------------------------
  // INIT YOUTUBE PLAYER
  // -------------------------
  const initPlayer = () => {
    if (playerRef.current || !window.YT?.Player) return;

    playerRef.current = new window.YT.Player("global-player", {
      height: "0",
      width: "0",
      videoId: "",
      playerVars: {
        autoplay: 1,
        controls: 0,
        playsinline: 1,
      },
      events: {
        onReady: () => {
          isReadyRef.current = true;

          // 🔥 FIX: safe start after ready
          if (
            autoPlayRef.current &&
            musicListRef.current.length
          ) {
            setTimeout(() => {
              startAutoPlay();
            }, 300);
          }
        },

        onStateChange: (event) => {
          if (
            event.data === window.YT.PlayerState.ENDED &&
            autoPlayRef.current
          ) {
            playNextSong();
          }
        },
      },
    });
  };

  // -------------------------
  // LOAD YT SCRIPT
  // -------------------------
  useEffect(() => {
    if (window.YT?.Player) {
      initPlayer();
      return;
    }

    if (!document.getElementById("yt-api")) {
      const tag = document.createElement("script");
      tag.id = "yt-api";
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = initPlayer;
  }, []);

  // -------------------------
  // MANUAL PLAY
  // -------------------------
  useEffect(() => {
    if (!currentSong?.videoId) return;
    if (!playerRef.current || !isReadyRef.current) return;

    try {
      playerRef.current.loadVideoById(currentSong.videoId);
    } catch {}
  }, [currentSong]);

  // -------------------------
  // AUTOPLAY TOGGLE FIX (MAIN FIX)
  // -------------------------
  useEffect(() => {
    if (!isReadyRef.current || !playerRef.current) return;

    if (autoPlay && isMusicReady) {
      // 🔥 RESET BEFORE START
      startAutoPlay();
    }

    if (!autoPlay) {
      try {
        playerRef.current.stopVideo();
      } catch {}

      currentIndexRef.current = -1;
      setCurrentSong(null);
    }
  }, [autoPlay, isMusicReady]);

  return (
    <div
      id="global-player"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    />
  );
};

export default GlobalMusicPlayer;

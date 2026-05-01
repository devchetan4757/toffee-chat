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
  const currentIndexRef = useRef(0);

  const [musicList, setMusicList] = useState([]);
  const [isMusicReady, setIsMusicReady] = useState(false);

  // keep latest autoplay
  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  // keep latest music list
  useEffect(() => {
    musicListRef.current = musicList;
  }, [musicList]);

  // LOAD MUSIC
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

  // RANDOM INDEX
  const getRandomStartIndex = () => {
    const songs = musicListRef.current;
    if (!songs.length) return 0;
    return Math.floor(Math.random() * songs.length);
  };

  // PLAY SONG
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

    playerRef.current.loadVideoById(song.videoId);
  };

  // NEXT SONG
  const playNextSong = () => {
    const songs = musicListRef.current;
    if (!songs.length) return;

    const nextIndex =
      (currentIndexRef.current + 1) % songs.length;

    playSongByIndex(nextIndex);
  };

  // START AUTOPLAY
  const startAutoPlay = () => {
    const songs = musicListRef.current;
    if (!songs.length) return;

    const randomIndex = getRandomStartIndex();
    playSongByIndex(randomIndex);
  };

  // INIT YOUTUBE PLAYER
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

          // IMPORTANT FIX
          if (
            autoPlayRef.current &&
            musicListRef.current.length
          ) {
            startAutoPlay();
          }
        },

        onStateChange: (event) => {
          if (
            event.data ===
              window.YT.PlayerState.ENDED &&
            autoPlayRef.current
          ) {
            playNextSong();
          }
        },
      },
    });
  };

  // LOAD YT SCRIPT
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

  // MANUAL PLAY
  useEffect(() => {
    if (
      currentSong?.videoId &&
      playerRef.current &&
      isReadyRef.current
    ) {
      playerRef.current.loadVideoById(currentSong.videoId);
    }
  }, [currentSong]);

  // AUTO PLAY FIX (🔥 MAIN FIX)
  useEffect(() => {
    if (
      autoPlay &&
      isReadyRef.current &&
      isMusicReady &&
      musicListRef.current.length
    ) {
      startAutoPlay();
    }

    if (
      !autoPlay &&
      playerRef.current &&
      isReadyRef.current
    ) {
      playerRef.current.stopVideo();
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

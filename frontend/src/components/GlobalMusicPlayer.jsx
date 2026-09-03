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

  useEffect(() => {
    autoPlayRef.current = autoPlay;
  }, [autoPlay]);

  useEffect(() => {
    musicListRef.current = musicList;
  }, [musicList]);

  /*
   * MUSIC FETCH IS LAZY.
   *
   * Nothing is requested until autoPlay becomes true.
   */
  useEffect(() => {
    if (!autoPlay) {
      setMusicList([]);
      musicListRef.current = [];
      setIsMusicReady(false);
      return;
    }

    let cancelled = false;

    const fetchMusic = async () => {
      try {
        const res = await axiosInstance.get("/music");

        if (cancelled) return;

        const songs = res.data || [];

        setMusicList(songs);
        musicListRef.current = songs;
        setIsMusicReady(true);
      } catch {
        if (!cancelled) {
          setIsMusicReady(false);
        }
      }
    };

    fetchMusic();

    return () => {
      cancelled = true;
    };
  }, [autoPlay]);

  const getRandomIndex = () => {
    const songs = musicListRef.current;

    if (!songs.length) return 0;

    return Math.floor(Math.random() * songs.length);
  };

  const playSongByIndex = (index) => {
    const songs = musicListRef.current;

    if (
      !songs.length ||
      !songs[index] ||
      !playerRef.current ||
      !isReadyRef.current
    ) {
      return;
    }

    currentIndexRef.current = index;

    const song = songs[index];

    setCurrentSong(song);

    try {
      playerRef.current.loadVideoById(song.videoId);
    } catch {}
  };

  const playNextSong = () => {
    const songs = musicListRef.current;

    if (!songs.length) return;

    const next =
      (currentIndexRef.current + 1) % songs.length;

    playSongByIndex(next);
  };

  const startAutoPlay = () => {
    const songs = musicListRef.current;

    if (
      !songs.length ||
      !playerRef.current ||
      !isReadyRef.current ||
      !autoPlayRef.current
    ) {
      return;
    }

    const index = getRandomIndex();

    currentIndexRef.current = index;

    const song = songs[index];

    setCurrentSong(song);

    try {
      playerRef.current.stopVideo();
      playerRef.current.loadVideoById(song.videoId);
    } catch {}
  };

  const initPlayer = () => {
    if (
      playerRef.current ||
      !window.YT?.Player ||
      !autoPlayRef.current
    ) {
      return;
    }

    playerRef.current = new window.YT.Player(
      "global-player",
      {
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
              event.data ===
                window.YT.PlayerState.ENDED &&
              autoPlayRef.current
            ) {
              playNextSong();
            }
          },
        },
      }
    );
  };

  /*
   * YOUTUBE API IS ALSO LAZY.
   *
   * It is not loaded until autoPlay is actually ON.
   */
  useEffect(() => {
    if (!autoPlay) return;

    if (window.YT?.Player) {
      initPlayer();
      return;
    }

    if (!document.getElementById("yt-api")) {
      const tag = document.createElement("script");

      tag.id = "yt-api";
      tag.src =
        "https://www.youtube.com/iframe_api";

      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = initPlayer;
  }, [autoPlay]);

  /*
   * Keep current song synchronized with the player.
   */
  useEffect(() => {
    if (!currentSong?.videoId) return;

    if (
      !playerRef.current ||
      !isReadyRef.current ||
      !autoPlay
    ) {
      return;
    }

    try {
      playerRef.current.loadVideoById(
        currentSong.videoId
      );
    } catch {}
  }, [currentSong, autoPlay]);

  /*
   * Start music when the toggle becomes enabled.
   * Stop everything when disabled.
   */
  useEffect(() => {
    if (!autoPlay) {
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo();
        } catch {}
      }

      currentIndexRef.current = -1;
      setCurrentSong(null);

      return;
    }

    if (
      isMusicReady &&
      playerRef.current &&
      isReadyRef.current
    ) {
      startAutoPlay();
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

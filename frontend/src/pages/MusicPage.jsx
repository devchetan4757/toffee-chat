import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const MusicPage = () => {
  const [music, setMusic] = useState([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const [autoPlay, setAutoPlay] = useState(true);
  const playerRef = useRef(null);

  // ✅ YouTube URL validator
  const isValidYouTubeUrl = (url) => {
    const regex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return regex.test(url);
  };

  const fetchMusic = async () => {
    const res = await axiosInstance.get("/music");
    setMusic(res.data);
  };

  useEffect(() => {
    fetchMusic();
  }, []);

  // INIT PLAYER ONLY IN AUTO MODE
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        autoPlay &&
        window.YT &&
        window.YT.Player &&
        music.length &&
        !playerRef.current
      ) {
        initPlayer();
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [music, autoPlay]);

  const initPlayer = () => {
    playerRef.current = new window.YT.Player("yt-player", {
      height: "220",
      width: "100%",
      videoId: music[0]?.videoId,
      events: {
        onStateChange: onStateChange,
      },
    });
  };

  const onStateChange = (event) => {
    if (event.data === window.YT.PlayerState.ENDED && autoPlay) {
      nextSong();
    }
  };

  const nextSong = () => {
    setMusic((prev) => {
      const next = [...prev];
      const first = next.shift();
      next.push(first);
      playerRef.current.loadVideoById(next[0].videoId);
      return next;
    });
  };

  // 🎧 ADD MUSIC WITH VALIDATION + TOAST
  const addMusic = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      toast.error("Invalid YouTube URL");
      return;
    }

    try {
      await axiosInstance.post("/music/add", {
        url,
        title: title || "Untitled Song",
        showVideo: true,
      });

      toast.success("Music added 🎧");

      setUrl("");
      setTitle("");
      fetchMusic();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to add music"
      );
    }
  };

  const deleteMusic = async (id) => {
    try {
      await axiosInstance.delete(`/music/${id}`);
      toast.success("Deleted");
      fetchMusic();
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="p-4 space-y-4 pt-[120px]">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">🎧 Music Player</h2>

        <span className="text-xs opacity-60">
          {autoPlay ? "Auto Mode" : "Manual Mode"}
        </span>
      </div>

      {/* INPUT ROW */}
      <div className="flex gap-2 items-center">

        {/* TITLE */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="input input-bordered flex-[1] min-w-0"
        />

        {/* URL */}
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="YouTube URL"
          className="input input-bordered flex-[2] min-w-0"
        />

        {/* ADD */}
        <button
          className="btn btn-sm btn-primary flex-shrink-0"
          onClick={addMusic}
        >
          Add
        </button>

        {/* AUTO / MANUAL */}
        <button
          className={`btn btn-sm flex-shrink-0 ${
            autoPlay ? "btn-success" : "btn-warning"
          }`}
          onClick={() => {
            setAutoPlay(!autoPlay);
            playerRef.current = null;
          }}
        >
          {autoPlay ? "Auto" : "Manual"}
        </button>

      </div>

      {/* AUTO MODE PLAYER */}
      {autoPlay && (
        <div className="bg-base-200 p-3 rounded-lg">
          <div id="yt-player"></div>
        </div>
      )}

      {/* MANUAL MODE */}
      {!autoPlay && (
        <div className="space-y-4">

          {music.map((m) => (
            <div
              key={m._id}
              className="bg-base-200 p-3 rounded-lg"
            >

              {/* TITLE + USER */}
              <div className="flex justify-between mb-2">
                <p className="font-semibold truncate">
                  🎵 {m.title}
                </p>

                <span className="text-xs opacity-60">
                  {m.userId}
                </span>
              </div>

              {/* VIDEO */}
              <div className="w-full h-[200px] rounded-md overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${m.videoId}`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
              </div>

              {/* DELETE */}
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => deleteMusic(m._id)}
                  className="btn btn-xs btn-error"
                >
                  Delete
                </button>
              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
};

export default MusicPage;

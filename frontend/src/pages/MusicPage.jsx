import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const MusicPage = ({
  setCurrentSong,
  autoPlay,
  setAutoPlay,
}) => {
  const [music, setMusic] = useState([]);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");

  const isValidYouTubeUrl = (url) => {
    const regex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return regex.test(url);
  };

  const fetchMusic = async () => {
    try {
      const res = await axiosInstance.get("/music");
      setMusic(res.data);
    } catch {
      toast.error("Failed to load music");
    }
  };

  useEffect(() => {
    fetchMusic();
  }, []);

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

      toast.success("Music added");
      setUrl("");
      setTitle("");
      fetchMusic();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Failed to add music"
      );
    }
  };

  const deleteMusic = async (id) => {
    try {
      await axiosInstance.delete(`/music/${id}`);
      toast.success("Deleted");
      fetchMusic();
    } catch {
      toast.error("Delete failed");
    }
  };

  const playSong = (song) => {
    setCurrentSong(song);
    toast.success(`Playing: ${song.title}`);
  };

  return (
    <div className="p-4 space-y-2 mt-15">

      {/* HEADER */}
      <div className="flex items-center pl-7 h-20">
        <h2 className="text-xl font-bold bg-base-200 px-3 py-1 rounded-md">
          MUSIC PLAYER
        </h2>
      </div>

      {/* INPUT */}
      <div className="flex gap-2 items-center">

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Title"
          className="input input-bordered flex-[1] min-w-0"
        />

        <input
          value={url}
          onChange={(e) =>
            setUrl(e.target.value)
          }
          placeholder="YouTube URL"
          className="input input-bordered flex-[2] min-w-0"
        />

        <button
          className="btn btn-sm btn-primary flex-shrink-0"
          onClick={addMusic}
        >
          Add
        </button>
      </div>

      {/* SONG LIST */}
      <div className="space-y-4">

        {music.map((m) => (
          <div
            key={m._id}
            className="bg-base-200 p-3 rounded-lg"
          >

            <div className="flex justify-between mb-2">
              <p className="font-semibold truncate">
                {m.title}
              </p>

              <span className="text-xs opacity-60">
                {m.userId}
              </span>
            </div>

            <div className="w-full h-[200px] rounded-md overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${m.videoId}?mute=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>

            <div className="flex justify-between mt-2">

              <button
                onClick={() =>
                  playSong(m)
                }
                className="btn btn-xs btn-success"
              >
                Play
              </button>

              <button
                onClick={() =>
                  deleteMusic(m._id)
                }
                className="btn btn-xs btn-error"
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
};

export default MusicPage;

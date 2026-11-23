import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { Headphones, Music2, Plus, Trash2, Youtube } from "lucide-react";

const MusicPage = () => {
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

  return (
    <div className="min-h-screen bg-base-200/50 px-4 pb-10 pt-20">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-info/10 text-info">
            <Headphones className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold sm:text-2xl">Music library</h1>
            <p className="mt-1 text-sm text-base-content/65">
              Save and revisit music shared with your chat.
            </p>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-full bg-base-200 px-3 py-1.5 text-xs font-medium text-base-content/70 sm:flex">
            <Music2 className="h-3.5 w-3.5" />
            {music.length} {music.length === 1 ? "track" : "tracks"}
          </span>
        </header>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </span>
            <div>
              <h2 className="font-semibold">Add a song</h2>
              <p className="text-xs text-base-content/60">Paste a YouTube link to add it to the library.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
            <label className="form-control min-w-0">
              <span className="mb-1.5 text-xs font-medium text-base-content/65">Song title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title (optional)"
                className="input input-bordered w-full bg-base-100"
              />
            </label>

            <label className="form-control min-w-0">
              <span className="mb-1.5 text-xs font-medium text-base-content/65">YouTube URL</span>
              <div className="relative">
                <Youtube className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/45" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="input input-bordered w-full bg-base-100 pl-10"
                  type="url"
                />
              </div>
            </label>

            <div className="flex items-end">
              <button
                className="btn btn-primary w-full sm:w-auto"
                onClick={addMusic}
              >
                <Plus className="h-4 w-4" />
                Add song
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Saved tracks</h2>
            <span className="text-xs text-base-content/55 sm:hidden">
              {music.length} {music.length === 1 ? "track" : "tracks"}
            </span>
          </div>

          {music.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {music.map((m) => (
                <article
                  key={m._id}
                  className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex min-w-0 items-center gap-3 p-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Music2 className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{m.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-base-content/55">
                        Added by {m.userId}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteMusic(m._id)}
                      className="btn btn-ghost btn-sm btn-circle text-base-content/55 hover:bg-error/10 hover:text-error"
                      aria-label={`Delete ${m.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="aspect-video w-full overflow-hidden border-t border-base-200 bg-base-200">
                    <iframe
                      title={`YouTube player for ${m.title}`}
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${m.videoId}?rel=0`}
                      allow="encrypted-media"
                      allowFullScreen
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100 px-4 text-center">
              <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-base-200 text-base-content/50">
                <Music2 className="h-5 w-5" />
              </span>
              <p className="font-semibold">Your library is empty</p>
              <p className="mt-1 text-sm text-base-content/60">
                Add a YouTube link above to save the first track.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default MusicPage;

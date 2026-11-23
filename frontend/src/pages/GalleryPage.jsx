import { Link, useLocation } from "react-router-dom";
import { Film, Image, Images } from "lucide-react";
import ImageGallery from "../components/ImageGallery";

const GalleryPage = () => {
  const location = useLocation();
  const sectionParam = new URLSearchParams(location.search).get("section");
  const section =
    sectionParam === "photo" || sectionParam === "video"
      ? sectionParam === "photo"
        ? "image"
        : "video"
      : "all";
  const activeSection =
    section === "image" ? "photo" : section === "video" ? "video" : "all";

  return (
    <div className="min-h-screen bg-base-200/50 px-4 pb-10 pt-20">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-col gap-5 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Images className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold sm:text-2xl">Media gallery</h1>
              <p className="mt-1 text-sm text-base-content/65">
                {section === "image"
                  ? "Photos shared in chat"
                  : section === "video"
                    ? "Videos shared in chat"
                    : "Photos and videos shared in chat"}
              </p>
            </div>
          </div>

          <nav
            aria-label="Gallery filters"
            className="flex w-full items-center gap-1 rounded-xl border border-base-300 bg-base-200/60 p-1 sm:w-auto"
          >
            {[
              { id: "all", label: "All media", to: "/gallery", Icon: Images },
              { id: "photo", label: "Photos", to: "/gallery?section=photo", Icon: Image },
              { id: "video", label: "Videos", to: "/gallery?section=video", Icon: Film },
            ].map(({ id, label, to, Icon }) => (
              <Link
                key={id}
                to={to}
                aria-current={activeSection === id ? "page" : undefined}
                className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none ${
                  activeSection === id
                    ? "bg-base-100 text-primary shadow-sm"
                    : "text-base-content/65 hover:bg-base-100/70 hover:text-base-content"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            ))}
          </nav>
        </header>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:p-6">
          <ImageGallery section={section} />
        </section>
      </div>
    </div>
  );
};

export default GalleryPage;

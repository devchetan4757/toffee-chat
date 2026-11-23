import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useLocation } from "react-router-dom";
import { useChatStore } from "../store/useChatStore";
import {
  LogOut,
  Settings,
  Image,
  MoreVertical,
  Home,
  Video,
  Music2,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

const Navbar = ({ autoPlay, setAutoPlay }) => {
  const { logout, isAuthenticated, authUser, otherUser } = useAuthStore();

  // FIX: prevent crash if undefined
  const {
    onlineUsers = [],
    searchMessages,
    loadMessagesAround,
  } = useChatStore();

  const location = useLocation();
  const isMusicPage = location.pathname === "/music";

  const handleLogout = async () => {
    try {
      window.location.replace("/login");
      await logout();
    } catch (err) {
      console.log(err);
    }
  };


  // ✅ NEW PFP SYSTEM (Cloudinary from backend)
  const pfp = authUser?.pfp;
  
  // if you still need online indicator logic
const otherOn =
  otherUser?.role && onlineUsers.includes(otherUser.role);

  const menuLinkClass = (active) =>
    `group flex items-center gap-2.5 rounded-xl px-2 py-1.5 text-sm transition-colors ${
      active
        ? "bg-primary/10 text-primary"
        : "text-base-content hover:bg-base-200"
    }`;
  
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const [localAutoPlay, setLocalAutoPlay] = useState(autoPlay);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);
  const [searchCursor, setSearchCursor] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setLocalAutoPlay(autoPlay);
  }, [autoPlay]);

  useEffect(() => {
    if (!searchOpen) return;

    searchInputRef.current?.focus();
    const handleOutsideClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setSearchOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [searchOpen]);

  const handleAutoToggle = () => {
    if (isMusicPage) return;
    setLocalAutoPlay((prev) => !prev);
    setAutoPlay((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const showSearchResult = async (index, results = searchResults) => {
    const result = results[index];
    if (!result) return;

    setIsSearching(true);
    try {
      if (await loadMessagesAround(result._id)) {
        setActiveSearchIndex(index);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    setSearchResults([]);
    setActiveSearchIndex(-1);
    setHasMoreSearchResults(false);
    setSearchCursor(null);

    try {
      const page = await searchMessages(query);
      if (!page) return;

      const results = page.messages || [];
      setSearchResults(results);
      setHasMoreSearchResults(page.hasMore);
      setSearchCursor(page.nextCursor || null);

      if (results.length) {
        await showSearchResult(0, results);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const showNewerSearchResult = () => {
    if (activeSearchIndex > 0) {
      showSearchResult(activeSearchIndex - 1);
    }
  };

  const showOlderSearchResult = async () => {
    if (activeSearchIndex + 1 < searchResults.length) {
      await showSearchResult(activeSearchIndex + 1);
      return;
    }

    if (!hasMoreSearchResults || !searchCursor || isSearching) return;

    setIsSearching(true);
    try {
      const page = await searchMessages(
        searchQuery.trim(),
        searchCursor
      );
      if (!page) return;

      const results = [...searchResults, ...(page.messages || [])];
      setSearchResults(results);
      setHasMoreSearchResults(page.hasMore);
      setSearchCursor(page.nextCursor || null);
      if (results.length > searchResults.length) {
        await showSearchResult(searchResults.length, results);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="fixed top-0 z-40 w-full border-b border-base-300/80 bg-base-100/95 shadow-sm backdrop-blur-md">
      <div className="container mx-auto h-16 px-3 sm:px-4">
        <div className="flex items-center justify-between h-full">

          {/* LEFT */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <img
                src={pfp || "/default.png"}
                alt="logo"
                className="h-10 w-10 rounded-full border border-base-300 object-cover"
              />
              <h2 className="text-base font-semibold tracking-tight text-base-content">You</h2>
            </Link>
          </div>

          {/* MUSIC TOGGLE */}
          <div className="flex items-center gap-2 rounded-full border border-base-300/70 bg-base-200/70 px-3 py-1 shadow-sm">
            <span
              className={`hidden text-xs font-semibold transition-colors sm:inline ${
                localAutoPlay
                  ? "text-primary"
                  : "text-base-content/70"
              }`}
            >
              Music
            </span>

            <div className="relative flex items-center">
              <input
                type="checkbox"
                className={`toggle toggle-primary toggle-sm transition-colors duration-200 ${
                  isMusicPage ? "opacity-40 cursor-not-allowed" : ""
                }`}
                checked={localAutoPlay}
                onChange={handleAutoToggle}
                disabled={isMusicPage}
              />

              {isMusicPage && (
                <div className="absolute -top-1 -right-2 text-xs">🔒</div>
              )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated && (
              <>
                {otherUser && (
                  <div className="rounded-full border border-base-300/70 bg-base-200/70 p-1">
                    <div className="relative">
                      <img
                        src={otherUser.pfp}
                        alt="Other user"
                        className={`h-8 w-8 rounded-full object-cover ${
                          otherOn ? "grayscale-0" : "grayscale"
                        }`}
                      />
                      <span
                        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-base-100 ${
                          otherOn ? "bg-success" : "bg-base-300"
                        }`}
                        aria-label={otherOn ? "Online" : "Offline"}
                      />
                    </div>
                  </div>
                )}
                {location.pathname === "/home" && (
                  <div ref={searchRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setSearchOpen((value) => !value)}
                      className="btn btn-sm btn-ghost btn-circle border border-base-300/70"
                      aria-label="Search chat messages"
                      aria-expanded={searchOpen}
                    >
                      <Search className="w-5 h-5" />
                    </button>

                    {searchOpen && (
                      <div className="fixed right-2 top-[4.5rem] z-50 w-[calc(100vw-1rem)] max-w-sm rounded-box border border-base-300 bg-base-100 p-3 shadow-xl md:absolute md:right-0 md:top-full md:mt-2 md:w-96 md:max-w-none">
                        <form
                          onSubmit={handleSearchSubmit}
                          className="flex items-center gap-2"
                          role="search"
                          aria-label="Search chat messages"
                        >
                          <input
                            ref={searchInputRef}
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            className="input input-sm input-bordered min-w-0 flex-1"
                            placeholder="Search messages"
                            maxLength={100}
                          />
                          <button
                            type="submit"
                            className="btn btn-sm btn-primary"
                            disabled={isSearching || !searchQuery.trim()}
                            aria-label="Search"
                          >
                            {isSearching ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              <Search className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setSearchOpen(false)}
                            className="btn btn-sm btn-ghost btn-circle"
                            aria-label="Close search"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </form>

                        {searchResults.length > 0 && activeSearchIndex >= 0 ? (
                          <div className="mt-3 flex items-center gap-2">
                            <p className="min-w-0 flex-1 text-sm line-clamp-2 break-words">
                              {searchResults[activeSearchIndex]?.text}
                            </p>
                            <span
                              className={`badge badge-xs shrink-0 ${
                                searchResults[activeSearchIndex]?.matchType === "exact"
                                  ? "badge-primary"
                                  : "badge-ghost"
                              }`}
                            >
                              {searchResults[activeSearchIndex]?.matchType === "exact"
                                ? "Exact"
                                : "Contains"}
                            </span>
                            <span className="shrink-0 text-xs opacity-70">
                              {activeSearchIndex + 1}/{searchResults.length}
                              {hasMoreSearchResults ? "+" : ""}
                            </span>
                            <button
                              type="button"
                              onClick={showNewerSearchResult}
                              className="btn btn-xs btn-ghost btn-circle"
                              disabled={isSearching || activeSearchIndex === 0}
                              aria-label="Newer matching message"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={showOlderSearchResult}
                              className="btn btn-xs btn-ghost btn-circle"
                              disabled={
                                isSearching ||
                                (!hasMoreSearchResults &&
                                  activeSearchIndex >= searchResults.length - 1)
                              }
                              aria-label="Older matching message"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          !isSearching &&
                          searchQuery.trim() && (
                            <p className="mt-3 text-sm opacity-70">
                              No matching messages
                            </p>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
                {/* DROPDOWN */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setOpen((prev) => !prev)}
                    className="btn btn-sm btn-ghost btn-circle border border-base-300/70"
                    aria-label="Open menu"
                    aria-expanded={open}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {open && (
                    <div className="absolute right-0 z-50 mt-2 w-52 rounded-2xl border border-base-300 bg-base-100 p-1.5 shadow-xl">
                      <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-base-content/50">
                        Explore
                      </p>

                      <Link
                        to="/"
                        onClick={() => setOpen(false)}
                        className={menuLinkClass(location.pathname === "/")}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-105">
                          <Home className="h-4 w-4" />
                        </span>
                        <span className="flex-1 font-medium">Home</span>
                        <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                      </Link>

                      <Link
                        to="/gallery?section=photo"
                        onClick={() => setOpen(false)}
                        className={menuLinkClass(location.pathname === "/gallery" && location.search.includes("photo"))}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary/10 text-secondary transition-transform group-hover:scale-105">
                          <Image className="h-4 w-4" />
                        </span>
                        <span className="flex-1 font-medium">Photos</span>
                        <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                      </Link>

                      <Link
                        to="/gallery?section=video"
                        onClick={() => setOpen(false)}
                        className={menuLinkClass(location.pathname === "/gallery" && location.search.includes("video"))}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent transition-transform group-hover:scale-105">
                          <Video className="h-4 w-4" />
                        </span>
                        <span className="flex-1 font-medium">Videos</span>
                        <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                      </Link>

                      <Link
                        to="/music"
                        onClick={() => setOpen(false)}
                        className={menuLinkClass(location.pathname === "/music")}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-info/10 text-info transition-transform group-hover:scale-105">
                          <Music2 className="h-4 w-4" />
                        </span>
                        <span className="flex-1 font-medium">Music</span>
                        <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setOpen(false)}
                        className={menuLinkClass(location.pathname === "/settings")}
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-warning/10 text-warning transition-transform group-hover:scale-105">
                          <Settings className="h-4 w-4" />
                        </span>
                        <span className="flex-1 font-medium">Settings</span>
                        <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                      </Link>

                      <button
                        onClick={() => {
                          setOpen(false);
                          handleLogout();
                        }}
                        className="group mt-1 flex w-full items-center gap-2.5 rounded-xl border-t border-base-200 px-2 py-2 text-left text-sm text-error transition-colors hover:bg-error/10"
                      >
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-error/10 text-error transition-transform group-hover:scale-105">
                          <LogOut className="h-4 w-4" />
                        </span>
                        <span className="flex-1 font-medium">Log out</span>
                        <ChevronRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-0.5" />
                      </button>

                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;

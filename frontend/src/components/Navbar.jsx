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
  Search,
  ChevronUp,
  ChevronDown,
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

    try {
      const page = await searchMessages(query);
      if (!page) return;

      const results = page.messages || [];
      setSearchResults(results);
      setHasMoreSearchResults(page.hasMore);

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

    if (!hasMoreSearchResults || !searchResults.length || isSearching) return;

    setIsSearching(true);
    try {
      const page = await searchMessages(
        searchQuery.trim(),
        searchResults[searchResults.length - 1]._id
      );
      if (!page) return;

      const results = [...searchResults, ...(page.messages || [])];
      setSearchResults(results);
      setHasMoreSearchResults(page.hasMore);
      if (results.length > searchResults.length) {
        await showSearchResult(searchResults.length, results);
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <header className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 backdrop-blur-lg bg-base-100/80">
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">

          {/* LEFT */}
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              {/* ✅ Cloudinary PFP */}
              <img
                src={pfp || "/default.png"}
                alt="logo"
                className="w-11 h-11 object-cover bg-gray-200 rounded-lg"
              />
              <h2 className="text-lg font-bold">You</h2>
            </Link>
          </div>

          {/* MUSIC TOGGLE */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-base-200 opacity-90">
            <span
              className={`text-xs font-bold transition-all duration-300 ${
                localAutoPlay
                  ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-[length:200%_200%] animate-gradient-x opacity-100"
                  : "text-base-content opacity-70"
              }`}
            >
              Music
            </span>

            <div className="relative flex items-center">
              <input
                type="checkbox"
                className={`toggle toggle-success toggle-sm transition-all duration-700 ease-in-out ${
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
          <div className="flex items-center gap-0">
            {isAuthenticated && (
              <>
           {otherUser && (
  <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-base-200 opacity-90">
    <img
      src={otherUser.pfp}
      alt="Other User"
      className={`h-7 w-7 rounded-full object-cover ${
        otherOn ? "grayscale-0" : "grayscale-[100%]"
      }`}
    />
  </div>
)}
                {location.pathname === "/home" && (
                  <div ref={searchRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setSearchOpen((value) => !value)}
                      className="btn btn-sm btn-ghost btn-circle"
                      aria-label="Search chat messages"
                      aria-expanded={searchOpen}
                    >
                      <Search className="w-5 h-5" />
                    </button>

                    {searchOpen && (
                      <div className="absolute right-0 top-full mt-2 z-50 w-[min(24rem,calc(100vw-1rem))] rounded-box border border-base-300 bg-base-100 p-3 shadow-xl">
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
                    className="btn btn-sm btn-ghost"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {open && (
                    <div className="absolute right-0 mt-2 bg-base-100 shadow rounded-box w-40 z-50">

                      <Link to="/" onClick={() => setOpen(false)} className="flex gap-2 p-2 hover:bg-base-200">
                        <Home className="w-4 h-4" />
                        Home
                      </Link>

                      <Link to="/gallery?section=photo" onClick={() => setOpen(false)} className="flex gap-2 p-2 hover:bg-base-200">
                        <Image className="w-4 h-4" />
                        Photos
                      </Link>

                      <Link to="/gallery?section=video" onClick={() => setOpen(false)} className="flex gap-2 p-2 hover:bg-base-200">
                        <span aria-hidden="true">🎬</span>
                        Videos
                      </Link>

                      <Link to="/music" className="flex gap-2 p-2 hover:bg-base-200">
                        🎵 Music
                      </Link>

                      <Link to="/settings" onClick={() => setOpen(false)} className="flex gap-2 p-2 hover:bg-base-200">
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                      <button
                        onClick={() => {
                          setOpen(false);
                          handleLogout();
                        }}
                        className="flex gap-2 p-2 w-full text-left hover:bg-red-100 text-red-500"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
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

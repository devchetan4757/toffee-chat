import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { LogOut, Settings, Image, MoreVertical, Home } from "lucide-react";
import { useState, useEffect, useRef } from "react";

import Rotlupfp from "../pfp/Rotlu.png";
import Chsmishpfp from "../pfp/Chsmish.png";

const Navbar = () => {
  const { role, logout, isAuthenticated } = useAuthStore();
  const { onlineUsers } = useChatStore();

  const handleLogout = async () => {
    await logout();
  };

  const otherRole =
    role === "Chsmish"
      ? "Rotlu"
      : role === "Rotlu"
      ? "Chsmish"
      : null;

  const pfp =
    otherRole === "Chsmish"
      ? Rotlupfp
      : Chsmishpfp;

  const otherPfp =
    otherRole === "Chsmish"
      ? Chsmishpfp
      : Rotlupfp;

  const otherOn =
    otherRole && onlineUsers.includes(otherRole);

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

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
              <img
                src={pfp}
                alt="logo"
                className="w-11 h-12 object-contain bg-gray-200 rounded-lg"
              />
              <h2 className="text-lg font-bold">You</h2>
            </Link>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                {/* OTHER USER */}
                {otherRole && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-base-200 opacity-90">
                    <img
                      src={otherPfp}
                      alt="logo"
                      className={`h-5 w-5 rounded-full ${
                        otherOn
                          ? "grayscale-0"
                          : "grayscale-[100%]"
                      }`}
                    />
                    <span className="font-medium">
                      {otherRole}
                    </span>
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

                      {/* HOME */}
                      <Link
                        to="/"
                        onClick={() => setOpen(false)}
                        className="flex gap-2 p-2 hover:bg-base-200"
                      >
                        <Home className="w-4 h-4" />
                        Home
                      </Link>

                      {/* MEDIA */}
                      <Link
                        to="/gallery"
                        onClick={() => setOpen(false)}
                        className="flex gap-2 p-2 hover:bg-base-200"
                      >
                        <Image className="w-4 h-4" />
                        Media
                      </Link>

                      {/* SETTINGS */}
                      <Link
                        to="/settings"
                        onClick={() => setOpen(false)}
                        className="flex gap-2 p-2 hover:bg-base-200"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </Link>

                    </div>
                  )}
                </div>

                {/* LOGOUT */}
                <button
                  className="flex gap-2 items-center"
                  onClick={handleLogout}
                >
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">
                    Logout
                  </span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;

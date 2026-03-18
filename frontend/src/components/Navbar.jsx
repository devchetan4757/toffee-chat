import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { LogOut, Settings, Image } from "lucide-react"; // ✅ added Image
import Rotlupfp from "../pfp/Rotlu.png";
import Chsmishpfp from "../pfp/Chsmish.png";

const Navbar = () => {

  const { role, logout, isAuthenticated } = useAuthStore();
  const { onlineUsers, isTyping } = useChatStore();

  const handleLogout = async () => {
    await logout();
  };

  // Determine the other user
  const otherRole =
    role === "Chsmish"
      ? "Rotlu"
      : role === "Rotlu"
      ? "Chsmish"
      : null;

  // Select correct profile image
  const pfp =
    otherRole === "Chsmish"
      ? Rotlupfp
      : Chsmishpfp;

  // Check if other user is online
  const otherOn =
    otherRole && onlineUsers.includes(otherRole);

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

                {/* OTHER USER STATUS */}
                {otherRole && (
                  <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-base-200 opacity-90">

                    {/* ONLINE DOT */}
                    <span
                      className={`h-2 w-2 rounded-full ${
                        otherOn
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />

                    {/* NAME / TYPING */}
                    <span className="font-medium">
                      {isTyping
                        ? `typing...`
                        : otherRole}
                    </span>

                  </div>
                )}

                {/* MEDIA ✅ ADDED */}
                <Link
                  to="/gallery"
                  className="btn btn-sm gap-2 transition-colors"
                >
                  <Image className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    Media
                  </span>
                </Link>

                {/* SETTINGS */}
                <Link
                  to="/settings"
                  className="btn btn-sm gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    Settings
                  </span>
                </Link>

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

import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, MessageSquare, Settings, Users } from "lucide-react";

const Navbar = () => {
  const { logout, isAuthenticated, onlineUsersCount } = useAuthStore();

  const handleLogout = async () => {
    await logout(); // toast & socket disconnect handled in store
  };

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40
      backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="flex items-center gap-2.5 hover:opacity-80 transition-all"
            >
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Baatey!</h1>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated && (
              <>
                {/* Online users display */}
                <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-base-200 text-base-content text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                  </span>

                  <Users className="w-4 h-4 opacity-70" />
                  <span className="font-medium">{onlineUsersCount} online</span>
                </div>

                <Link
                  to={"/settings"}
                  className="btn btn-sm gap-2 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </Link>

                <button
                  className="flex gap-2 items-center"
                  onClick={handleLogout}
                >
                  <LogOut className="size-5" />
                  <span className="hidden sm:inline">Logout</span>
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

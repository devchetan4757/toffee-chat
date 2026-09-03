import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MusicPage from "./pages/MusicPage";
import GlobalMusicPlayer from "./components/GlobalMusicPlayer";

import { useThemeStore } from "./store/useThemeStore";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";

import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import HomePage from "./pages/HomePage";
import GalleryPage from "./pages/GalleryPage";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const { theme } = useThemeStore();
  const { checkAuth, isAuthenticated, role } = useAuthStore();
  const { initSocket } = useChatStore();

  const location = useLocation();

  const [authReady, setAuthReady] = useState(false);

  const [currentSong, setCurrentSong] = useState(() => {
    const saved = localStorage.getItem("currentSong");
    return saved ? JSON.parse(saved) : null;
  });

  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setAuthReady(true);
    };

    init();
  }, []);

  useEffect(() => {
    if (isAuthenticated && authReady) {
      return initSocket();
    }
  }, [isAuthenticated, authReady]);

  useEffect(() => {
    localStorage.setItem("musicAutoPlay", JSON.stringify(false));
  }, []);

  useEffect(() => {
    if (currentSong) {
      localStorage.setItem(
        "currentSong",
        JSON.stringify(currentSong)
      );
    }
  }, [currentSong]);

  useEffect(() => {
    if (location.pathname === "/music") {
      setAutoPlay(false);
    }
  }, [location.pathname]);

  return (
    <>
      <Toaster position="top-center" />

      <div data-theme={theme}>
        {authReady && isAuthenticated && (
          <Navbar
            autoPlay={autoPlay}
            setAutoPlay={setAutoPlay}
          />
        )}

        {authReady &&
          isAuthenticated &&
          role &&
          location.pathname !== "/home" &&
          autoPlay && (
            <GlobalMusicPlayer
              currentSong={currentSong}
              setCurrentSong={setCurrentSong}
              autoPlay={autoPlay}
            />
          )}

        <div
          className={
            isAuthenticated
              ? "pt-10 min-h-screen"
              : ""
          }
        >
          <Routes>
            <Route
              path="/login"
              element={<LoginPage />}
            />

            <Route
              path="/settings"
              element={<SettingsPage />}
            />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <GalleryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/music"
              element={
                <ProtectedRoute>
                  <MusicPage
                    setCurrentSong={setCurrentSong}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <Navigate
                  to={
                    isAuthenticated
                      ? "/home"
                      : "/login"
                  }
                />
              }
            />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;

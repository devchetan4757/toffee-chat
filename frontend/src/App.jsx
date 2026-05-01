import { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "react-h5-audio-player/lib/styles.css";

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
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { initSocket } = useChatStore();

  // ✅ ROUTE LOCATION
  const location = useLocation();

  // ✅ KEEP SAVED SONG
  const [currentSong, setCurrentSong] = useState(() => {
    const saved =
      localStorage.getItem("currentSong");

    return saved
      ? JSON.parse(saved)
      : null;
  });

  // ✅ FORCE DEFAULT AUTO OFF
  const [autoPlay, setAutoPlay] =
    useState(false);

  // AUTH
  useEffect(() => {
    checkAuth();
  }, []);

  // SOCKET
  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = initSocket();
      return cleanup;
    }
  }, [isAuthenticated]);

  // ✅ CLEAR OLD SAVED AUTOPLAY ON FIRST LOAD
  useEffect(() => {
    localStorage.setItem(
      "musicAutoPlay",
      JSON.stringify(false)
    );
  }, []);

  // ✅ SAVE SONG
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem(
        "currentSong",
        JSON.stringify(currentSong)
      );
    }
  }, [currentSong]);

  // ✅ SAVE CURRENT AUTOPLAY STATE
  useEffect(() => {
    localStorage.setItem(
      "musicAutoPlay",
      JSON.stringify(autoPlay)
    );
  }, [autoPlay]);

  // ✅ ENTERING MUSIC TAB = FORCE OFF
  useEffect(() => {
    if (
      location.pathname === "/music"
    ) {
      setAutoPlay(false);
    }
  }, [location.pathname]);

  return (
    <>
      <Toaster position="top-center" />

      <div data-theme={theme}>
        {/* GLOBAL PLAYER */}
        <GlobalMusicPlayer
          currentSong={currentSong}
          setCurrentSong={setCurrentSong}
          autoPlay={autoPlay}
        />

        {/* NAVBAR */}
        {isAuthenticated && (
          <Navbar
            autoPlay={autoPlay}
            setAutoPlay={setAutoPlay}
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
                    setCurrentSong={
                      setCurrentSong
                    }
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

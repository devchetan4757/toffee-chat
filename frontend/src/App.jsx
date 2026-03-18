import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "react-h5-audio-player/lib/styles.css";

import { useThemeStore } from "./store/useThemeStore";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";

import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import HomePage from "./pages/HomePage";
import GalleryPage from "./pages/GalleryPage"; // ✅ ADDED

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {

  const { theme } = useThemeStore();
  const { checkAuth, isAuthenticated } = useAuthStore();
  const { initSocket } = useChatStore();

  // Check auth on load
  useEffect(() => {
    checkAuth();
  }, []);

  // Start socket AFTER login
  useEffect(() => {
    if (isAuthenticated) {
      const cleanup = initSocket();
      return cleanup;
    }
  }, [isAuthenticated]);

  return (
    <>
      <Toaster position="top-center" />

      <div data-theme={theme}>
        {isAuthenticated && <Navbar />}

        <div className={isAuthenticated ? "pt-5 h-screen" : ""}>
          <Routes>

            <Route path="/login" element={<LoginPage />} />

            <Route path="/settings" element={<SettingsPage />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            {/* ✅ GALLERY ROUTE ADDED */}
            <Route
              path="/gallery"
              element={
                <ProtectedRoute>
                  <GalleryPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                <Navigate to={isAuthenticated ? "/home" : "/login"} />
              }
            />

          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;

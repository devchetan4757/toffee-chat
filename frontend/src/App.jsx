import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { useThemeStore } from "./store/useThemeStore";
import { useAuthStore } from "./store/useAuthStore";

import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import HomePage from "./pages/HomePage";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  const { theme } = useThemeStore();
  const { checkAuth, isAuthenticated } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
      <Toaster position="top-center" />

      {/* Root wrapper */}
      <div data-theme={theme} className="min-h-[100dvh]">
        {/* Fixed navbar */}
        {isAuthenticated && <Navbar />}

        {/* App content */}
        <div className={isAuthenticated ? "pt-16 h-[100dvh]" : ""}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <HomePage />
                </ProtectedRoute>
              }
            />

            <Route path="/settings" element={<SettingsPage />} />

            {/* Default redirect */}
            <Route
              path="*"
              element={<Navigate to={isAuthenticated ? "/home" : "/login"} />}
            />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;

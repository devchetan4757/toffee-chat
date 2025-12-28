import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Loader } from "lucide-react";

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
  }, []);

  return (
    <>
  
      <Toaster position="top-center" />

      <div data-theme={theme}>
        {isAuthenticated && <Navbar />}

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

          {/* Default redirect */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/home" : "/login"} />}
          />
        </Routes>
      </div>
    </>
  );
};

export default App;

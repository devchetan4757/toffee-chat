import { useState } from "react";
import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Candy,
} from "lucide-react";

import { useAuthStore } from "../store/useAuthStore";

const LoginPage = () => {
  const [showPassword, setShowPassword] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const {
    login,
    isLoggingIn,
    isAuthenticated,
  } = useAuthStore();

  const navigate =
    useNavigate();

  if (isAuthenticated) {
    return (
      <Navigate
        to="/home"
        replace
      />
    );
  }

  const handleSubmit = async (
    e
  ) => {
    e.preventDefault();

    const success =
      await login({
        password,
      });

    if (success) {
      navigate("/home");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-amber-400 to-yellow-300 relative overflow-hidden px-4">

      {/* TOFFEE WRAPPER SHINE */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_8px,transparent_8px,transparent_18px)] opacity-30" />
        <div className="absolute top-0 left-[-20%] w-[140%] h-32 bg-white/20 blur-3xl rotate-6" />
        <div className="absolute bottom-0 right-[-20%] w-[140%] h-32 bg-red-500/10 blur-3xl -rotate-6" />
      </div>

      {/* FLOATING CANDY BLOBS */}
      <div className="absolute top-12 left-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-12 right-10 w-52 h-52 bg-yellow-100/30 rounded-full blur-3xl" />

      {/* MAIN CARD */}
      <div className="relative w-full max-w-md rounded-[2.5rem] bg-gradient-to-br from-orange-600 via-orange-500 to-amber-400 border-4 border-yellow-200 shadow-[0_20px_80px_rgba(255,120,0,0.45)] p-8">

        {/* GLOSS */}
        <div className="absolute top-4 left-4 right-4 h-20 bg-white/20 rounded-full blur-2xl" />

        {/* HEADER */}
        <div className="relative text-center mb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-yellow-200 border-4 border-white/60 flex items-center justify-center shadow-lg">
            <Candy className="w-10 h-10 text-orange-600" />
          </div>

          <h1 className="mt-4 text-4xl font-extrabold text-white drop-shadow-lg tracking-wide">
            ORANGE AREA
          </h1>

          <p className="text-yellow-100 font-semibold text-sm tracking-[0.25em] uppercase">
            Sweet Access
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={
            handleSubmit
          }
          className="space-y-6 relative"
        >

          {/* PASSWORD */}
          <div>
            <label className="block text-sm font-bold text-yellow-100 mb-2 uppercase tracking-wider">
              Secret Wrapper Code
            </label>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-700 w-5 h-5" />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                autoFocus
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="••••••••"
                required
                className="w-full rounded-2xl bg-yellow-50/90 text-orange-900 placeholder-orange-300 py-4 pl-12 pr-14 border-2 border-yellow-200 focus:outline-none focus:ring-4 focus:ring-yellow-300 shadow-inner"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={
                  isLoggingIn
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-700 hover:text-red-500"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={
              isLoggingIn ||
              !password.trim()
            }
            className="w-full rounded-2xl py-4 font-extrabold text-orange-700 uppercase tracking-[0.25em] bg-yellow-200 hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50"
          >
            {isLoggingIn ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="animate-spin w-5 h-5" />
                Unwrapping...
              </span>
            ) : (
              "Unwrap"
            )}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-8 text-center text-xs text-yellow-100 font-semibold tracking-[0.3em] uppercase">
          Orange Toffee Protected
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

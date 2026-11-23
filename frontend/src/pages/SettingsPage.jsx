import { useState } from "react";
import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import AvatarPicker from "../components/AvatarPicker";
import { Send, Camera, Check, Palette, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PREVIEW_MESSAGES = [
  { id: 1, content: "You want toffee?", isSent: false },
  {
    id: 2,
    content: "No, thanks",
    isSent: true,
  },
];

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-base-200/50 px-4 pb-10 pt-20">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-warning/10 text-warning">
            <Settings2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">Settings</h1>
            <p className="mt-1 text-sm text-base-content/65">
              Personalize your profile and chat appearance.
            </p>
          </div>
        </header>

        {/* Profile Photo */}
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={authUser?.pfp || "/ornge.png"}
                alt="Your profile"
                className="h-16 w-16 rounded-2xl border border-base-300 bg-base-200 object-cover"
              />
              <button
                onClick={() => setPickerOpen(true)}
                className="btn btn-circle btn-sm absolute -bottom-2 -right-2 border-2 border-base-100 bg-primary text-primary-content shadow-sm"
                aria-label="Change profile photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold">Profile Photo</h2>
              <p className="text-sm text-base-content/70">
                Use the default, pick from shared media, or upload from your device
              </p>
            </div>
          </div>

          <button className="btn btn-sm btn-outline" onClick={() => setPickerOpen(true)}>
            Change
          </button>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary">
                <Palette className="h-5 w-5" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="text-lg font-semibold">Theme</h2>
                <p className="text-sm text-base-content/70">
                  Choose a theme for your chat interface
                </p>
              </div>
            </div>

            <button
              className="btn btn-primary btn-sm shrink-0"
              onClick={() => navigate("/")}
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {THEMES.map((t) => (
              <button
                key={t}
                className={`group relative flex min-w-0 flex-col gap-2 rounded-xl border p-2.5 text-left transition duration-200 hover:-translate-y-0.5 ${
                  theme === t
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                    : "border-base-300 bg-base-100 hover:border-primary/40 hover:shadow-sm"
                }`}
                onClick={() => setTheme(t)}
                aria-pressed={theme === t}
              >
                <div
                  className="relative h-10 w-full overflow-hidden rounded-lg border border-base-300/70"
                  data-theme={t}
                >
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1.5">
                    <div className="rounded bg-primary" />
                    <div className="rounded bg-secondary" />
                    <div className="rounded bg-accent" />
                    <div className="rounded bg-neutral" />
                  </div>
                </div>

                <span className="flex w-full items-center justify-between gap-1">
                  <span className="truncate text-xs font-medium">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                  {theme === t && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Preview Section */}
        <section className="overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm">
          <div className="border-b border-base-300 p-5 sm:px-6">
            <h2 className="text-lg font-semibold">Preview</h2>
            <p className="mt-1 text-sm text-base-content/65">
              See how your selected theme looks in a conversation.
            </p>
          </div>
          <div className="bg-base-200 p-4 sm:p-6">
            <div className="max-w-lg mx-auto">

              {/* Mock Chat UI */}
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">

                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                      C
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">John</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${
                            message.isSent
                              ? "bg-primary text-primary-content"
                              : "bg-base-200"
                          }
                        `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${
                              message.isSent
                                ? "text-primary-content/70"
                                : "text-base-content/70"
                            }
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

      </div>

      <AvatarPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
};

export default SettingsPage;

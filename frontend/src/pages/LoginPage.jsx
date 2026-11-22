import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import "./mojang-login.css";

const themeLines = {
  village: {
    morning: ["Morning, sunshine. The village is brighter already.", "Good morning, favorite neighbor."],
    afternoon: ["There you are. I saved you the sunny spot.", "The day got a little brighter when you arrived."],
    evening: ["Evening! The porch light was waiting for you.", "Look who made this little place feel like home."],
  },
  aurora: {
    morning: ["Good morning. Even the sky is showing off for you.", "Morning, starlight."],
    afternoon: ["There you are, brighter than the whole forecast.", "My favorite kind of surprise just arrived."],
    evening: ["Good evening, starlight. You made it.", "The sky put on a show. I still noticed you first."],
  },
  online: {
    morning: ["Good morning. You make a pretty good first thought.", "Morning, favorite person."],
    afternoon: ["There you are. The day just improved.", "My favorite view is right here."],
    evening: ["Good evening. I was hoping you'd show up.", "You make even an ordinary evening feel special."],
  },
};

const jokes = [
  "I had a clever line ready, then you showed up and I forgot it.",
  "I was going to say something smooth, but your timing made me smile instead.",
  "Is it warm in here, or did you just make this place feel cozier?",
  "I saved you the best seat. It's wherever you happen to be.",
  "My favorite notification is still you showing up.",
  "I thought this was just a quick visit. Then you made it the best part of my day.",
  "I found a beautiful view online, then remembered you're here.",
  "You make a random day feel like it was planned just right.",
];

const onlinePhotoIds = [
  "photo-1500530855697-b586d89ba3ee",
  "photo-1470770841072-f978cf4d019e",
  "photo-1490750967868-88aa4486c946",
  "photo-1518837695005-2083093ee35b",
  "photo-1519681393784-d120267933ba",
  "photo-1518005020951-eccb494ad742",
  "photo-1499002238440-d264edd596ec",
  "photo-1441986300917-64674bd600d8",
  "photo-1517841905240-472988babdf9",
  "photo-1515886657613-9f3515b0c78f",
  "photo-1547891654-e66ed7ebb968",
  "photo-1534447677768-be436bb09401",
  "photo-1501785888041-af3ef285b470",
  "photo-1519608487953-e999c86e7455",
  "photo-1500534623283-312aade485b7",
  "photo-1524504388940-b1c1722653e1",
  "photo-1534528741775-53994a69daeb",
  "photo-1469334031218-e382a71b716b",
  "photo-1579783902614-a3fb3927b6a5",
  "photo-1531058020387-3be344556be6",
];

const placeholderBackgrounds = [
  "radial-gradient(ellipse at 18% 80%, rgba(69, 132, 112, 0.9), transparent 48%), linear-gradient(125deg, #142c40, #315f71 55%, #75856e)",
  "radial-gradient(ellipse at 82% 15%, rgba(132, 91, 150, 0.82), transparent 48%), linear-gradient(135deg, #172139, #324a73 56%, #634b62)",
  "radial-gradient(ellipse at 12% 18%, rgba(190, 133, 87, 0.76), transparent 45%), linear-gradient(135deg, #304a52, #46776d 55%, #c08b68)",
  "radial-gradient(ellipse at 82% 82%, rgba(184, 116, 117, 0.78), transparent 48%), linear-gradient(135deg, #49384f, #76566c 55%, #c18b7c)",
  "radial-gradient(ellipse at 20% 85%, rgba(80, 126, 145, 0.82), transparent 48%), linear-gradient(135deg, #25394e, #476777 55%, #87958a)",
];

const chooseVariant = (options, storageKey) => {
  const previous = sessionStorage.getItem(storageKey);
  const eligible = options.filter((option) => option !== previous);
  const selected = eligible[Math.floor(Math.random() * eligible.length)];
  sessionStorage.setItem(storageKey, selected);
  return selected;
};

const createAppearance = () => {
  const fixedBackgrounds = [
    { id: "village", source: "/login-bg.jpg", category: "village" },
    { id: "aurora", source: "/login-bg-aurora.jpg", category: "aurora" },
  ];
  const onlineBackgrounds = onlinePhotoIds.map((photoId) => {
    return {
      id: `online-${photoId}`,
      source: `https://images.unsplash.com/${photoId}?auto=format&fit=crop&crop=entropy&w=2400&h=1600&q=88`,
      category: "online",
    };
  });
  const previousBackground = sessionStorage.getItem("toffee-login-background");
  const useFixedBackground = Math.random() < 0.05;
  const backgroundPool = useFixedBackground ? fixedBackgrounds : onlineBackgrounds;
  const eligibleBackgrounds = backgroundPool.filter(
    (background) => background.id !== previousBackground
  );
  const background =
    eligibleBackgrounds[Math.floor(Math.random() * eligibleBackgrounds.length)];
  sessionStorage.setItem("toffee-login-background", background.id);

  const layout = chooseVariant(
    ["centered", "split", "editorial", "floating", "ticket"],
    "toffee-login-layout"
  );
  const palette = chooseVariant(
    ["blush", "lagoon", "amber", "violet", "sage", "midnight"],
    "toffee-login-palette"
  );
  const font = chooseVariant(
    ["modern", "editorial", "rounded", "pixel", "minimal"],
    "toffee-login-font"
  );
  const placeholder =
    placeholderBackgrounds[
      Math.floor(Math.random() * placeholderBackgrounds.length)
    ];

  return { ...background, layout, palette, font, placeholder };
};

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [greeting, setGreeting] = useState("Welcome back");
  const [joke, setJoke] = useState("The world is ready for you.");
  const [appearance] = useState(createAppearance);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const { login, isLoggingIn, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const options = themeLines[appearance.category][period];
    setGreeting(options[Math.floor(Math.random() * options.length)]);

    let nextIndex = Math.floor(Math.random() * jokes.length);
    const previousJoke = sessionStorage.getItem("toffee-login-joke");
    if (jokes[nextIndex] === previousJoke) {
      nextIndex = (nextIndex + 1) % jokes.length;
    }

    const nextJoke = jokes[nextIndex];
    sessionStorage.setItem("toffee-login-joke", nextJoke);
    setJoke(nextJoke);
  }, [appearance.category]);

  if (isAuthenticated) return <Navigate to="/home" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login({ password });
    if (success) navigate("/home");
  };

  return (
    <main
      className={`mojang-login has-bg login-theme-${appearance.category} login-layout-${appearance.layout} login-palette-${appearance.palette} login-font-${appearance.font} min-h-[100dvh] overflow-hidden`}
      style={{
        backgroundImage: appearance.placeholder,
      }}
    >
      <img
        className={`mojang-background-image${backgroundLoaded ? " is-loaded" : ""}`}
        src={appearance.source}
        alt=""
        aria-hidden="true"
        loading="eager"
        onLoad={() => setBackgroundLoaded(true)}
        onError={() => {
          console.warn("Could not load login background:", appearance.source);
        }}
      />

      <div className="mojang-sky" />
      <div className="mojang-cloud mojang-cloud-a" />
      <div className="mojang-cloud mojang-cloud-b" />
      <div className="mojang-cloud mojang-cloud-c" />

      <div className="mojang-back-trees" />
      <div className="mojang-mid-trees" />
      <div className="mojang-hill" />
      <div className="mojang-ground" />
      <div className="mojang-river" />

      <div className="mojang-house">
        <div className="mojang-house-roof" />
        <div className="mojang-house-window" />
      </div>

      <div className="mojang-tree mojang-tree-left">
        <div className="mojang-trunk" />
        <div className="mojang-leaves" />
      </div>
      <div className="mojang-tree mojang-tree-right">
        <div className="mojang-trunk" />
        <div className="mojang-leaves" />
      </div>

      <section className="mojang-dialog" aria-label="Sign in">
        <header className="mojang-dialog-title">WELCOME TO TOFFEE CHAT</header>

        <div className="mojang-dialog-body">
          <div className="mojang-copy">
            <p className="mojang-greeting">{greeting}</p>
            <p className="mojang-joke">{joke}</p>
          </div>

          <form className="mojang-left" onSubmit={handleSubmit}>
            <div className="mojang-password-wrap">
              <Lock className="mojang-lock" aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="PASSWORD"
                autoFocus
                required
                className="mojang-password"
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="mojang-eye"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || !password.trim()}
              className="mojang-primary"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mojang-spinner" />
                  SIGNING IN
                </>
              ) : (
                "SIGN IN"
              )}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
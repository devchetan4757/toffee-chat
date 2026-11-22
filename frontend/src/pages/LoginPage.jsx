import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import "./mojang-login.css";

const themeLines = {
  village: {
    morning: [
      "Morning, sunshine. The village is brighter already.",
      "Good morning, favorite neighbor.",
      "The kettle's on, and your seat is ready.",
      "A fresh day in the village looks good on you.",
      "Morning! The birds have been saving their best song for you.",
      "The day hasn't officially started until you arrive.",
      "I blame the sunrise for the butterflies. Then you showed up.",
      "Are you always this charming before coffee?",
      "Coffee can wait. I want a minute of your attention first.",
      "Is it the fresh air, or did you just take my breath away?",
      "Your smile should come with a morning warning.",
      "I would happily make this my first hello every day.",
      "You look like my favorite reason to get out of bed.",
      "I had a whole morning planned, then you distracted me.",
      "The sunrise is pretty, but it knows it isn't the main attraction.",
      "Good morning, heart-stealer. Did you dream about me?",
      "If charm were a breakfast food, you'd be the whole buffet.",
    ],
    afternoon: [
      "There you are. I saved you the sunny spot.",
      "The day got a little brighter when you arrived.",
      "Perfect timing. There's still cake left.",
      "The village just got its favorite visitor back.",
      "Take a breather. The afternoon can wait a minute.",
      "Well, this is a lovely surprise.",
      "I was trying to get things done, but then you walked in.",
      "You make a sunny spot look like it was made just for you.",
      "Is that your smile, or did the whole village just get warmer?",
      "I saved you the best seat. Mostly because I hoped you'd sit near me.",
      "You have a talent for making my afternoon plans disappear.",
      "If I bring you a snack, do I get to keep you company?",
      "I think the village gossip is that I have a little crush on you.",
      "You could make even a trip to the market feel like a date.",
      "That look should come with a warning: may cause daydreaming.",
      "I was doing just fine until you showed up looking that cute.",
    ],
    evening: [
      "Evening! The porch light was waiting for you.",
      "Look who made this little place feel like home.",
      "The day's winding down, but the welcome is just getting started.",
      "Come on in. The coziest spot is yours.",
      "Evening, friend. You made it through another one.",
      "The stars are out, and so is your favorite welcome.",
      "The porch is cozy, but it'd be cozier if you sat closer.",
      "I made room by the fire. I may have saved the closest spot for me.",
      "You're looking pretty cute for someone who just stole my attention.",
      "Want to stay a little longer? I promise the company is excellent.",
      "The night is lovely, but I think you're winning.",
      "I was going to watch the stars, then you became my favorite view.",
      "Come sit with me. I have a blanket and absolutely no ulterior motive.",
      "You make coming home feel like the best part of the day.",
      "If I said I missed you, would you stay for one more minute?",
      "The porch light is on. So is my very obvious crush.",
    ],
  },
  aurora: {
    morning: [
      "Good morning. Even the sky is showing off for you.",
      "Morning, starlight.",
      "The horizon saved its brightest colors for your arrival.",
      "A new day is unfolding. Glad you're here for it.",
      "Rise and shine, cosmic favorite.",
      "The sky's awake, and now the day can begin.",
      "The stars aligned, and somehow they brought me you.",
      "Good morning, gorgeous. The universe has excellent taste.",
      "I saw the sunrise, but it still wasn't as lovely as you.",
      "Are those butterflies from the aurora, or are you doing that again?",
      "I could get used to waking up in the same universe as you.",
      "You're brighter than the morning sky, and you know it.",
      "My horoscope said I'd meet someone captivating. It meant you.",
      "You make the whole galaxy feel like a more romantic place.",
      "Morning, starlight. Save a little of that sparkle for me.",
      "I was going to wish on a star, but then you logged in.",
    ],
    afternoon: [
      "There you are, brighter than the whole forecast.",
      "My favorite kind of surprise just arrived.",
      "The clouds parted. They must have heard you were coming.",
      "A little midday magic, right on schedule.",
      "The universe has excellent timing today.",
      "The afternoon looks brighter from here.",
      "The forecast says partly cloudy with a 100% chance of me flirting.",
      "You must be a supernova, because you just stole the whole scene.",
      "I could stare at the sky all day, but you keep outshining it.",
      "Are you gravity? Because I keep getting pulled your way.",
      "The universe is huge, and I still got lucky enough to find you.",
      "I think the stars are jealous of how well you shine.",
      "You and I would make a pretty great constellation.",
      "I had a clever cosmic pickup line, but you made me forget it.",
      "Careful, starlight. You're making this orbit feel like a date.",
      "If I get lost in your eyes, please send a rescue mission.",
    ],
    evening: [
      "Good evening, starlight. You made it.",
      "The sky put on a show. I still noticed you first.",
      "The stars are out, and your spot is right here.",
      "Another orbit complete. Welcome back.",
      "The night feels a little less quiet now.",
      "Stay a while; the sky isn't going anywhere.",
      "The stars are beautiful, but I keep looking at you instead.",
      "If we watched the aurora together, I would forget to look up.",
      "You're my favorite thing to find in the whole night sky.",
      "Come closer; I promise the stargazing is better from here.",
      "I would travel light-years for a little more time with you.",
      "The moon has competition tonight, and it knows who.",
      "I wished on a star for you to show up. It came through.",
      "You make even the endless universe feel like a cozy place for two.",
      "Stay until the stars get jealous of all the attention I'm giving you.",
      "Good evening, gorgeous. Ready to make a little moonlight mischief?",
    ],
  },
  online: {
    morning: [
      "Good morning. You make a pretty good first thought.",
      "Morning, favorite person.",
      "The world is waking up. Glad we get to start here.",
      "Coffee, fresh air, and you. Not a bad morning.",
      "A new day just got a little more interesting.",
      "Morning! Hope today is kind to you.",
      "Good morning, cutie. I hope I made your to-do list.",
      "If mornings always started with you, I'd become a morning person.",
      "I woke up in a good mood. Then I saw you, so now it's great.",
      "You make bedhead and morning light look unfairly good.",
      "I can think of one thing better than coffee, and it's saying hi to you.",
      "Morning! Just checking if you're as distracting before noon.",
      "My favorite notification of the day arrived early.",
      "You must be my lucky charm; the day already feels promising.",
      "I hope your morning is as lovely as your smile.",
      "A little flirt to start your day: you're ridiculously cute.",
    ],
    afternoon: [
      "There you are. The day just improved.",
      "My favorite view is right here.",
      "A little break, a familiar face. Perfect.",
      "The afternoon was missing something. It was you.",
      "Pause the scroll; your favorite corner is right here.",
      "Hey, you. Good things are still happening today.",
      "Are you free later, or should I keep pretending this is casual?",
      "I was having a normal afternoon until you made my heart do that.",
      "You make even a quick hello feel like the highlight of my day.",
      "If flirting were a sport, I'd still lose because you distract me.",
      "I hope you know that smile is doing a lot of work right now.",
      "You + me + absolutely no plans sounds like a pretty good plan.",
      "I had a productive afternoon planned. Then I remembered you exist.",
      "Can I borrow your attention? I promise to give it back eventually.",
      "The best part of this screen is definitely you.",
      "You have no business looking that good in the middle of my day.",
    ],
    evening: [
      "Good evening. I was hoping you'd show up.",
      "You make even an ordinary evening feel special.",
      "The day is done; your welcome is not.",
      "Unwind a little. You're right where you belong.",
      "The evening got better at exactly the right time.",
      "Hey, glad you're here. How was today?",
      "Want to call this a date, or should I keep being subtle?",
      "My evening plans just improved: you're here.",
      "I saved the best part of tonight for talking with you.",
      "You look like trouble. The kind I'd happily stay up for.",
      "If I tell you that I missed you, will you stay a little longer?",
      "The night is young, and I have a very cute person to flirt with.",
      "I hope you're ready for me to pretend I'm not blushing.",
      "You make late nights feel like the right place to be.",
      "Come closer. I promise my conversation is almost as good as my taste.",
      "I was waiting for you. Don't let it go to your head. (Too late.)",
    ],
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
  "Do you have a map? I keep getting lost in this conversation.",
  "I was going to play it cool, but then you showed up.",
  "You must be my favorite song; I keep wanting you on repeat.",
  "If smiles were messages, yours would be my favorite notification.",
  "I think my day just got a very cute plot twist.",
  "You make my phone feel a little more interesting.",
  "Are you a good book? Because I don't want to put you down.",
  "I had a witty opener, but your smile interrupted my train of thought.",
  "You make ordinary moments feel like the start of a story.",
  "I would share my fries with you. That's how you know this is serious.",
  "Are you made of sunshine? Because you just brightened my whole screen.",
  "You seem like someone I'd accidentally stay up talking to.",
  "If I had a favorite hello, it would probably be yours.",
  "You make being distracted feel like a pretty good idea.",
  "Are you a notification? Because I was hoping you'd pop up.",
  "I don't need a playlist; this conversation is already a good vibe.",
  "You have the kind of smile that deserves a second look.",
  "I think we should make this a regular part of my day.",
  "You're dangerously easy to talk to.",
  "My plans were fine, but talking to you sounds better.",
  "Is your name Wi-Fi? Because I feel a pretty strong connection.",
  "I must be having a lucky day; I got to see you.",
  "If charming were a job, you'd be employee of the month.",
  "You make my favorite place the one where you're hanging out.",
  "Can I save this moment? It's one of my favorites.",
  "Are you a spark? Because you just made this conversation electric.",
  "I like your style. Especially the part where you showed up.",
  "I was having a normal day until you made it interesting.",
  "You're the reason I keep checking if there's a new message.",
  "If we were a story, I'd definitely read another chapter.",
  "I could get used to this whole you-and-me-talking thing.",
  "You make even a tiny hello feel like a big deal.",
  "I think my favorite hobby might be making you smile.",
  "Are you a shooting star? Because I just made a wish.",
  "I didn't believe in perfect timing until you appeared.",
  "You bring out my best lines. And occasionally my worst ones.",
  "Is it too soon to say you're my favorite distraction?",
  "I think the universe deserves credit for introducing us.",
  "You make a simple chat feel like a little adventure.",
  "I was going to be productive, but then you became more interesting.",
  "If I could pick today's highlight, it would be this conversation.",
  "You have a way of making the whole room feel warmer.",
  "I may be smiling at my screen. I'm blaming you.",
  "Do you believe in chemistry, or should I send another message?",
  "You make it very hard to come up with a casual hello.",
  "I was saving my best smile. Then I saw yours.",
  "You + me + a long conversation sounds like a lovely plan.",
  "I think you just raised the bar for good company.",
  "Are you a little bit of magic? Because this feels like a good day.",
  "I hope you know you're very easy to root for.",
  "You're the kind of person who makes a place feel more welcoming.",
  "I'd pick your company over a perfect plan any day.",
  "If this were a meet-cute, I think we're doing pretty well.",
  "Your timing is excellent. I was just thinking I wanted to see you.",
  "You make my heart do a tiny happy dance.",
  "I don't mean to flirt, but you make it really difficult not to.",
  "You have main-character energy, and I love that for you.",
  "I could tell you a joke, but I'd rather hear your laugh.",
  "If you were a page in my diary, you'd have a little heart beside your name.",
  "I think I just found my favorite person to be a little awkward around.",
  "You make every conversation feel like time well spent.",
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
  "photo-1547891654-e66ed7ebb968",
  "photo-1534447677768-be436bb09401",
  "photo-1501785888041-af3ef285b470",
  "photo-1519608487953-e999c86e7455",
  "photo-1500534623283-312aade485b7",
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

const chooseGreeting = (options, storageKey) => {
  const recent = (sessionStorage.getItem(storageKey) || "").split("\n").filter(Boolean);
  const eligible = options.filter((option) => !recent.includes(option));
  const pool = eligible.length ? eligible : options;
  const selected = pool[Math.floor(Math.random() * pool.length)];
  sessionStorage.setItem(
    storageKey,
    [selected, ...recent.filter((line) => line !== selected)].slice(0, 8).join("\n")
  );
  return selected;
};

const fetchOnlineGreeting = async (signal) => {
  const response = await fetch(
    `https://api.adviceslip.com/advice?cacheBust=${Date.now()}`,
    { cache: "no-store", signal }
  );
  if (!response.ok) {
    throw new Error(`Greeting API returned ${response.status}`);
  }

  const result = await response.json();
  const advice = result.slip?.advice;
  if (typeof advice !== "string" || !advice.trim()) {
    throw new Error("Greeting API returned invalid text");
  }

  return advice.trim();
};

const fetchOnlineFlirtyLine = async (signal) => {
  const recent = (sessionStorage.getItem("toffee-login-joke") || "")
    .split("\n")
    .filter(Boolean);
  const unsuitableWords = /\b(?:ass|boobs|breasts|dick|nudes?|pant(?:s|ies)|sex|tits|unzip)\b/i;
  let lastError;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(
      `https://rizzapi.vercel.app/random?cacheBust=${Date.now()}-${attempt}`,
      { cache: "no-store", signal }
    );
    if (!response.ok) {
      throw new Error(`Flirty line API returned ${response.status}`);
    }

    const result = await response.json();
    const text = typeof result?.text === "string" ? result.text.trim() : "";
    if (
      typeof text === "string" &&
      text.length <= 240 &&
      ["Flirty", "Complimentary", "Romantic", "Cheesy"].includes(result?.category) &&
      !unsuitableWords.test(text) &&
      !recent.includes(text)
    ) {
      return text;
    }

    lastError = new Error("Flirty line API returned a repeated or unsuitable line");
  }

  throw lastError;
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
    setGreeting(
      chooseGreeting(
        options,
        `toffee-login-greeting-${appearance.category}-${period}`
      )
    );
    setJoke(chooseGreeting(jokes, "toffee-login-joke"));

    const greetingController = new AbortController();
    let greetingTimedOut = false;
    const greetingTimeoutId = window.setTimeout(() => {
      greetingTimedOut = true;
      greetingController.abort();
    }, 5000);

    fetchOnlineGreeting(greetingController.signal)
      .then(setGreeting)
      .catch((error) => {
        if (greetingTimedOut) {
          console.warn("Could not load a fresh login greeting: request timed out.");
        } else if (!greetingController.signal.aborted) {
          console.warn("Could not load a fresh login greeting:", error);
        }
      })
      .finally(() => window.clearTimeout(greetingTimeoutId));

    const controller = new AbortController();
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 5000);

    fetchOnlineFlirtyLine(controller.signal)
      .then((onlineJoke) => {
        const recent = (sessionStorage.getItem("toffee-login-joke") || "")
          .split("\n")
          .filter((line) => line && line !== onlineJoke);
        sessionStorage.setItem(
          "toffee-login-joke",
          [onlineJoke, ...recent].slice(0, 8).join("\n")
        );
        setJoke(onlineJoke);
      })
      .catch((error) => {
        if (timedOut) {
          console.warn("Could not load a fresh login joke: request timed out.");
        } else if (!controller.signal.aborted) {
          console.warn("Could not load a fresh login joke:", error);
        }
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      window.clearTimeout(greetingTimeoutId);
      greetingController.abort();
      window.clearTimeout(timeoutId);
      controller.abort();
    };
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
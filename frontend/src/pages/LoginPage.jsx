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
  "My screen gets a little brighter when your name appears.",
  "I had plans to be productive, but this is better.",
  "You make small talk feel like a very good idea.",
  "This conversation is becoming my favorite habit.",
  "I think my phone knows when I'm hoping to hear from you.",
  "You have a talent for making ordinary days memorable.",
  "I was going to log off, then you made a compelling case.",
  "Somehow, your messages always arrive at the right time.",
  "I could get used to this kind of interruption.",
  "You make even a quiet day feel like a story.",
  "My favorite part of the day might be this little chat.",
  "I think the smile on my face has your timing.",
  "You make a simple hello feel like an event.",
  "I have a feeling this conversation deserves a sequel.",
  "You bring excellent plot twists to an ordinary day.",
  "I was trying to play it cool. The typing bubble won.",
  "The best notifications seem to have your name on them.",
  "You make even my best excuse to procrastinate look good.",
  "This chat has dangerously good atmosphere.",
  "I have no proof, but the day improved when you arrived.",
  "You make being online feel like a better choice.",
  "I think my playlist is starting to sound like this conversation.",
  "A quick hello somehow turned into the best part of today.",
  "You make the little moments feel like the main event.",
  "I was saving a good mood for later. You brought one early.",
  "This conversation has excellent staying power.",
  "I might need to schedule more accidental run-ins like this.",
  "You make a quiet evening feel less quiet.",
  "I keep finding reasons to leave this chat open.",
  "This is a very charming use of my free time.",
  "You make even a loading screen worth waiting through.",
  "Somehow, your timing keeps winning the day.",
  "I think the best stories start with a message like this.",
  "You have a way of making the clock move too quickly.",
  "I had a clever comeback, then your smile distracted me.",
  "This might be my favorite kind of screen time.",
  "You make a regular day feel like it has good lighting.",
  "I was looking for a reason to smile. Very convenient.",
  "A conversation this good should probably come with a warning.",
  "You make it easy to forget what I was doing.",
  "I think my attention span just picked a favorite.",
  "The day had a decent plan until you improved it.",
  "You make even a tiny notification feel important.",
  "I could pretend this is casual, but the grin says otherwise.",
  "This chat is making a strong case for staying in.",
  "I have to admit, your timing has excellent taste.",
  "You make a little digital hello feel surprisingly cozy.",
  "My day was fine. Then it got a lot more interesting.",
  "You make conversation feel like the best kind of detour.",
  "I may be overusing my phone. I have a good reason.",
  "It turns out the best view on my screen is this chat.",
  "You make every pause in the day more pleasant.",
  "I think my favorite plan is seeing where this chat goes.",
  "You have the sort of energy that deserves a second message.",
  "My to-do list is starting to feel a little less convincing.",
  "This conversation has officially earned a favorite spot.",
  "You make the word hello work surprisingly hard.",
  "A little message from you goes a long way.",
  "I think my day just found its favorite subplot.",
  "You make checking my messages feel like a good idea.",
  "This is the most charming distraction I've had all week.",
  "I wasn't expecting the day to get this delightful.",
  "You make even a short chat feel like time well spent.",
  "I think my inner narrator just added a smile here.",
  "There should be a name for this much good timing.",
  "You make my quiet moments considerably less quiet.",
  "The best part of multitasking is talking with you.",
  "I have a soft spot for conversations that start like this.",
  "You make a random Tuesday feel suspiciously special.",
  "I could blame the coffee, but this smile has another cause.",
  "This chat has the same effect as finding the sunny seat.",
  "You make every little update worth hearing.",
  "My day has a new favorite notification sound.",
  "I was doing just fine, then the conversation got charming.",
  "You make the internet feel like a smaller, nicer place.",
  "I think we might be setting a very pleasant precedent.",
  "This is a lovely reason to ignore the clock for a bit.",
  "You make the mundane parts of the day less mundane.",
  "I keep thinking of one more thing to say. Curious.",
  "You make an ordinary chat feel like a lucky find.",
  "My favorite kind of surprise seems to be your messages.",
  "I think this conversation just raised my standards.",
  "You make a little screen feel like good company.",
  "Somehow, the day keeps finding ways to bring you up.",
  "I didn't know my afternoon needed this exact plot twist.",
  "You make being a little distracted feel worthwhile.",
  "I have a feeling this chat is going to be hard to top.",
  "You make even a quick check-in feel like a treat.",
  "The day is looking better, and the evidence is right here.",
  "I might be smiling at my phone for completely unrelated reasons.",
  "You make the usual routine feel like something to look forward to.",
  "This conversation has a very nice way of stealing the spotlight.",
  "I think this is what people mean by a bright spot.",
  "You make a simple message feel like excellent timing.",
  "My day just got an upgrade, and it didn't need an update.",
  "You make it very easy to lose track of the little things.",
  "I was saving my attention for something important. Here we are.",
  "This chat is quietly becoming a highlight.",
];

const subtleFallbackGreetings = [
  "Somehow, today got a little brighter.",
  "This is a rather nice surprise.",
  "The day improved right on cue.",
  "Funny, I was just hoping you'd show up.",
  "Things are better with you around.",
  "Well, this is my favorite interruption.",
  "I could get used to this timing.",
  "The room feels warmer all of a sudden.",
  "This moment has unexpectedly good timing.",
  "The day found its better part.",
  "A familiar face can change the whole mood.",
  "This little hello suits the afternoon.",
  "The world feels a bit kinder right now.",
  "Some company just makes sense.",
  "A good day was already in progress.",
  "This is a pleasant plot twist.",
  "The best moments rarely need a plan.",
  "The quiet feels nicer with company.",
  "A small hello can go a long way.",
  "The timing feels almost suspiciously good.",
  "The day seems to be showing off today.",
  "Some things are better unplanned.",
  "The best part of the day arrived quietly.",
  "This place has a nicer atmosphere now.",
  "A little company changes everything.",
  "Today has a surprisingly sweet side.",
  "A good mood just found its way here.",
  "The day feels less ordinary now.",
  "This is exactly the kind of distraction I like.",
  "The moment got a little more interesting.",
  "Somehow, the timing feels just right.",
  "A bright spot appeared right on cue.",
  "The day could use more moments like this.",
  "Some company makes time move differently.",
  "The ordinary parts have their moments.",
  "A little warmth goes a long way.",
  "This corner feels a little more welcoming.",
  "A good surprise makes the day better.",
  "The afternoon has improved considerably.",
  "The evening has a nicer glow now.",
  "The morning started with good timing.",
  "This feels like a lovely coincidence.",
  "A familiar presence changes the scene.",
  "The day got a softer edge.",
  "There is something nice about this moment.",
  "A little charm goes a long way.",
  "The atmosphere just became more pleasant.",
  "The best interruptions are the gentle ones.",
  "Some moments know how to arrive.",
  "This is a welcome change of pace.",
  "The day is looking up from here.",
  "A nice surprise can reset everything.",
  "This moment feels easy to enjoy.",
  "The world paused in a good way.",
  "A little brightness goes a long way.",
  "The day has a better rhythm now.",
  "This is a nice place to pause.",
  "Some company makes everything feel lighter.",
  "The little things are doing well today.",
  "A good moment found its way in.",
  "The day feels like it has good taste.",
  "This is a charming turn of events.",
  "The timing could hardly be better.",
  "Some things make a day feel complete.",
  "The mood has quietly improved.",
  "This feels like a nice start to something.",
  "The day has a new favorite moment.",
  "A small surprise can carry a whole day.",
  "This is a rather good use of a minute.",
  "A little company suits the moment.",
  "The room seems brighter than before.",
  "The day feels less rushed right now.",
  "Some moments deserve to linger.",
  "This is a surprisingly lovely pause.",
  "A good feeling just settled in.",
  "The day has found a nicer pace.",
  "This moment has a certain sparkle.",
  "A little magic looks good on today.",
  "The ordinary just got upgraded.",
  "It is nice when timing gets things right.",
  "The day has a softer soundtrack now.",
  "This is a good reason to take a break.",
  "Some surprises make themselves at home.",
  "The moment feels a little more golden.",
  "A good vibe showed up right on time.",
  "This is easily the nicest part so far.",
  "The day has become more interesting.",
  "A quiet moment can still make a statement.",
  "The scenery has improved a little.",
  "This is a lovely little change of pace.",
  "A familiar hello never gets old.",
  "The day is being unusually kind.",
  "Some moments are better shared.",
  "It feels nice to be right here.",
  "Today has found its little bright spot.",
  "The moment is making a good impression.",
  "This is a very welcome coincidence.",
  "The day has a little more sparkle now.",
  "A good surprise looks right at home here.",
  "The moment feels sweeter than expected.",
  "This is a nice way for the day to unfold.",
  "The day has become worth remembering.",
  "Some company makes a lovely difference.",
  "The present moment has excellent manners.",
  "This is a pleasant little reason to smile.",
  "The day feels like it made a good choice.",
  "There is a nice energy in the room.",
  "This moment has been quietly anticipated.",
  "A little brightness found its way here.",
  "Somehow, this feels like the right place.",
  "The day just got a little more charming.",
  "A nice moment is unfolding right on time.",
  "This feels like a very good coincidence.",
  "The world is being generous with timing.",
  "It is a good day for unexpected company.",
  "Some moments make the whole day nicer.",
  "This is a good kind of interruption.",
  "A little sunshine found its way indoors.",
  "The day has a softer side after all.",
  "A certain someone improves the scenery.",
  "The moment is better than the plan.",
  "The best part arrived without an announcement.",
  "This is a pretty good reason to linger.",
  "There is something lovely about right now.",
  "The day is quietly showing off.",
  "A good mood found a good place to land.",
  "This little moment has excellent timing.",
  "The world feels more interesting today.",
  "A familiar presence makes a nice difference.",
  "This is the sort of moment worth keeping.",
  "A bright idea: stay a little longer.",
  "The day feels more complete somehow.",
  "A little charm brightens the whole place.",
  "This is a rather nice thing to come back to.",
  "The moment has a way of making itself special.",
  "Some days know how to surprise you.",
  "A small hello can make a big difference.",
  "The day is better than it was a minute ago.",
  "This is a lovely place to let time slow down.",
  "A good moment arrived in good company.",
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
  return fetchOnlineFlirtyLine(signal, {
    maxLength: 80,
    indirect: true,
    storageKey: "toffee-login-greeting",
    historyLimit: 100,
  });
};

const fetchOnlineFlirtyLine = async (
  signal,
  {
    maxLength = 240,
    indirect = false,
    storageKey = "toffee-login-joke",
    historyLimit = 8,
  } = {}
) => {
  const recent = (sessionStorage.getItem(storageKey) || "")
    .split("\n")
    .filter(Boolean)
    .slice(0, historyLimit);
  const unsuitableWords = /\b(?:ass|boobs|breasts|dick|nudes?|pant(?:s|ies)|sex|tits|unzip)\b/i;
  const tooDirect = /\?|\b(?:crush|date|flirt(?:ing)?|kiss|love|miss|want you)\b/i;
  let lastError;

  for (let attempt = 0; attempt < 8; attempt += 1) {
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
      text.length <= maxLength &&
      ["Flirty", "Complimentary", "Romantic", "Cheesy", "Funny"].includes(result?.category) &&
      !unsuitableWords.test(text) &&
      (!indirect || !tooDirect.test(text)) &&
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
  const [, setGreeting] = useState("");
  const [joke, setJoke] = useState(() =>
    chooseGreeting(jokes, "toffee-login-joke")
  );
  const [appearance] = useState(createAppearance);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const { login, isLoggingIn, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const hour = new Date().getHours();
  const titleGreeting =
    hour < 12 ? "Good morning!" : hour < 18 ? "Good afternoon!" : "Good evening!";

  useEffect(() => {
    const hour = new Date().getHours();
    const period = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
    const options = [
      ...themeLines[appearance.category][period].filter(
        (line) =>
          line.length <= 42 &&
          !/\?|\b(?:crush|date|flirt(?:ing)?|kiss|love|miss|want you)\b/i.test(line)
      ),
      ...subtleFallbackGreetings,
    ];
    setGreeting(
      chooseGreeting(
        options,
        `toffee-login-greeting-${appearance.category}-${period}`
      )
    );
    const greetingController = new AbortController();
    let greetingTimedOut = false;
    const greetingTimeoutId = window.setTimeout(() => {
      greetingTimedOut = true;
      greetingController.abort();
    }, 5000);

    fetchOnlineGreeting(greetingController.signal)
      .then((onlineGreeting) => {
        const recent = (sessionStorage.getItem("toffee-login-greeting") || "")
          .split("\n")
          .filter((line) => line && line !== onlineGreeting);
        sessionStorage.setItem(
          "toffee-login-greeting",
          [onlineGreeting, ...recent].slice(0, 100).join("\n")
        );
        setGreeting(onlineGreeting);
      })
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

    fetchOnlineFlirtyLine(controller.signal, {
      storageKey: "toffee-login-online-joke",
      historyLimit: 100,
    })
      .then((onlineJoke) => {
        const recent = (sessionStorage.getItem("toffee-login-online-joke") || "")
          .split("\n")
          .filter((line) => line && line !== onlineJoke);
        sessionStorage.setItem(
          "toffee-login-online-joke",
          [onlineJoke, ...recent].slice(0, 100).join("\n")
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
        <h1 className="mojang-dialog-title">{titleGreeting}</h1>
        <div className="mojang-dialog-body">
          <div className="mojang-copy">
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
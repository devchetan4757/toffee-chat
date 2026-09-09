import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FIRE_LEFT_CAP_FRAMES, FIRE_RIGHT_CAP_FRAMES } from "./fireBubbleData";

/*
 * Fire, Love, Celebration, and Gift are the enabled message effects in
 * this phase.
 *
 * The flame silhouette is a smooth, hand-tuned shape (Catmull-Rom curves,
 * see fireBubbleData.js) that is deliberately asymmetric: jagged, wobbling
 * flame tongues on top (that's the actual fire), settling into a plain,
 * gently rounded curve at the bottom that merges straight into the
 * bubble's own corner — like the fire is rising out of a normal rounded
 * message bubble, rather than the bubble having a spiky tail hanging off
 * the bottom. Five keyframes per cap are morphed with a SMIL <animate> to
 * produce that flicker organically instead of a made-up bounce.
 *
 * Layout: the bubble is built like a 3-slice sprite so it works for any
 * message length without stretching the flame art:
 *   [ left flame cap ] [ stretchy flat body ] [ right flame cap ]
 * Both caps keep their aspect ratio via fixed CSS sizing and scale
 * uniformly with the bubble's height, so nothing gets squashed. The body
 * has a normal rounded-bubble border-radius; the caps overlap it by more
 * than that radius (see index.css) so their opaque flame fill sits behind
 * the rounded-corner cutout instead of leaving a mismatched gap there.
 *
 * Love repaints the bubble a hot pink (the same warm pink family as the
 * gift-box effect's wrap color) instead of keeping the theme's own
 * blue/gray — flat, no glow. Four small heart glyphs are pinned to the
 * bubble's four corners, each gently pulsing in size/opacity on its own
 * offset loop so they read as alive without a distracting bounce.
 *
 * Celebration is two separate pieces:
 *   1. A bubble skin — like Love/Fire, permanent for as long as the
 *      message exists: a purple-to-gold gradient bubble with small
 *      confetti glyphs (not emoji, plain SVG shapes) twinkling at the
 *      four corners.
 *   2. A one-off chat-wide burst (CelebrationBurst below) — confetti
 *      raining down over the whole chat area for a few seconds right
 *      after a celebration message is sent/received, then it's gone.
 *      That part is rendered by ChatContainer, not by the bubble itself.
 *
 * Gift is a fourth kind of piece entirely: it starts life as a wrapped
 * present (a red gift box with a satin bow, sitting in place of the
 * bubble) and stays that way — idly shining, inviting a tap — until the
 * recipient taps it. Tapping plays a one-shot unwrap: the bow pops off
 * and the ribbon falls away with a little confetti-sparkle burst, then
 * the box itself fades out to reveal the real message underneath, which
 * is left permanently skinned in a deep red/maroon with a bright red
 * outline — the "opened present" state — same permanent-skin idea as
 * Fire/Love/Celebration, just arrived at after a one-time reveal instead
 * of being visible immediately. Once opened for a given message it stays
 * opened (remembered in localStorage) so it doesn't re-wrap itself on
 * refresh.
 */
export const EFFECT_OPTIONS = [
  {
    id: "fire",
    label: "Fire",
    icon: "fire",
  },
  {
    id: "love",
    label: "Love",
    icon: "love",
  },
  {
    id: "celebration",
    label: "Party",
    icon: "celebration",
  },
  {
    id: "gift",
    label: "Gift",
    icon: "gift",
  },
];

export const ALLOWED_EFFECTS = ["fire", "love", "celebration", "gift"];

export const isValidMessageEffect = (effect) =>
  effect === "fire" ||
  effect === "love" ||
  effect === "celebration" ||
  effect === "gift";

export const normalizeMessageEffect = (effect) =>
  isValidMessageEffect(effect) ? effect : null;

export const isSkinEffect = (effect) =>
  effect === "fire" ||
  effect === "love" ||
  effect === "celebration" ||
  effect === "gift";

// Which effects should also trigger the one-off, chat-wide burst
// (see CelebrationBurst) in addition to their permanent bubble skin.
export const isBurstEffect = (effect) => effect === "celebration";

export const effectBubbleClass = (effect) => {
  if (effect === "fire") return "message-effect-fire";
  if (effect === "love") return "message-effect-love";
  if (effect === "celebration") return "message-effect-celebration";
  if (effect === "gift") return "message-effect-gift";
  return "";
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  return reduced;
}

const FLICKER_DUR = "1.6s";

function flickerValues(frames) {
  return [...frames, frames[0]].join(";");
}

const FireCap = memo(function FireCap({ side }) {
  const reducedMotion = usePrefersReducedMotion();
  const frames = side === "left" ? FIRE_LEFT_CAP_FRAMES : FIRE_RIGHT_CAP_FRAMES;
  const values = flickerValues(frames);
  const clipId = `message-effect-fire-clip-${side}`;
  const gradId = `message-effect-fire-grad-${side}`;
  const glowId = "message-effect-fire-glow";

  // Ember spark position differs per cap: it hovers just above the tallest
  // tip on each side, which sits at a different local x on the left vs
  // right traced silhouette.
  const emberCx = side === "left" ? 45 : 44;

  return (
    <svg
      className={`message-effect-fire-cap message-effect-fire-cap-${side}`}
      viewBox="0 0 68 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        {/* Hot yellow-white tip fading through orange into a deep ember-red
            base, instead of the old flat orange-to-orange gradient — this
            is most of what makes the flame read as fire rather than a
            solid-colored blob. */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="22%" stopColor="#ffc233" />
          <stop offset="55%" stopColor="#ff8a00" />
          <stop offset="82%" stopColor="#ff5400" />
          <stop offset="100%" stopColor="#d62810" />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff0c8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#fff0c8" stopOpacity="0" />
        </radialGradient>
        <filter id={`${glowId}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
        <clipPath id={clipId}>
          <path d={frames[0]}>
            {!reducedMotion && (
              <animate
                attributeName="d"
                values={values}
                dur={FLICKER_DUR}
                repeatCount="indefinite"
              />
            )}
          </path>
        </clipPath>
      </defs>

      {/* Soft blurred silhouette underneath the crisp one, same shape and
          animation, so the flame has a faint glowing "aura" at its edges
          instead of a hard cutout look. */}
      <path
        d={frames[0]}
        fill={`url(#${gradId})`}
        opacity="0.55"
        filter={`url(#${glowId}-blur)`}
      >
        {!reducedMotion && (
          <animate
            attributeName="d"
            values={values}
            dur={FLICKER_DUR}
            repeatCount="indefinite"
          />
        )}
      </path>

      <path
        className="message-effect-fire-cap-shape"
        d={frames[0]}
        fill={`url(#${gradId})`}
      >
        {!reducedMotion && (
          <animate
            attributeName="d"
            values={values}
            dur={FLICKER_DUR}
            repeatCount="indefinite"
          />
        )}
      </path>

      {/* Warm under-glow near the seam, clipped to the flame silhouette so
          it never leaks outside the flame edge. */}
      <g clipPath={`url(#${clipId})`}>
        <ellipse
          cx={side === "left" ? 46 : 22}
          cy="98"
          rx="40"
          ry="26"
          fill={`url(#${glowId})`}
        />
      </g>

      {/* Small floating embers drifting up and fading, at slightly
          different sizes/timings/positions per cap for a livelier,
          less mechanical fire. */}
      <circle
        className="message-effect-fire-ember"
        cx={emberCx}
        cy="8"
        r="1.6"
        fill="#fff6da"
      >
        {!reducedMotion && (
          <>
            <animate
              attributeName="opacity"
              values="0;1;0.2;1;0"
              dur="2.4s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="10;3;10"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </>
        )}
      </circle>
      <circle
        className="message-effect-fire-ember"
        cx={side === "left" ? 32 : 34}
        cy="20"
        r="1.1"
        fill="#ffdf9e"
      >
        {!reducedMotion && (
          <>
            <animate
              attributeName="opacity"
              values="0;0.9;0.1;0.8;0"
              dur="3.1s"
              begin="0.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cy"
              values="24;10;24"
              dur="3.1s"
              begin="0.6s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="cx"
              values={`${side === "left" ? 32 : 34};${side === "left" ? 27 : 39};${side === "left" ? 32 : 34}`}
              dur="3.1s"
              begin="0.6s"
              repeatCount="indefinite"
            />
          </>
        )}
      </circle>
    </svg>
  );
});

export const FireParticles = memo(function FireParticles() {
  return (
    <span className="message-effect-fire-layer" aria-hidden="true">
      <FireCap side="left" />
      <FireCap side="right" />
    </span>
  );
});

export const FireEffect = ({ children }) => (
  <span className="message-effect-fire-host">
    <FireParticles />
    <span className="message-effect-fire-content">{children}</span>
  </span>
);

// Simple rounded heart glyph, drawn once and reused with a per-instance
// gradient id (see LoveHeart) instead of five separately hand-traced paths
// — the fire flame needed bespoke art because it has a jagged silhouette,
// but a heart is a plain enough shape that one path scales cleanly.
const LOVE_HEART_PATH =
  "M12 21.5c-.32 0-.63-.12-.87-.34C6.9 17.6 2 13.53 2 9.14 2 6.3 4.28 4 7.1 4c1.66 0 3.22.79 4.2 2.06.16.2.44.2.6 0C12.88 4.79 14.44 4 16.1 4 18.92 4 21.2 6.3 21.2 9.14c0 4.39-4.9 8.46-9.13 11.98-.24.24-.55.38-.87.38z";

// Corner-anchored so the hearts always hug the bubble's actual edges no
// matter how small or large the bubble is. Earlier this used a couple of
// percentage-based (left: 38%, left: 11%) mid-edge positions, which look
// fine on a wide bubble but collide into a clump on a short one-word
// bubble since the percentage shrinks with the bubble width while the
// heart itself doesn't. Pinning every heart to a corner with a fixed px
// offset keeps consistent spacing at any bubble size.
const LOVE_HEARTS = [
  { key: "top-left", style: { top: "-12px", left: "-10px" }, size: 22, delay: "0s", dur: "2.6s" },
  { key: "top-right", style: { top: "-10px", right: "-9px" }, size: 16, delay: "0.7s", dur: "2.2s" },
  { key: "bottom-left", style: { bottom: "-9px", left: "-8px" }, size: 14, delay: "1.3s", dur: "2.4s" },
  { key: "bottom-right", style: { bottom: "-11px", right: "-10px" }, size: 18, delay: "0.4s", dur: "2.8s" },
];

const LoveHeart = memo(function LoveHeart({ heart, index, reducedMotion }) {
  const gradId = `message-effect-love-grad-${index}`;

  return (
    <span
      className="message-effect-love-heart"
      style={{
        ...heart.style,
        width: heart.size,
        height: heart.size,
        animationDuration: reducedMotion ? "0s" : heart.dur,
        animationDelay: reducedMotion ? "0s" : heart.delay,
      }}
    >
      <svg viewBox="0 0 24 24" width="100%" height="100%" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#ffc2d6" />
            <stop offset="50%" stopColor="#ff5c8a" />
            <stop offset="100%" stopColor="#e0195f" />
          </linearGradient>
        </defs>
        <path d={LOVE_HEART_PATH} fill={`url(#${gradId})`} />
      </svg>
    </span>
  );
});

export const LoveParticles = memo(function LoveParticles() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <span className="message-effect-love-layer" aria-hidden="true">
      {LOVE_HEARTS.map((heart, index) => (
        <LoveHeart
          key={heart.key}
          heart={heart}
          index={index}
          reducedMotion={reducedMotion}
        />
      ))}
    </span>
  );
});

export const LoveEffect = ({ children }) => (
  <span className="message-effect-love-host">
    <LoveParticles />
    <span className="message-effect-love-content">{children}</span>
  </span>
);

// ==========================================================================
// CELEBRATION — bubble skin (permanent, like Fire/Love)
// ==========================================================================

// Plain geometric confetti glyphs (never emoji): a little square and a
// little circle, tinted per-instance and pinned to the same four corners
// as the Love hearts so the layout logic is proven and consistent across
// effects.
const CELEBRATION_CONFETTI = [
  { key: "top-left", style: { top: "-9px", left: "-8px" }, size: 13, color: "#ffd21a", shape: "rect", delay: "0s", dur: "2.4s" },
  { key: "top-right", style: { top: "-8px", right: "-9px" }, size: 10, color: "#22d3ee", shape: "circle", delay: "0.6s", dur: "2.1s" },
  { key: "bottom-left", style: { bottom: "-8px", left: "-9px" }, size: 10, color: "#ec4899", shape: "circle", delay: "1.1s", dur: "2.6s" },
  { key: "bottom-right", style: { bottom: "-9px", right: "-8px" }, size: 12, color: "#8b5cf6", shape: "rect", delay: "0.3s", dur: "2.3s" },
];

const CelebrationConfettiPiece = memo(function CelebrationConfettiPiece({
  piece,
  reducedMotion,
}) {
  return (
    <span
      className={`message-effect-celebration-confetti message-effect-celebration-confetti-${piece.shape}`}
      style={{
        ...piece.style,
        width: piece.size,
        height: piece.size,
        background: piece.color,
        animationDuration: reducedMotion ? "0s" : piece.dur,
        animationDelay: reducedMotion ? "0s" : piece.delay,
      }}
    />
  );
});

export const CelebrationParticles = memo(function CelebrationParticles() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <span className="message-effect-celebration-layer" aria-hidden="true">
      {CELEBRATION_CONFETTI.map((piece) => (
        <CelebrationConfettiPiece
          key={piece.key}
          piece={piece}
          reducedMotion={reducedMotion}
        />
      ))}
    </span>
  );
});

export const CelebrationEffect = ({ children }) => (
  <span className="message-effect-celebration-host">
    <CelebrationParticles />
    <span className="message-effect-celebration-content">{children}</span>
  </span>
);

// ==========================================================================
// CELEBRATION — one-off chat-wide burst
// ==========================================================================

const BURST_COLORS = ["#ffd21a", "#ff3d78", "#8b5cf6", "#22d3ee", "#34d399", "#f97316", "#ff8fce"];
const BURST_PIECE_COUNT = 46;
const BURST_DURATION_MS = 3800;

const randomBetween = (min, max) => min + Math.random() * (max - min);

const buildBurstPieces = () =>
  Array.from({ length: BURST_PIECE_COUNT }, (_, i) => {
    // 4 shapes now instead of 3 — "streamer" is a thin spinning ribbon
    // strip, which reads very differently from the squares/circles/
    // triangles and is most of what makes this feel like a real confetti
    // cannon instead of just dots falling.
    const shapeRoll = i % 4;
    const shape =
      shapeRoll === 0
        ? "circle"
        : shapeRoll === 1
          ? "rect"
          : shapeRoll === 2
            ? "triangle"
            : "streamer";
    const rotateFrom = randomBetween(0, 360);
    return {
      id: i,
      left: randomBetween(1, 98),
      size: randomBetween(6, 14),
      color: BURST_COLORS[i % BURST_COLORS.length],
      duration: randomBetween(2.2, 3.4),
      delay: randomBetween(0, 0.5),
      shape,
      rotateFrom,
      // More total spin and a much wider spin range than before so
      // pieces tumble instead of just rotating gently.
      rotateTo: rotateFrom + randomBetween(520, 980),
      // Horizontal sway as it falls, instead of a dead-straight drop —
      // this alone does a lot to make the burst read as "exploding
      // outward" rather than "leaking from the ceiling".
      drift: randomBetween(-70, 70),
    };
  });

/*
 * Renders ~3.5-4 seconds of falling confetti plus a quick radial flash
 * pop at the start, over whatever it's placed inside (ChatContainer gives
 * it a `position: relative` box the size of the whole chat area). It
 * calls `onDone` once and expects the parent to stop rendering it — it
 * does not remove itself from the DOM.
 */
export const CelebrationBurst = ({ onDone }) => {
  const reducedMotion = usePrefersReducedMotion();
  const piecesRef = useRef(null);
  if (!piecesRef.current) {
    piecesRef.current = buildBurstPieces();
  }

  useEffect(() => {
    const delay = reducedMotion ? 0 : BURST_DURATION_MS;
    const timer = setTimeout(() => onDone?.(), delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  if (reducedMotion) return null;

  return (
    <div className="message-effect-celebration-burst" aria-hidden="true">
      <span className="message-effect-celebration-burst-flash" />
      {piecesRef.current.map((p) => {
        const isStreamer = p.shape === "streamer";
        return (
          <span
            key={p.id}
            className={`message-effect-celebration-burst-piece message-effect-celebration-burst-piece-${p.shape}`}
            style={{
              left: `${p.left}%`,
              width: isStreamer
                ? p.size * 0.32
                : p.shape === "rect"
                  ? p.size * 0.75
                  : p.size,
              height: isStreamer ? p.size * 2.6 : p.size,
              background: p.shape === "triangle" ? "transparent" : p.color,
              borderBottomColor: p.shape === "triangle" ? p.color : undefined,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              "--celebration-rotate-from": `${p.rotateFrom}deg`,
              "--celebration-rotate-to": `${p.rotateTo}deg`,
              "--celebration-drift": `${p.drift}px`,
            }}
          />
        );
      })}
    </div>
  );
};

// ==========================================================================
// GIFT — wrapped-present bubble that unwraps on tap, then stays open
// ==========================================================================

const GIFT_OPENED_STORAGE_KEY = "toffe:opened-gifts";

function loadOpenedGiftIds() {
  try {
    const raw = window.localStorage.getItem(GIFT_OPENED_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    // Private browsing / storage disabled / corrupt value — just treat
    // every gift as unopened rather than throwing.
    return new Set();
  }
}

function isGiftOpened(messageId) {
  if (!messageId) return false;
  return loadOpenedGiftIds().has(messageId);
}

function persistGiftOpened(messageId) {
  if (!messageId) return;
  try {
    const ids = loadOpenedGiftIds();
    ids.add(messageId);
    window.localStorage.setItem(
      GIFT_OPENED_STORAGE_KEY,
      JSON.stringify([...ids])
    );
  } catch {
    // Ignore storage failures — worst case the gift re-wraps on refresh.
  }
}

// Single hand-drawn satin bow: two ribbon tails with a notched cut, two
// looped ribbon ends, and a small knot on top holding it together. Built
// from plain cubic-bezier/line paths (same "one glyph, reused" approach
// as LOVE_HEART_PATH) rather than five traced keyframes, since a bow only
// needs to sit still and shine, not flicker like a flame.
const GiftBow = memo(function GiftBow() {
  return (
    <svg
      className="message-effect-gift-bow"
      viewBox="0 0 64 46"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="message-effect-gift-bow-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#ffe3ea" />
          <stop offset="100%" stopColor="#ffaec4" />
        </linearGradient>
      </defs>

      {/* Ribbon tails, crossed slightly and notched at the bottom. */}
      <path
        className="message-effect-gift-bow-tail"
        d="M29 25 L21 43 L26.5 39.5 L30 45 L32 27 Z"
        fill="url(#message-effect-gift-bow-grad)"
        stroke="#d6546f"
        strokeWidth="0.6"
      />
      <path
        className="message-effect-gift-bow-tail"
        d="M35 25 L43 43 L37.5 39.5 L34 45 L32 27 Z"
        fill="url(#message-effect-gift-bow-grad)"
        stroke="#d6546f"
        strokeWidth="0.6"
      />

      {/* Two ribbon loops. */}
      <path
        className="message-effect-gift-bow-loop"
        d="M32 23 C 21 3 3 4 5 17 C 6.5 26 21 25 32 23 Z"
        fill="url(#message-effect-gift-bow-grad)"
        stroke="#d6546f"
        strokeWidth="0.8"
      />
      <path
        className="message-effect-gift-bow-loop"
        d="M32 23 C 43 3 61 4 59 17 C 57.5 26 43 25 32 23 Z"
        fill="url(#message-effect-gift-bow-grad)"
        stroke="#d6546f"
        strokeWidth="0.8"
      />

      {/* Center knot on top, plus a thin highlight so it reads as satin
          rather than flat paper. */}
      <rect
        className="message-effect-gift-bow-knot"
        x="25.5"
        y="17"
        width="13"
        height="13"
        rx="3.6"
        fill="url(#message-effect-gift-bow-grad)"
        stroke="#d6546f"
        strokeWidth="0.8"
      />
      <path
        d="M27 19.5 C 29 18 35 18 37 19.5"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
});

// Small twinkling sparks near the bow, same idea as the fire embers and
// the celebration/love corner glyphs — a couple of glints so the wrapped
// box reads as alive and tap-worthy while it's waiting to be opened.
const GIFT_SPARKLES = [
  { key: "a", style: { top: "2%", left: "14%" }, size: 6, delay: "0s", dur: "2.2s" },
  { key: "b", style: { top: "8%", right: "12%" }, size: 5, delay: "0.9s", dur: "2.6s" },
];

const GIFT_BURST_COLORS = ["#fff5f5", "#ffd3dc", "#ff8fa3", "#ffe08a", "#ff5c73"];

const buildGiftBurstPieces = () =>
  Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2 + randomBetween(-0.18, 0.18);
    const dist = randomBetween(24, 44);
    return {
      id: i,
      color: GIFT_BURST_COLORS[i % GIFT_BURST_COLORS.length],
      size: randomBetween(3.5, 7),
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist - 6,
      rotate: randomBetween(0, 360),
      delay: randomBetween(0, 0.08),
    };
  });

// How long the box lingers in its pop-then-fall before the real "opened"
// bubble is left fully settled. Kept in one place since the JS timeout
// that swaps stages and the CSS animation duration on the falling clone
// both have to agree on this number.
const GIFT_FALL_DURATION_MS = 1500;

export const GiftEffect = memo(function GiftEffect({ children, messageId }) {
  const reducedMotion = usePrefersReducedMotion();

  // "wrapped" -> "opening" (box pops, then falls away as a portal clone)
  // -> "opened" (permanent). Starts pre-opened if this message id was
  // already unwrapped in an earlier session.
  const [stage, setStage] = useState(() =>
    isGiftOpened(messageId) ? "opened" : "wrapped"
  );

  // Screen-space box the wrapped present occupied at the exact instant it
  // was tapped. The falling clone is a `position: fixed` portal spawned
  // at this rect, so it starts pixel-for-pixel over the real box, then
  // it's free to pop bigger and fall straight down through everything —
  // other bubbles, the composer, the bottom of the screen — without being
  // clipped by ChatContainer's own scroll/overflow, the way an in-place
  // element would be.
  const [fallRect, setFallRect] = useState(null);

  // Which way it tumbles — randomized per tap so repeat opens (different
  // messages, or reopening in dev) don't all drift the same direction at
  // the same angle. Sign is shared between the horizontal drift and the
  // spin so it reads as one coherent tumble rather than sliding one way
  // while spinning the other.
  const [fallParams, setFallParams] = useState(null);

  const wrapRef = useRef(null);

  const burstPiecesRef = useRef(null);
  if (!burstPiecesRef.current) {
    burstPiecesRef.current = buildGiftBurstPieces();
  }

  const handleOpen = useCallback(
    (event) => {
      event.stopPropagation();
      setStage((current) => {
        if (current !== "wrapped") return current;
        persistGiftOpened(messageId);

        if (reducedMotion) return "opened";

        const rect = wrapRef.current?.getBoundingClientRect();
        if (rect) {
          setFallRect({
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          });

          const dir = Math.random() < 0.5 ? -1 : 1;
          setFallParams({
            driftX: dir * randomBetween(16, 30),
            rotateEnd: dir * randomBetween(30, 60),
            popRotate: -dir * randomBetween(3, 7),
          });
        }
        return "opening";
      });
    },
    [messageId, reducedMotion]
  );

  const handleKeyOpen = useCallback(
    (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleOpen(event);
      }
    },
    [handleOpen]
  );

  useEffect(() => {
    if (stage !== "opening") return undefined;
    const timer = setTimeout(() => setStage("opened"), GIFT_FALL_DURATION_MS);
    return () => clearTimeout(timer);
  }, [stage]);

  const wrapped = stage === "wrapped";
  const opening = stage === "opening";

  // The real message skin (deep red "opened" background) reveals the
  // moment the box starts falling, not after it lands — same as the
  // reference video, where you can already see the message underneath
  // while the box is still on its way down.
  const revealed = !wrapped;

  return (
    <span
      className={`message-effect-gift-host${revealed ? " is-opened" : ""}`}
    >
      {wrapped && (
        <span
          ref={wrapRef}
          className="message-effect-gift-wrap is-idle"
          role="button"
          tabIndex={0}
          aria-label="Open gift message"
          onClick={handleOpen}
          onKeyDown={handleKeyOpen}
        >
          <span className="message-effect-gift-clip">
            <span className="message-effect-gift-box" />
            <span className="message-effect-gift-ribbon-v" />
            <span className="message-effect-gift-ribbon-h" />
          </span>
          <GiftBow />

          {!reducedMotion &&
            GIFT_SPARKLES.map((s) => (
              <span
                key={s.key}
                className="message-effect-gift-sparkle"
                style={{
                  ...s.style,
                  width: s.size,
                  height: s.size,
                  animationDuration: s.dur,
                  animationDelay: s.delay,
                }}
              />
            ))}
        </span>
      )}

      {opening &&
        fallRect &&
        fallParams &&
        typeof document !== "undefined" &&
        createPortal(
          <span
            className="message-effect-gift-falling"
            aria-hidden="true"
            style={{
              top: fallRect.top,
              left: fallRect.left,
              width: fallRect.width,
              height: fallRect.height,
              animationDuration: `${GIFT_FALL_DURATION_MS}ms`,
              // How far the clone has to travel to clear the bottom of
              // the viewport entirely, from wherever the message
              // actually sits on screen — so it always falls fully off
              // the bottom no matter where in the chat it was tapped.
              "--gift-fall-distance": `${Math.max(
                window.innerHeight - fallRect.top + 200,
                360
              )}px`,
              // Randomized per tap so the tumble direction isn't always
              // the same — see handleOpen.
              "--gift-drift-x": `${fallParams.driftX}vw`,
              "--gift-rotate-end": `${fallParams.rotateEnd}deg`,
              "--gift-pop-rotate": `${fallParams.popRotate}deg`,
            }}
          >
            <span className="message-effect-gift-clip">
              <span className="message-effect-gift-box" />
              <span className="message-effect-gift-ribbon-v" />
              <span className="message-effect-gift-ribbon-h" />
            </span>
            <GiftBow />

            <span className="message-effect-gift-burst">
              {burstPiecesRef.current.map((p) => (
                <span
                  key={p.id}
                  className="message-effect-gift-burst-piece"
                  style={{
                    background: p.color,
                    width: p.size,
                    height: p.size,
                    animationDelay: `${p.delay}s`,
                    "--gift-tx": `${p.tx}px`,
                    "--gift-ty": `${p.ty}px`,
                    "--gift-rotate": `${p.rotate}deg`,
                  }}
                />
              ))}
            </span>
          </span>,
          document.body
        )}

      <span
        className="message-effect-gift-content"
        style={{ visibility: wrapped ? "hidden" : "visible" }}
      >
        {children}
      </span>
    </span>
  );
});

/*
 * These compatibility exports intentionally render no additional effect.
 */
export const GiftReveal = ({ children }) => children;
export const HeartsEffect = LoveEffect;

export const MessageEffect = ({ effect, children, messageId }) => {
  if (effect === "fire") {
    return <FireEffect>{children}</FireEffect>;
  }

  if (effect === "love") {
    return <LoveEffect>{children}</LoveEffect>;
  }

  if (effect === "celebration") {
    return <CelebrationEffect>{children}</CelebrationEffect>;
  }

  if (effect === "gift") {
    return <GiftEffect messageId={messageId}>{children}</GiftEffect>;
  }

  return children;
};

export default MessageEffect;

import { useEffect, useRef, useState } from "react";
import { wallpaperIdbCache } from "./wallpaperIdbCache";

// Resolves a saved wallpaper URL into something the browser can paint
// instantly, and does so as soon as the URL is SAVED — not only when
// the wallpaper is toggled active. That's the key to a fast toggle:
// by the time the user flips it on, the work is already done.
//
//   - data: URLs (uploaded-from-file wallpapers) are already in memory,
//     no network involved. We just warm the decode so the very first
//     paint isn't the one paying to decode a large image.
//   - http(s) URLs (picked from the gallery) get fetched ONCE, the raw
//     bytes stored in IndexedDB as a Blob, and an object URL created
//     from that local copy. Every later toggle/reload reads the bytes
//     straight off disk — no network round trip.
export function useCachedWallpaperUrl(rawUrl) {
  const [resolvedUrl, setResolvedUrl] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    // Release the previous blob: URL before creating/adopting a new one.
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!rawUrl) {
      setResolvedUrl(null);
      return;
    }

    if (rawUrl.startsWith("data:")) {
      const img = new Image();
      img.src = rawUrl;
      img.decode?.().catch(() => {}); // best-effort decode warm-up
      setResolvedUrl(rawUrl);
      return;
    }

    (async () => {
      try {
        let blob = await wallpaperIdbCache.get(rawUrl);

        if (!blob) {
          const res = await fetch(rawUrl);
          blob = await res.blob();
          wallpaperIdbCache.set(rawUrl, blob); // fire-and-forget
        }

        if (cancelled) return;

        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;

        // Warm the decode BEFORE handing the URL back, so the actual
        // CSS background-image swap on toggle never stalls on decoding.
        const img = new Image();
        img.src = objectUrl;
        await img.decode?.().catch(() => {});

        if (!cancelled) setResolvedUrl(objectUrl);
      } catch {
        if (!cancelled) setResolvedUrl(rawUrl); // fall back to the direct URL
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [rawUrl]);

  // Release the object URL on unmount.
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  return resolvedUrl;
}

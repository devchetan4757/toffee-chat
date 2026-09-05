import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X, ZoomIn } from "lucide-react";

/**
 * A dependency-free crop tool: drag to reposition, use the slider (or
 * scroll/pinch) to zoom, confirm to export an image at a fixed output
 * size — no matter what aspect ratio the source image came in at.
 *
 * Originally built as an Instagram-style square avatar cropper, now
 * generalized with two extra props so the same component can also
 * crop a rectangular chat wallpaper:
 *
 * Props:
 *  - imageSrc: string (data URL or remote URL)
 *  - crossOrigin: boolean — pass true for remote URLs so the canvas
 *    export isn't "tainted" (Cloudinary allows this by default)
 *  - aspect: number, width / height of the crop frame (default 1 —
 *    a square, matching the original avatar behavior exactly)
 *  - shape: "circle" | "rect" — visual shape of the crop frame
 *    (default "circle", matching the original avatar behavior)
 *  - outputSize: number, the exported image's larger dimension in
 *    pixels (default 480 — same as the original avatar export)
 *  - onCancel: () => void
 *  - onConfirm: (dataUrl: string) => void | Promise<void>
 *  - onCropUnavailable: () => void — called if the browser refuses to
 *    read pixels back (cross-origin restriction on a remote image);
 *    the caller should fall back to using the original image as-is
 *  - busy: boolean — disables the confirm button while the parent is
 *    uploading / saving
 */
const ImageCropper = ({
  imageSrc,
  crossOrigin = false,
  aspect = 1,
  shape = "circle",
  outputSize = 480,
  onCancel,
  onConfirm,
  onCropUnavailable,
  busy = false,
}) => {
  // On-screen crop frame — width is fixed, height follows the aspect
  // ratio, so a square (aspect=1) reproduces the original 260x260
  // avatar frame exactly.
  const FRAME_W = 260;
  const FRAME_H = Math.round(FRAME_W / aspect);

  // Exported image dimensions, same aspect ratio as the frame. For
  // aspect=1 this is outputSize x outputSize (480x480 by default —
  // identical to the original avatar export).
  const OUTPUT_W = outputSize;
  const OUTPUT_H = Math.round(outputSize / aspect);

  const imgRef = useRef(null);
  const dragState = useRef(null);

  const [ready, setReady] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const totalScale = baseScale * zoom;

  const clampOffset = useCallback(
    (next, scale, natural) => {
      const maxX = Math.max(0, (natural.w * scale - FRAME_W) / 2);
      const maxY = Math.max(0, (natural.h * scale - FRAME_H) / 2);
      return {
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
      };
    },
    [FRAME_W, FRAME_H]
  );

  const handleImgLoad = () => {
    const img = imgRef.current;
    if (!img) return;

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    // Cover the frame fully regardless of the image's own ratio
    const scale = Math.max(FRAME_W / w, FRAME_H / h);

    setNaturalSize({ w, h });
    setBaseScale(scale);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setReady(true);
  };

  // Re-clamp position whenever zoom changes, so zooming out never
  // leaves the frame partially empty
  useEffect(() => {
    if (!ready) return;
    setOffset((prev) => clampOffset(prev, baseScale * zoom, naturalSize));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, ready]);

  const startDrag = (clientX, clientY) => {
    dragState.current = { startX: clientX, startY: clientY, origin: offset };
  };

  const moveDrag = (clientX, clientY) => {
    if (!dragState.current) return;
    const { startX, startY, origin } = dragState.current;
    const next = {
      x: origin.x + (clientX - startX),
      y: origin.y + (clientY - startY),
    };
    setOffset(clampOffset(next, totalScale, naturalSize));
  };

  const endDrag = () => {
    dragState.current = null;
  };

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    startDrag(e.clientX, e.clientY);
  };
  const handlePointerMove = (e) => {
    if (dragState.current) moveDrag(e.clientX, e.clientY);
  };
  const handleWheel = (e) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.0015;
    setZoom((z) => Math.min(3, Math.max(1, z + delta)));
  };

  const handleConfirm = () => {
    const img = imgRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;
    const ctx = canvas.getContext("2d");

    // Map on-screen frame pixels -> output canvas pixels (same ratio
    // on both axes, since OUTPUT_W/H and FRAME_W/H share the aspect),
    // then replay the exact same translate/scale the user sees on
    // screen.
    const displayToOutput = OUTPUT_W / FRAME_W;

    ctx.save();
    ctx.translate(OUTPUT_W / 2, OUTPUT_H / 2);
    ctx.scale(displayToOutput, displayToOutput);
    ctx.translate(offset.x, offset.y);
    ctx.scale(totalScale, totalScale);
    ctx.drawImage(img, -naturalSize.w / 2, -naturalSize.h / 2);
    ctx.restore();

    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      onConfirm(dataUrl);
    } catch (err) {
      // Cross-origin image without permissive CORS headers taints the
      // canvas — we can't read pixels back to export a crop.
      console.error("Crop export failed:", err);
      onCropUnavailable?.();
    }
  };

  const frameShapeClass = shape === "circle" ? "rounded-full" : "rounded-xl";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative overflow-hidden ${frameShapeClass} bg-black/20 cursor-grab active:cursor-grabbing select-none`}
        style={{ width: FRAME_W, height: FRAME_H, touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onWheel={handleWheel}
      >
        <img
          ref={imgRef}
          src={imageSrc}
          alt="Crop preview"
          crossOrigin={crossOrigin ? "anonymous" : undefined}
          onLoad={handleImgLoad}
          draggable={false}
          className="absolute top-1/2 left-1/2 max-w-none pointer-events-none"
          style={{
            width: naturalSize.w || undefined,
            height: naturalSize.h || undefined,
            opacity: ready ? 1 : 0,
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${totalScale})`,
            transformOrigin: "center center",
          }}
        />

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/70">
            Loading…
          </div>
        )}

        {/* subtle ring hinting at the final crop shape */}
        <div className={`absolute inset-0 ${frameShapeClass} ring-1 ring-inset ring-white/40 pointer-events-none`} />
      </div>

      <div className="flex items-center gap-2 w-full max-w-[260px]">
        <ZoomIn className="w-4 h-4 text-base-content/50 shrink-0" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="range range-xs range-primary"
          disabled={!ready}
        />
      </div>

      <p className="text-xs text-base-content/50 text-center">
        Drag to reposition · scroll or use the slider to zoom
      </p>

      <div className="flex gap-2">
        <button className="btn btn-sm btn-ghost" onClick={onCancel} disabled={busy}>
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={handleConfirm}
          disabled={!ready || busy}
        >
          <Check className="w-4 h-4" />
          {busy ? "Saving..." : "Use Photo"}
        </button>
      </div>
    </div>
  );
};

export default ImageCropper;

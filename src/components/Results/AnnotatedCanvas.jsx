import { useEffect, useRef, useState } from "react";
import "./AnnotatedCanvas.css";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
];

export default function AnnotatedCanvas({ imageUrl, components }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const [hovered, setHovered] = useState(null); // component id
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });

  // Draw whenever imageUrl, components, or hovered changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    // img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      // Fit image inside wrapper width while keeping aspect ratio
      const maxW = wrapper.clientWidth;
      const scale = maxW / img.naturalWidth;
      const W = Math.round(img.naturalWidth * scale);
      const H = Math.round(img.naturalHeight * scale);

      canvas.width = W;
      canvas.height = H;
      setCanvasSize({ w: W, h: H });

      // Draw base image
      ctx.drawImage(img, 0, 0, W, H);

      // Draw bounding boxes
      components.forEach((comp, i) => {
        const color = COLORS[i % COLORS.length];
        const x = comp.x * W;
        const y = comp.y * H;
        const w = comp.width * W;
        const h = comp.height * H;

        const isHovered = hovered === comp.id;
        const alpha = hovered === null ? 1 : isHovered ? 1 : 0.35;

        ctx.globalAlpha = alpha;

        // Box fill
        ctx.fillStyle = color + "22"; // ~13% opacity fill
        ctx.fillRect(x, y, w, h);

        // Box stroke
        ctx.strokeStyle = color;
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.strokeRect(x, y, w, h);

        // Label pill
        const label = comp.label;
        const fontSize = Math.max(11, Math.min(13, W * 0.016));
        ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
        const textW = ctx.measureText(label).width;
        const padX = 7,
          padY = 4;
        const pillH = fontSize + padY * 2;
        const pillY = y - pillH - 2 < 0 ? y + 2 : y - pillH - 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, pillY, textW + padX * 2, pillH, 4);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.globalAlpha = alpha;
        ctx.fillText(label, x + padX, pillY + pillH - padY - 1);

        ctx.globalAlpha = 1;
      });
    };
  }, [imageUrl, components, hovered]);

  // Hit-test on mouse move
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    const hit = components.find((comp) => {
      const x = comp.x * canvas.width;
      const y = comp.y * canvas.height;
      const w = comp.width * canvas.width;
      const h = comp.height * canvas.height;
      return mx >= x && mx <= x + w && my >= y && my <= y + h;
    });
    setHovered(hit ? hit.id : null);
  };

  return (
    <div className="ac-wrapper" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="ac-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      />
      {/* Component legend */}
      <div className="ac-legend">
        {components.map((comp, i) => (
          <div
            key={comp.id}
            className={`ac-legend-item ${hovered === comp.id ? "ac-legend-item--active" : ""}`}
            onMouseEnter={() => setHovered(comp.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="ac-legend-dot"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="ac-legend-label">{comp.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

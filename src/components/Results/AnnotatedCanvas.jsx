import { useEffect, useRef, useState } from "react";
import "./AnnotatedCanvas.css";

// ── 14 component classes — keys match exactly what the backend sends ──────────
const CLASS_COLORS = {
  heading: "#6366f1", // indigo
  link: "#f59e0b", // amber
  image: "#3b82f6", // blue
  text: "#10b981", // emerald
  list: "#ec4899", // pink
  header: "#ef4444", // red
  footer: "#78716c", // stone
  table: "#64748b", // slate
  input: "#14b8a6", // teal
  button: "#f97316", // orange
  navigation: "#8b5cf6", // violet
  sidebar: "#06b6d4", // cyan
  dialog: "#a855f7", // purple
  container: "#84cc16", // lime
};

const FALLBACK_COLOR = "#9ca3af"; // gray — for any label not in the map

function getColor(label) {
  return CLASS_COLORS[label] || FALLBACK_COLOR;
}

// returns unique labels in the order they first appear in the components array
function getUniqueClasses(components) {
  const seen = new Set();
  const classes = [];
  components.forEach((comp) => {
    if (!seen.has(comp.class)) {
      seen.add(comp.class);
      classes.push(comp.class);
    }
  });
  return classes;
}

//Component
export default function AnnotatedCanvas({ imageUrl, components }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);

  // store original image dimensions so handleMouseMove can normalize coords
  // useRef because changing these should NOT cause a re-render
  const naturalWidthRef = useRef(0);
  const naturalHeightRef = useRef(0);

  // hoveredId   — id of a single box being hovered on the canvas
  // activeClass — label clicked in the legend (highlights ALL boxes of that class)
  const [hoveredId, setHoveredId] = useState(null);
  const [activeClass, setActiveClass] = useState(null);

  const uniqueClasses = getUniqueClasses(components);

  // ── helper — converts absolute bbox coords to canvas pixel coords ─────────
  // called in both the draw loop and the hit test
  // naturalW/naturalH = original image pixel dimensions from img.naturalWidth/Height
  // canvasW/canvasH   = actual canvas drawing dimensions (scaled to fit wrapper)
  function toCanvasCoords(comp, naturalW, naturalH, canvasW, canvasH) {
    // step 1 — normalize: divide by original image dimensions to get 0-1 values
    const normX = comp.bbox.x / naturalW;
    const normY = comp.bbox.y / naturalH;
    const normW = comp.bbox.width / naturalW;
    const normH = comp.bbox.height / naturalH;

    // step 2 — scale to canvas: multiply by canvas dimensions
    return {
      x: normX * canvasW,
      y: normY * canvasH,
      w: normW * canvasW,
      h: normH * canvasH,
    };
  }
  // ── Draw ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;

    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      // img.naturalWidth/Height are the original pixel dimensions of the image
      // e.g. if the image is 1920x1080, naturalWidth=1920, naturalHeight=1080
      const naturalW = img.naturalWidth;
      const naturalH = img.naturalHeight;

      // store in refs so handleMouseMove can access them without a re-render
      naturalWidthRef.current = naturalW;
      naturalHeightRef.current = naturalH;

      // scale image to fit wrapper width, preserve aspect ratio
      const maxW = wrapper.clientWidth;
      const scale = maxW / img.naturalWidth;
      const W = Math.round(img.naturalWidth * scale);
      const H = Math.round(img.naturalHeight * scale);

      canvas.width = W;
      canvas.height = H;

      // 1. draw the base image
      ctx.drawImage(img, 0, 0, W, H);

      // 2. draw bounding boxes on top
      components.forEach((comp) => {
        const color = getColor(comp.class); // color by class label

        // convert absolute pixel bbox coords → canvas pixel coords
        const { x, y, w, h } = toCanvasCoords(comp, naturalW, naturalH, W, H);

        // ── alpha logic ───────────────────────────────────────────────────
        // activeClass takes priority over hoveredId
        // if a legend class is selected → dim everything not in that class
        // else if a box is hovered      → dim everything except that box
        // else                          → all boxes full opacity
        let alpha = 1;
        if (activeClass !== null) {
          alpha = comp.class === activeClass ? 1 : 0.1;
        } else if (hoveredId !== null) {
          alpha = comp.id === hoveredId ? 1 : 0.1;
        }

        ctx.globalAlpha = alpha;

        // box fill — color at ~13% opacity
        // ctx.fillStyle = color + "22";
        // ctx.fillRect(x, y, w, h);

        // box border — thicker on the individually hovered box
        ctx.strokeStyle = color;
        ctx.lineWidth = comp.id === hoveredId ? 2.5 : 1.5;
        ctx.strokeRect(x, y, w, h);

        // ── label pill ────────────────────────────────────────────────────
        const fontSize = Math.max(11, Math.min(13, W * 0.016));
        ctx.font = `500 ${fontSize}px system-ui, sans-serif`;
        const textW = ctx.measureText(comp.class).width;
        const padX = 7;
        const padY = 4;
        const pillH = fontSize + padY * 2;
        // flip pill below the box if it would go off the top of the canvas
        const pillY = y - pillH - 2 < 0 ? y + 2 : y - pillH - 2;

        // pill background
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, pillY, textW + padX * 2, pillH, 4);
        ctx.fill();

        // pill text
        ctx.fillStyle = "#fff";
        ctx.globalAlpha = alpha;
        ctx.fillText(comp.class, x + padX, pillY + pillH - padY - 1);

        // always reset alpha after drawing each box
        ctx.globalAlpha = 1;
      });
    };
  }, [imageUrl, components, hoveredId, activeClass]);

  // ── Canvas hit test — individual box hover ────────────────────────────────
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // naturalWidth/Height stored in refs during img.onload above
    const naturalW = naturalWidthRef.current;
    const naturalH = naturalHeightRef.current;

    // guard — if image hasn't loaded yet, refs are still 0
    if (!naturalW || !naturalH) return;

    const rect = canvas.getBoundingClientRect();
    // correct for difference between CSS display size and canvas resolution
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    const hit = components.find((comp) => {
      // same normalization applied here for consistent hit detection
      const { x, y, w, h } = toCanvasCoords(
        comp,
        naturalW,
        naturalH,
        canvas.width,
        canvas.height,
      );
      return mx >= x && mx <= x + w && my >= y && my <= y + h;
    });

    setHoveredId(hit ? hit.id : null);
  };

  // ── Legend click — toggle active class ───────────────────────────────────
  function handleLegendClick(label) {
    setHoveredId(null);
    // clicking the already-active class deselects it
    setActiveClass((prev) => (prev === label ? null : label));
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="ac-wrapper"
      ref={wrapperRef}
      onClick={() => {
        setActiveClass(null);
        setHoveredId(null);
      }}
    >
      <canvas
        ref={canvasRef}
        className="ac-canvas"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredId(null)}
        onClick={(e) => e.stopPropagation()}
      />
      {/* legend — one pill per unique class found in this image */}
      <div className="ac-legend">
        {uniqueClasses.map((label) => {
          const count = components.filter((c) => c.class === label).length;
          const color = getColor(label);
          const isActive = activeClass === label;

          return (
            <div
              key={label}
              className={`ac-legend-item ${isActive ? "ac-legend-item--active" : ""}`}
              onClick={(e) => {
                e.stopPropagation(); //prevent bubble to wrapper
                handleLegendClick(label);
              }}
              title={`Click to highlight all ${label} elements`}
            >
              <span className="ac-legend-dot" style={{ background: color }} />
              <span className="ac-legend-label">{label}</span>
              {/* count badge — only shown when more than one of this class exists */}
              {count > 1 && <span className="ac-legend-count">{count}</span>}
            </div>
          );
        })}
      </div>
      <p className="ac-hint">
        Hover a box to inspect · Click a label to highlight all of that type
      </p>
      <div className="indi-comp">
        {components.map((comp, index) => (
          <div
            key={comp.id}
            onClick={(e) => {
              e.stopPropagation(); //prevent bubble to wrapper
              setActiveClass(null);
              setHoveredId((prev) => (prev === comp.id ? null : comp.id));
            }}
            className={`indi-item ${hoveredId === comp.id ? "indi-item--active" : ""}`}
          >
            {comp.class}#{comp.id}
          </div>
        ))}
      </div>

      <div className="sc-card detail-card">
        {hoveredId !== null ? (
          <section className="detail-section">
            <div className="head">
              {components[hoveredId].class}#{components[hoveredId].id}
            </div>
            <div className="divider"></div>
            <aside>
              <div>
                <span>Class:</span>
                <span className="title-issue">
                  {components[hoveredId].class}
                </span>
              </div>
              <div>
                <span>ID:</span>
                <span className="title-issue">{components[hoveredId].id}</span>
              </div>
              <div>
                <span>X-coordinate:</span>
                <span className="title-issue">
                  {components[hoveredId].bbox.x} px
                </span>
              </div>
              <div>
                <span>Y-coordinate:</span>
                <span className="title-issue">
                  {components[hoveredId].bbox.y} px
                </span>
              </div>
              <div>
                <span>Width:</span>
                <span className="title-issue">
                  {components[hoveredId].bbox.width} px
                </span>
              </div>
              <div>
                <span>Height:</span>
                <span className="title-issue">
                  {components[hoveredId].bbox.height} px
                </span>
              </div>

              <div className="issues">
                <span>Colors:</span>
                {components[hoveredId].colors !== null ? (
                  <>
                    <span className="title-issue">
                      <span className="issue-number">
                        1. Background Color:{" "}
                      </span>
                      <span>{components[hoveredId].colors.background_hex}</span>
                    </span>

                    <span className="title-issue">
                      <span className="issue-number">
                        2. Foreground Color:{" "}
                      </span>
                      <span>{components[hoveredId].colors.foreground_hex}</span>
                    </span>

                    <span className="title-issue">
                      <span className="issue-number">3. Contrast Ratio: </span>
                      <span>
                        {components[hoveredId].colors.contrast_ratio.toFixed(2)}
                      </span>
                    </span>

                    <span className="title-issue">
                      <span className="issue-number">4. Text Content: </span>
                      <span>{components[hoveredId].colors.text_content}</span>
                    </span>

                    <span className="title-issue">
                      <span className="issue-number">5. WCAG Compliant: </span>
                      <span>
                        {components[hoveredId].colors.wcag_compliant.toString()}
                      </span>
                    </span>
                  </>
                ) : (
                  <span className="title-issue">
                    No color analysis available
                  </span>
                )}
              </div>

              <div className="issues">
                <span>Issues:</span>
                {components[hoveredId].issues.length > 0 ? (
                  components[hoveredId].issues.map((eachIssue, index) => (
                    <span key={index} className="title-issue">
                      <span className="issue-number">{index + 1}. </span>
                      <span>{eachIssue}</span>
                    </span>
                  ))
                ) : (
                  <span className="title-issue">No issues</span>
                )}
              </div>
            </aside>
          </section>
        ) : (
          <section className="empty-detail">
            Select a component to view its detail
          </section>
        )}
      </div>
    </div>
  );
}

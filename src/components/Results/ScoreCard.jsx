import { useEffect, useRef } from "react";
import "./ScoreCard.css";

const CRITERIA_META = {
  clutter: {
    label: "Clutter Score",
    description: "How clean and uncluttered the UI feels",
    color: "#6366f1",
    track: "#e0e7ff",
  },
  alignment: {
    label: "Alignment",
    description: "How well elements align to a grid",
    color: "#10b981",
    track: "#d1fae5",
  },
  colorContrast: {
    label: "Color Contrast",
    description: "Accessibility of foreground vs background colors",
    color: "#f59e0b",
    track: "#fef3c7",
  },
};

function getGrade(score) {
  if (score >= 90) return { letter: "A", color: "#10b981" };
  if (score >= 75) return { letter: "B", color: "#6366f1" };
  if (score >= 60) return { letter: "C", color: "#f59e0b" };
  return { letter: "D", color: "#ef4444" };
}

function ArcRing({ score, color, track }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx  = canvas.getContext("2d");
    const size = canvas.width;
    const cx   = size / 2;
    const cy   = size / 2;
    const r    = size / 2 - 10;
    const startAngle = -Math.PI / 2;       // top
    const fullAngle  = 2 * Math.PI;

    ctx.clearRect(0, 0, size, size);

    // Track ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, fullAngle);
    ctx.strokeStyle = track;
    ctx.lineWidth   = 10;
    ctx.lineCap     = "round";
    ctx.stroke();

    // Progress ring — animate from 0
    let current = 0;
    const target  = score / 100;
    const step    = target / 40; // 40 frames

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // track
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, fullAngle);
      ctx.strokeStyle = track;
      ctx.lineWidth   = 10;
      ctx.stroke();

      // progress
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + fullAngle * current);
      ctx.strokeStyle = color;
      ctx.lineWidth   = 10;
      ctx.lineCap     = "round";
      ctx.stroke();

      if (current < target) {
        current = Math.min(current + step, target);
        requestAnimationFrame(draw);
      }
    };

    requestAnimationFrame(draw);
  }, [score, color, track]);

  return <canvas ref={canvasRef} width={110} height={110} className="sc-ring" />;
}

export default function ScoreCard({ criteriaKey, score }) {
  const meta  = CRITERIA_META[criteriaKey];
  const grade = getGrade(score);

  if (!meta) return null;

  return (
    <div className="sc-card">
      <div className="sc-ring-wrap">
        <ArcRing score={score} color={meta.color} track={meta.track} />
        <div className="sc-ring-center">
          <span className="sc-score">{score}</span>
          <span className="sc-out">/ 100</span>
        </div>
      </div>
      <div className="sc-info">
        <div className="sc-header">
          <span className="sc-label">{meta.label}</span>
          <span className="sc-grade" style={{ color: grade.color, borderColor: grade.color + "44", background: grade.color + "11" }}>
            {grade.letter}
          </span>
        </div>
        <p className="sc-desc">{meta.description}</p>
        <div className="sc-bar-track">
          <div className="sc-bar-fill" style={{ width: `${score}%`, background: meta.color }} />
        </div>
      </div>
    </div>
  );
}

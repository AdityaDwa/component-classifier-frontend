// design2-----------------------------------------------------
import { useState } from "react";
import AnnotatedCanvas from "./AnnotatedCanvas.jsx";
import ScoreCard from "./ScoreCard.jsx";
import "./Results.css";

export default function Results({
  data,
  onBack,
  onSave,
  isGuest,
  sessionExpired,
  alreadySaved,
}) {
  const { imageUrl, components, clutter, alignment, contrast } = data;

  // active tab for the score section — "clutter" | "alignment" | "colorContrast"
  const [activeScore, setActiveScore] = useState("clutter");

  const saveBlocked = isGuest;

  const scoreEntries = [
    { key: "clutter", label: "Clutter", val: clutter.score },
    { key: "alignment", label: "Alignment", val: alignment.score * 100 },
    { key: "colorContrast", label: "Contrast", val: contrast.average_contrast },
  ];

  // find the active score entry
  const activeEntry = scoreEntries.find((e) => e.key === activeScore);

  return (
    <div className="res-page">
      {/* ── Top bar ────────────────────────────────────────────────────── */}
      <div className="res-topbar">
        <button className="res-back-btn" onClick={onBack} type="button">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M10 3L5 8l5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Evaluate another
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* score pills summary — quick glance at all three */}
          <div className="res-score-pills">
            {scoreEntries.map(({ key, label, val }) => (
              <button
                key={key}
                className={`res-score-pill ${activeScore === key ? "res-score-pill--active" : ""}`}
                onClick={() => setActiveScore(key)}
                type="button"
              >
                <span className="res-score-pill-label">{label}</span>
                <span className="res-score-pill-val">{val.toFixed(1)}</span>
              </button>
            ))}
          </div>

          {/* Save button */}
          <button
            className={`res-save-btn ${saveBlocked || alreadySaved ? "res-save-btn--guest" : ""}`}
            onClick={onSave}
            type="button"
            disabled={alreadySaved || data.isSaved}
            title={
              alreadySaved || data.isSaved
                ? "Already saved"
                : saveBlocked
                  ? "Sign in to save your results"
                  : "Save result"
            }
          >
            {alreadySaved || data.isSaved ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle
                    cx="7"
                    cy="7"
                    r="6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M4 7l2 2 4-4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Saved
              </>
            ) : saveBlocked ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect
                    x="3"
                    y="6"
                    width="8"
                    height="7"
                    rx="1.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M5 6V4.5a2 2 0 014 0V6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                Sign in to save
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 2h8l2 2v8a1 1 0 01-1 1H3a1 1 0 01-1-1V2z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                  <path
                    d="M5 2v4h4V2M4 8h6"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
                Save result
              </>
            )}
          </button>
        </div>
      </div>

      {/* session expired banner */}
      {isGuest && sessionExpired && (
        <div className="res-expired-banner">
          Your guest session has ended. Sign in to save your results or evaluate
          more images.
        </div>
      )}

      {/* ── Main two-column layout ─────────────────────────────────────── */}
      <div className="res-layout">
        {/* ── LEFT — canvas (wider) ──────────────────────────────────── */}
        <section className="res-image-section">
          <div className="res-section-title">
            <span className="res-section-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect
                  x="1"
                  y="1"
                  width="13"
                  height="13"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M4 10l2.5-3L9 9.5l2-2.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            Detected components
            <span className="res-count-badge">{components.length}</span>
          </div>
          <p className="res-section-sub">
            Hover a box to inspect · Click a legend label to highlight all of
            that type
          </p>
          <AnnotatedCanvas imageUrl={imageUrl} components={components} />
        </section>

        {/* ── RIGHT — score tabs (narrower, sticky) ─────────────────── */}
        <section className="res-scores-section">
          {/* tab switcher */}
          <div className="res-score-tabs">
            {scoreEntries.map(({ key, label, val }) => (
              <button
                key={key}
                className={`res-score-tab ${activeScore === key ? "res-score-tab--active" : ""}`}
                onClick={() => setActiveScore(key)}
                type="button"
              >
                <span className="res-score-tab-label">{label}</span>
                <span className="res-score-tab-val">{val.toFixed(1)}</span>
              </button>
            ))}
          </div>

          {/* only the active score card renders */}
          <div className="res-score-content">
            <ScoreCard
              key={activeScore}
              criteriaKey={activeScore}
              score={activeEntry.val}
              data={data}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

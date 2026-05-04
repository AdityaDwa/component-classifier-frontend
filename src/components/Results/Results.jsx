import AnnotatedCanvas from "./AnnotatedCanvas";
import ScoreCard from "./ScoreCard";
import "./Results.css";

// onSave      → called when Save button clicked (App handles guest check)
// isGuest     → true if user is not logged in
// sessionExpired → true if guest 25min timer has fired
export default function Results({
  data,
  onBack,
  onSave,
  isGuest,
  sessionExpired,
}) {
  const { imageUrl, components, clutter, alignment, contrast } = data;

  // const avg = Math.round(
  //   (clutter.score + alignment.score + contrast.average_contrast) / 3,
  // );

  // Save button is visually different for guests to hint they need to sign in
  const saveBlocked = isGuest; // always prompt guests, regardless of timer
  const scoreEntries = [
    { key: "clutter", val: clutter.score },
    { key: "alignment", val: alignment.score * 100 },
    { key: "colorContrast", val: contrast.average_contrast },
  ];
  return (
    <div className="res-page">
      {/* Top bar */}
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
          {/* Overall score */}
          <div className="res-overall">
            {/* <span className="res-overall-label">Overall score</span>
            <span className="res-overall-score">
              {avg}
              <span className="res-overall-max">/100</span>
            </span> */}
          </div>

          {/* Save button */}
          <button
            className={`res-save-btn ${saveBlocked ? "res-save-btn--guest" : ""} ${data.isSaved ? "res-save-btn--disabled" : ""}`}
            onClick={onSave}
            type="button"
            disabled={data.isSaved}
            title={saveBlocked ? "Sign in to save your results" : "Save result"}
          >
            {saveBlocked ? (
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

      {/* Session expired banner — shown to guests after 25min */}
      {isGuest && sessionExpired && (
        <div className="res-expired-banner">
          Your guest session has ended. Sign in to save your results or evaluate
          more images.
        </div>
      )}

      <div className="res-layout">
        {/* Left — annotated image */}
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
            Hover a label or box to highlight it
          </p>
          <AnnotatedCanvas imageUrl={imageUrl} components={components} />
        </section>

        {/* Right — scores */}
        <section className="res-scores-section">
          <div className="res-section-title">
            <span className="res-section-icon">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path
                  d="M2 11l3.5-4 3 2.5L12 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            UI quality scores
          </div>
          {/* <p className="res-section-sub">Each criterion is rated out of 100</p> */}

          <div className="res-scores-list">
            {scoreEntries.map(({ key, val }) => (
              <ScoreCard key={key} criteriaKey={key} score={val} data={data} />
            ))}
          </div>

          {/* Summary strip */}
          {/* <div className="res-summary">
            <div className="res-summary-row">
              <span>Clutter</span>
              <span className="res-summary-val">{clutter.score}</span>
            </div>
            <div className="res-summary-row">
              <span>Alignment</span>
              <span className="res-summary-val">{alignment.score}</span>
            </div>
            <div className="res-summary-row">
              <span>Color Contrast</span>
              <span className="res-summary-val">
                {contrast.average_contrast}
              </span>
            </div>
            <div className="res-summary-row res-summary-total">
              <span>Average</span>
              <span className="res-summary-val">{avg}</span>
            </div>
          </div> */}
        </section>
      </div>
    </div>
  );
}

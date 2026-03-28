import "./SavedEvaluations.css";

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    year:  "numeric",
    month: "short",
    day:   "numeric",
  });
}

function getOverallScore(scores) {
  return Math.round(
    (scores.clutter + scores.alignment + scores.colorContrast) / 3
  );
}

function ScorePill({ score }) {
  // color the pill based on score range
  let colorClass = "se-score-pill--low";
  if (score >= 75) colorClass = "se-score-pill--high";
  else if (score >= 60) colorClass = "se-score-pill--mid";

  return (
    <span className={`se-score-pill ${colorClass}`}>
      {score}/100
    </span>
  );
}

export default function SavedEvaluations({ evaluations, onOpen, onDelete }) {
  // empty state
  if (evaluations.length === 0) {
    return (
      <div className="se-page">
        <div className="se-header">
          <h1 className="se-title">Saved evaluations</h1>
          <p className="se-subtitle">Your saved UI evaluations will appear here</p>
        </div>
        <div className="se-empty">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="6" width="32" height="28" rx="4"
              stroke="#d1d5db" strokeWidth="1.5" fill="none"/>
            <path d="M13 20h14M13 26h8" stroke="#d1d5db"
              strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M13 14h14" stroke="#d1d5db"
              strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="se-empty-text">No saved evaluations yet</p>
          <p className="se-empty-sub">
            Evaluate a UI screenshot and click Save to store your results here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="se-page">
      <div className="se-header">
        <h1 className="se-title">Saved evaluations</h1>
        <p className="se-subtitle">
          {evaluations.length} evaluation{evaluations.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      <div className="se-grid">
        {evaluations.map((evaluation) => (
          <div
            key={evaluation._id}
            className="se-card"
            onClick={() => onOpen(evaluation)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onOpen(evaluation)}
          >
            {/* thumbnail */}
            <div className="se-card-thumb-wrap">
              <img
                src={evaluation.imageUrl}
                alt={evaluation.savedName}
                className="se-card-thumb"
              />
              {/* score pill sits over the thumbnail */}
              <ScorePill score={getOverallScore(evaluation.scores)} />
            </div>

            {/* card info */}
            <div className="se-card-info">
              <p className="se-card-name">{evaluation.savedName}</p>
              <p className="se-card-date">{formatDate(evaluation.createdAt)}</p>

              {/* three individual scores */}
              <div className="se-card-scores">
                <span className="se-card-score-item">
                  <span className="se-card-score-label">Clutter</span>
                  <span className="se-card-score-val">{evaluation.scores.clutter}</span>
                </span>
                <span className="se-card-score-item">
                  <span className="se-card-score-label">Align</span>
                  <span className="se-card-score-val">{evaluation.scores.alignment}</span>
                </span>
                <span className="se-card-score-item">
                  <span className="se-card-score-label">Contrast</span>
                  <span className="se-card-score-val">{evaluation.scores.colorContrast}</span>
                </span>
              </div>
            </div>

            {/* delete button */}
            <button
              className="se-card-delete"
              onClick={(e) => {
                e.stopPropagation(); // don't trigger onOpen
                onDelete(evaluation._id);
              }}
              aria-label={`Delete ${evaluation.savedName}`}
              title="Delete"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 2l9 9M11 2L2 11" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

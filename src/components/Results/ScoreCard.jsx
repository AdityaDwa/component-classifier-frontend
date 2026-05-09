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
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;
    const startAngle = -Math.PI / 2; // top
    const fullAngle = 2 * Math.PI;

    ctx.clearRect(0, 0, size, size);

    // Track ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, fullAngle);
    ctx.strokeStyle = track;
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.stroke();

    // Progress ring — animate from 0
    let current = 0;
    const target = score / 100;
    const step = target / 40; // 40 frames

    const draw = () => {
      ctx.clearRect(0, 0, size, size);

      // track
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, fullAngle);
      ctx.strokeStyle = track;
      ctx.lineWidth = 10;
      ctx.stroke();

      // progress
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, startAngle + fullAngle * current);
      ctx.strokeStyle = color;
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.stroke();

      if (current < target) {
        current = Math.min(current + step, target);
        requestAnimationFrame(draw);
      }
    };

    requestAnimationFrame(draw);
  }, [score, color, track]);

  return (
    <canvas ref={canvasRef} width={110} height={110} className="sc-ring" />
  );
}

export default function ScoreCard({ criteriaKey, score, data }) {
  const meta = CRITERIA_META[criteriaKey];
  const grade = getGrade(score);

  if (!meta) return null;

  return (
    <>
      <div className="sc-card">
        <section>
          <div className="sc-ring-wrap">
            {criteriaKey === "colorContrast" ? (
              // plain number instead of arc ring
              <div className="sc-ring-center sc-ring-plain">
                <span className="sc-score">{score.toFixed(2)}</span>
              </div>
            ) : (
              // arc ring for clutter and alignment
              <>
                <ArcRing score={score} color={meta.color} track={meta.track} />
                <div className="sc-ring-center">
                  <span className="sc-score">{score.toFixed(2)}</span>
                  <span className="sc-out">/ 100</span>
                </div>
              </>
            )}
          </div>
          <div className="sc-info">
            <div className="sc-header">
              <span className="sc-label">{meta.label}</span>
              {/* <span
                className="sc-grade"
                style={{
                  color: grade.color,
                  borderColor: grade.color + "44",
                  background: grade.color + "11",
                }}
              >
                {grade.letter}
              </span> */}
            </div>
            <p className="sc-desc">{meta.description}</p>
            {criteriaKey !== "colorContrast" && (
              <div className="sc-bar-track">
                <div
                  className="sc-bar-fill"
                  style={{ width: `${score}%`, background: meta.color }}
                />
              </div>
            )}
          </div>
        </section>
        {criteriaKey == "clutter" && (
          <aside>
            <div>
              <span>Category:</span>
              <span className="title-issue">{data.clutter.category}</span>
            </div>
            <div>
              <span>Density:</span>
              <span className="title-issue">
                {data.clutter.breakdown.density}
              </span>
            </div>
            <div>
              <span>Area Ratio:</span>
              <span className="title-issue">
                {data.clutter.breakdown.area_ratio}
              </span>
            </div>
            <div>
              <span>Spacing Variance:</span>
              <span className="title-issue">
                {data.clutter.breakdown.spacing_variance}
              </span>
            </div>
            <div>
              <span>Overlap Penalty:</span>
              <span className="title-issue">
                {data.clutter.breakdown.overlap_penalty}
              </span>
            </div>
            <div className="issues">
              <span>Issues:</span>
              {data.clutter.issues.length > 0 ? (
                data.clutter.issues.map((eachIssue, index) => (
                  <span key={index} className="title-issue">
                    <span className="issue-number">{index + 1}. </span>
                    <span>{eachIssue}</span>
                  </span>
                ))
              ) : (
                <span className="title-issue">No issues</span>
              )}
            </div>
            <div className="issues">
              <span>Suggestions:</span>
              {data.clutter.suggestions.length > 0 ? (
                data.clutter.suggestions.map((eachIssue, index) => (
                  <span key={index} className="title-issue">
                    <span className="issue-number">{index + 1}. </span>
                    <span>{eachIssue}</span>
                  </span>
                ))
              ) : (
                <span className="title-issue">No suggestions</span>
              )}
            </div>
          </aside>
        )}
        {criteriaKey == "alignment" && (
          <aside>
            <div>
              <span>Category:</span>
              <span className="title-issue">{data.alignment.category}</span>
            </div>
            <div>
              <span>Left Edge Alignment:</span>
              <span className="title-issue">
                {data.alignment.breakdown.left_edge}
              </span>
            </div>
            <div>
              <span>Center Alignment:</span>
              <span className="title-issue">
                {data.alignment.breakdown.center}
              </span>
            </div>
            <div>
              <span>Baseline Alignment:</span>
              <span className="title-issue">
                {data.alignment.breakdown.baseline}
              </span>
            </div>
            <div className="issues">
              <span>Issues:</span>
              {data.alignment.issues.length > 0 ? (
                data.alignment.issues.map((eachIssue, index) => (
                  <span key={index} className="title-issue">
                    <span className="issue-number">{index + 1}. </span>
                    <span>{eachIssue}</span>
                  </span>
                ))
              ) : (
                <span className="title-issue">No issues</span>
              )}
            </div>
            <div className="issues">
              <span>Suggestions:</span>
              {data.alignment.suggestions.length > 0 ? (
                data.alignment.suggestions.map((eachIssue, index) => (
                  <span key={index} className="title-issue">
                    <span className="issue-number">{index + 1}. </span>
                    <span>{eachIssue}</span>
                  </span>
                ))
              ) : (
                <span className="title-issue">No suggestions</span>
              )}
            </div>
          </aside>
        )}
        {criteriaKey == "colorContrast" && (
          <aside>
            <div>
              <span>Average Contrast:</span>
              <span className="title-issue">
                {data.contrast.average_contrast}
              </span>
            </div>
            <div>
              <span>Compliant Count:</span>
              <span className="title-issue">
                {data.contrast.compliant_count}
              </span>
            </div>
            <div>
              <span>Total Text Components:</span>
              <span className="title-issue">
                {data.contrast.total_text_components}
              </span>
            </div>
            <div>
              <span>Compliance Rate:</span>
              <span className="title-issue">
                {data.contrast.compliance_rate}
              </span>
            </div>
            <div className="issues">
              <span>Failed Components:</span>
              {data.contrast.failed_components.length > 0 ? (
                data.contrast.failed_components.map((eachIssue, index) => (
                  <span key={index} className="title-issue">
                    <span className="issue-number">{index + 1}. </span>
                    <span>
                      {`${eachIssue.class}#${eachIssue.component_id}`}
                    </span>
                  </span>
                ))
              ) : (
                <span className="title-issue">No failed components</span>
              )}
            </div>
            <div className="issues">
              <span>Suggestions:</span>
              {data.contrast.suggestions.length > 0 ? (
                data.contrast.suggestions.map((eachIssue, index) => (
                  <span key={index} className="title-issue">
                    <span className="issue-number">{index + 1}. </span>
                    <span>{eachIssue}</span>
                  </span>
                ))
              ) : (
                <span className="title-issue">No suggestions</span>
              )}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}

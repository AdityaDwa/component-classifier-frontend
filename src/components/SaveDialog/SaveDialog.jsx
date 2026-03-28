import { useState, useRef, useEffect } from "react";
import "./SaveDialog.css";

export default function SaveDialog({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // auto-focus the input when dialog opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedName = name.trim();

    // validate — name must not be empty
    if (!trimmedName) {
      setError("Please enter a name for this evaluation.");
      return;
    }
    if (trimmedName.length > 50) {
      setError("Name must be 50 characters or less.");
      return;
    }

    setLoading(true);
    // onSave is async — it calls the backend save endpoint
    // we await it here so we can show loading state
    await onSave(trimmedName);
    setLoading(false);
  }

  // close on backdrop click
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onCancel();
  }

  return (
    <div className="sdialog-backdrop" onClick={handleBackdropClick}>
      <div className="sdialog-box" role="dialog" aria-modal="true">
        {/* header */}
        <div className="sdialog-header">
          <h2 className="sdialog-title">Save evaluation</h2>
          <p className="sdialog-subtitle">
            Give this evaluation a name so you can find it later
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="sdialog-field">
            <label className="sdialog-label" htmlFor="eval-name">
              Name <span className="sdialog-required">*</span>
            </label>
            <input
              ref={inputRef}
              id="eval-name"
              type="text"
              className={`sdialog-input ${error ? "sdialog-input--error" : ""}`}
              placeholder="e.g. Homepage redesign v2"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(""); // clear error as user types
              }}
              maxLength={50}
            />
            {/* character counter + error in same row */}
            <div className="sdialog-field-footer">
              <span className="sdialog-error-msg">{error}</span>
              <span className="sdialog-char-count">{name.length}/50</span>
            </div>
          </div>

          <div className="sdialog-actions">
            <button
              type="button"
              className="sdialog-cancel-btn"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sdialog-save-btn"
              disabled={loading}
            >
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

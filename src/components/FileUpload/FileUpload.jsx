import { useCallback, useState, useRef } from "react";
import "./FileUpload.css";
const VALID_FILETYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]; //MIME TYPEs
const MAX_FILESIZE_MB = 10;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileUpload({
  onUpload,
  loading,
  error,
  submitLabel = "Evaluate",
}) {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  const validateAndAdd = (incomingFiles) => {
    const newFiles = [];
    const newErrors = [];
    Array.from(incomingFiles).forEach((file) => {
      if (!VALID_FILETYPES.includes(file.type)) {
        newErrors.push(`Filetype not supported for ${file.name}`);
        return;
      }
      if (file.size > MAX_FILESIZE_MB * 1024 * 1024) {
        newErrors.push(`${file.name} exceeds ${MAX_FILESIZE_MB}MB size limit.`);
        return;
      }
      setFiles((prev) => {
        if (prev.find((f) => f.name === file.name && f.size === file.size))
          return prev;
        const preview = URL.createObjectURL(file);
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            preview,
          },
        ];
      });
    });
    setErrors(newErrors);

    if (newErrors.length) {
      setTimeout(() => {
        setErrors([]);
      }, 4000);
    }
  };
  const handleDragEnter = (event) => {
    event.preventDefault();
    dragCounter.current++;
    setDragging(true);
  };
  const handleDragLeave = (event) => {
    event.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };
  const handleDragOver = (event) => event.preventDefault();
  const handleDrop = (event) => {
    event.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (event.dataTransfer.files.length)
      validateAndAdd(event.dataTransfer.files);
  };
  const handleBrowse = () => inputRef.current?.click();
  const handleInputChange = (e) => {
    if (e.target.files.length) validateAndAdd(e.target.files);
    e.target.value = "";
  };
  const removeFile = (id) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((f) => {
      if (f.preview) URL.revokeObjectURL(f.preview);
    });
    setFiles([]);
  };
  const handleUpload = () => {
    if (onUpload) onUpload(files.map((f) => f.file));
  };
  return (
    <div className="fu-page">
      <div className="fu-header">
        <h1>Upload files</h1>
        <p>
          Drag and drop or browse from your device. Images up to{" "}
          {MAX_FILESIZE_MB}MB.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`fu-dropzone ${dragging ? "fu-dropzone--active" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleBrowse}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && handleBrowse()}
        aria-label="File upload area"
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={VALID_FILETYPES.join(",")}
          onChange={handleInputChange}
          style={{ display: "none" }}
        />
        <div className="fu-dropzone__icon">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect
              x="3"
              y="7"
              width="30"
              height="24"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M18 26V15M12 21l6-6 6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="fu-dropzone__title">
          {dragging ? "Drop to add files" : "Drag files here"}
        </p>
        <span className="fu-dropzone__sub">or</span>
        <button
          className="fu-browse-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleBrowse();
          }}
          type="button"
        >
          Browse from device
        </button>
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <div className="fu-errors">
          {errors.map((err, i) => (
            <p key={i} className="fu-error">
              {err}
            </p>
          ))}
        </div>
      )}
      {error && (
        <div className="fu-errors">
          <p className="fu-error">{error}</p>
        </div>
      )}

      {/* File grid */}
      {files.length > 0 && (
        <>
          <div className="fu-grid">
            {files.map((f) => (
              <div key={f.id} className="fu-card">
                {f.preview ? (
                  <img
                    className="fu-card__thumb"
                    src={f.preview}
                    alt={f.name}
                  />
                ) : (
                  <div className="fu-card__placeholder">
                    {getFileIcon(f.type)}
                  </div>
                )}
                <div className="fu-card__info">
                  <span className="fu-card__name">{f.name}</span>
                  <span className="fu-card__size">
                    {formatFileSize(f.size)}
                  </span>
                </div>
                <button
                  className="fu-card__remove"
                  onClick={() => removeFile(f.id)}
                  aria-label={`Remove ${f.name}`}
                  type="button"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9">
                    <path
                      d="M1 1l7 7M8 1L1 8"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="fu-footer">
            <span className="fu-footer__count">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </span>
            <div className="fu-footer__actions">
              <button className="fu-clear-btn" onClick={clearAll} type="button">
                Clear all
              </button>
              <button
                className="fu-upload-btn"
                onClick={handleUpload}
                disabled={loading || files.length === 0}
                type="button"
              >
                {loading ? "Evaluating…" : submitLabel}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

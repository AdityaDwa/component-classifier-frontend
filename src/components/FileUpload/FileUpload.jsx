import { useState, useRef } from "react";
import "./FileUpload.css";

const VALID_FILETYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/jpg",
];
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
  onFileSelect,
}) {
  // single file object instead of an array
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const inputRef = useRef(null);
  const dragCounter = useRef(0);

  function validateAndSet(incoming) {
    // always take only the first file even if multiple are dropped
    if (onFileSelect) onFileSelect();
    const picked = incoming[0];
    if (!picked) return;

    if (!VALID_FILETYPES.includes(picked.type)) {
      setFileError(
        `Filetype not supported. Please upload a JPEG, PNG, WebP or GIF.`,
      );
      setTimeout(() => setFileError(""), 4000);
      return;
    }
    if (picked.size > MAX_FILESIZE_MB * 1024 * 1024) {
      setFileError(`File exceeds ${MAX_FILESIZE_MB}MB size limit.`);
      setTimeout(() => setFileError(""), 4000);
      return;
    }

    // revoke previous preview URL to avoid memory leak
    if (file?.preview) URL.revokeObjectURL(file.preview);

    setFileError("");
    setFile({
      file: picked,
      name: picked.name,
      size: picked.size,
      preview: URL.createObjectURL(picked),
    });
  }

  function removeFile() {
    if (file?.preview) URL.revokeObjectURL(file.preview);
    setFile(null);
  }

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    setDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragging(false);
    if (e.dataTransfer.files.length) validateAndSet(e.dataTransfer.files);
  };

  const handleBrowse = () => inputRef.current?.click();
  const handleInputChange = (e) => {
    if (e.target.files.length) validateAndSet(e.target.files);
    e.target.value = "";
  };

  const handleUpload = () => {
    if (onUpload && file) onUpload([file.file]);
  };

  return (
    <div className="fu-page">
      <div className="fu-header">
        <h1>Upload a UI screenshot</h1>
        <p>
          Drag and drop or browse from your device. Images up to{" "}
          {MAX_FILESIZE_MB}MB.
        </p>
      </div>

      {/* Drop zone — shows preview when a file is selected */}
      <div
        className={`fu-dropzone ${dragging ? "fu-dropzone--active" : ""} ${file ? "fu-dropzone--has-file" : ""}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!file ? handleBrowse : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => !file && e.key === "Enter" && handleBrowse()}
        aria-label="File upload area"
        style={{ cursor: file ? "default" : "pointer" }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={VALID_FILETYPES.join(",")}
          onChange={handleInputChange}
          style={{ display: "none" }}
        />

        {file ? (
          /* ── preview state ── */
          <div className="fu-preview">
            <img
              className="fu-preview__img"
              src={file.preview}
              alt={file.name}
            />
            {/* overlay with file info and change/remove actions */}
            <div className="fu-preview__overlay">
              <div className="fu-preview__info">
                <span className="fu-preview__name">{file.name}</span>
                <span className="fu-preview__size">
                  {formatFileSize(file.size)}
                </span>
              </div>
              <div className="fu-preview__actions">
                <button
                  className="fu-preview__change"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrowse();
                  }}
                  type="button"
                >
                  Change
                </button>
                <button
                  className="fu-preview__remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile();
                  }}
                  type="button"
                  aria-label="Remove file"
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
            </div>
          </div>
        ) : (
          /* ── empty state ── */
          <>
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
              {dragging ? "Drop to upload" : "Drag your screenshot here"}
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
          </>
        )}
      </div>

      {/* validation error */}
      {fileError && (
        <div className="fu-errors">
          <p className="fu-error">{fileError}</p>
        </div>
      )}

      {/* backend/network error passed from App.jsx */}
      {error && (
        <div className="fu-errors">
          <p className="fu-error">{error}</p>
        </div>
      )}

      {/* footer — only shows when a file is selected */}
      {file && (
        <div className="fu-footer">
          <span className="fu-footer__count">1 file selected</span>
          <button
            className="fu-upload-btn"
            onClick={handleUpload}
            disabled={loading}
            type="button"
          >
            {loading ? "Evaluating…" : submitLabel}
          </button>
        </div>
      )}
    </div>
  );
}

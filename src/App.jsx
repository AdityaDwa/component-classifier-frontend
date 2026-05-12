//state of app after the logged in users tab addition (sidebar saved evaluations)
import { useState, useRef, useEffect } from "react";
import FileUpload from "./components/FileUpload/FileUpload";
import Results from "./components/Results/Results";
import AuthModal from "./components/Auth/AuthModal";
import Sidebar from "./components/Sidebar/Sidebar";
import SaveDialog from "./components/SaveDialog/SaveDialog";
import SavedEvaluations from "./components/SavedEvaluations/SavedEvaluations";
import "./App.css";

//Constant
const GUEST_TIMER_MS = 25 * 60 * 1000;

//Guest helpers
function getOrCreateGuestId() {
  let id = localStorage.getItem("guestId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("guestId", id);
  }
  return id;
}
function clearGuestId() {
  localStorage.removeItem("guestId");
}

//App
export default function App() {
  //Auth
  const [token, setToken] = useState(() => localStorage.getItem("accessToken"));
  const [tokenExpired, setTokenExpired] = useState(false);

  //Guest
  const [guestId, setGuestId] = useState(() => localStorage.getItem("guestId"));
  const [sessionExpired, setSessionExpired] = useState(false);
  const guestTimerRef = useRef(null);

  //Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [modalReason, setModalReason] = useState(null);

  // Sidebar
  // collapsed state persisted in localStorage so it remembers user preference
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem("sidebarCollapsed") === "true",
  );
  // which tab is active in the logged-in layout
  const [activeTab, setActiveTab] = useState("evaluate"); // "evaluate" | "saved"

  //App views
  // "upload" = FileUpload page
  // "results" = Results page
  const [view, setView] = useState("upload");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  //Save dialog
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  //Saved evaluations
  const [savedEvaluations, setSavedEvaluations] = useState([]);

  //login session expiry
  const [sessionExpiredDialog, setSessionExpiredDialog] = useState(false);

  const previousResultsRef = useRef(null);

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
    };
  }, []);

  async function authFetch(url, options = {}) {
    const res = await fetch(url, options);
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (
      res.status === 401 &&
      data.message === "Access token expired.Please login again"
    ) {
      previousResultsRef.current = results;
      setTokenExpired(true);
      setSessionExpiredDialog(true);

      return null;
    }
    return { res, data };
  }
  //Guest timer
  function startGuestTimer() {
    if (guestTimerRef.current) return;
    guestTimerRef.current = setTimeout(() => {
      setSessionExpired(true);
      setModalReason("timer");
      setShowAuthModal(true);
    }, GUEST_TIMER_MS);
  }

  function clearGuestTimer() {
    if (guestTimerRef.current) {
      clearTimeout(guestTimerRef.current);
      guestTimerRef.current = null;
    }
  }

  //Sidebar toggle
  function handleToggleCollapse() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  }

  //Auth handlers
  function handleLoginSuccess(accessToken) {
    localStorage.setItem("accessToken", accessToken);
    setToken(accessToken);
    clearGuestTimer();
    clearGuestId();
    setGuestId(null);
    setSessionExpired(false);
    setShowAuthModal(false);
    setModalReason(null);
    if (previousResultsRef.current) {
      setResults(previousResultsRef.current);
      setView("results");
      previousResultsRef.current = null;
    }
  }

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setToken(null);
    setResults(null);
    setView("upload");
    setError(null);
    setSavedEvaluations([]);
    setActiveTab("evaluate");
  }

  function handleModalDismiss() {
    setShowAuthModal(false);
    setModalReason(null);
  }

  //Evaluate
  async function handleEvaluate(files) {
    if (!token && sessionExpired) {
      setModalReason("timer");
      setShowAuthModal(true);
      return;
    }
    // logged in — pre-flight token check before attempting file upload
    // this catches expired tokens before the multipart request(file upload) is made
    if (token) {
      const check = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/v1/users/ping`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!check) return;
    }
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f));

      const headers = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      } else {
        const id = getOrCreateGuestId();
        setGuestId(id);
        headers["x-guest-id"] = id;
        startGuestTimer();
      }
      const result = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/v1/images/upload`,
        {
          method: "POST",
          body: formData,
          headers,
        },
      );
      if (!result) return;
      const { res, data } = result;
      console.log(res.status);
      if (!res.ok) throw new Error(data.message);
      console.log(data.data);
      setResults(data.data);
      setView("results");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setTimeout(() => setError(null), 4000);
    } finally {
      setLoading(false);
    }
  }

  //Save flow
  function handleSaveClick() {
    if (!token) {
      setModalReason("save");
      setShowAuthModal(true);
      return;
    }
    const alreadySaved = savedEvaluations.some(
      (evaluation) => evaluation._id === results._id,
    );

    if (alreadySaved) {
      setError("This evaluation has already been saved.");
      return;
    }
    // logged in user
    setShowSaveDialog(true);
  }
  async function handleSaveConfirm(name) {
    try {
      const result = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/v1/images/save/${results._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ savedName: name }),
        },
      );

      if (!result) return;
      const { res, data } = result;
      if (!res.ok) {
        throw new Error(data.message);
      }
      setSavedEvaluations((prev) => [data.data, ...prev]);
      setShowSaveDialog(false);
    } catch (err) {
      setError(err.message || "Something went wrong.Try again");
    }
  }

  //Open a saved evaluation
  function handleOpenSaved(evaluation) {
    // load the saved data into results and switch to results view
    setResults({
      imageUrl: evaluation.imageUrl,
      components: evaluation.components,
      clutter: evaluation.clutter,
      alignment: evaluation.alignment,
      contrast: evaluation.contrast,
      isSaved: true,
    });
    setView("results");
    setActiveTab("evaluate"); // switch sidebar highlight to evaluate
  }

  //Delete a saved evaluation
  async function handleDeleteSaved(id) {
    try {
      const result = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/v1/images/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (!result) return;
      const { res, data } = result;
      if (!res.ok) throw new Error(data.message);
      setSavedEvaluations((prev) =>
        prev.filter((evaluation) => evaluation._id !== id),
      );
    } catch (error) {
      setError(error.message);
    }
  }

  //Tab change
  async function handleTabChange(tab) {
    setActiveTab(tab);
    // when switching to evaluate reset to upload
    // if (tab === "evaluate") {
    //   setView("upload");
    //   setResults(null);
    // }
    if (tab === "saved") {
      const result = await authFetch(
        `${import.meta.env.VITE_API_URL}/api/v1/images/saved`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!result) return;
      const { res, data } = result;
      setSavedEvaluations(data.data || []);
    }
  }

  //Render

  // Guest / Logged out layout — no sidebar
  if (!token) {
    return (
      <>
        {/* top bar */}
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 20,
            zIndex: 100,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          {!token && guestId && (
            <span
              style={{
                fontSize: "0.8125rem",
                color: "#6b7280",
                background: "#f3f4f6",
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            >
              Guest session
            </span>
          )}
          <button
            onClick={() => {
              setModalReason(null);
              setShowAuthModal(true);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontFamily: "inherit",
              fontWeight: 500,
            }}
          >
            Sign in
          </button>
        </div>
        {view === "upload" && (
          <FileUpload
            onUpload={handleEvaluate}
            loading={loading}
            error={error}
            submitLabel="Evaluate"
            onFileSelect={() => setError(null)}
          />
        )}
        {view === "results" && results && (
          <Results
            data={results}
            onBack={() => {
              setView("upload");
              setResults(null);
            }}
            onSave={handleSaveClick}
            isGuest={true}
            sessionExpired={sessionExpired}
          />
        )}

        {showAuthModal && (
          <AuthModal
            reason={modalReason}
            onSuccess={handleLoginSuccess}
            onDismiss={modalReason === "expired" ? null : handleModalDismiss}
            dismissable={modalReason !== "expired"}
          />
        )}
      </>
    );
  }

  //Logged in layout — with sidebar
  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />
      <main className="app-main">
        {/* evaluate tab */}
        {activeTab === "evaluate" && view === "upload" && (
          <FileUpload
            onUpload={handleEvaluate}
            loading={loading}
            error={error}
            submitLabel="Evaluate"
            onFileSelect={() => setError(null)}
          />
        )}
        {activeTab === "evaluate" && view === "results" && results && (
          <Results
            data={results}
            onBack={() => {
              setView("upload");
              setResults(null);
            }}
            onSave={handleSaveClick}
            isGuest={false}
            sessionExpired={false}
            alreadySaved={savedEvaluations.some((e) => e._id === results?._id)}
          />
        )}

        {/* saved evaluations tab */}
        {activeTab === "saved" && (
          <SavedEvaluations
            evaluations={savedEvaluations}
            onOpen={handleOpenSaved}
            onDelete={handleDeleteSaved}
          />
        )}
      </main>
      {/* save name dialog */}
      {showSaveDialog && (
        <SaveDialog
          onSave={handleSaveConfirm}
          onCancel={() => setShowSaveDialog(false)}
        />
      )}
      {/*used when jwt token expires in logged in session*/}
      {sessionExpiredDialog && (
        <SessionExpiredDialog
          onSignIn={() => {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setToken(null);
            setTokenExpired(false);
            setSessionExpiredDialog(false);
            setModalReason("expired");
            setShowAuthModal(true);
            setView("upload");
          }}
        />
      )}
      {showAuthModal && (
        <AuthModal
          reason={modalReason}
          onSuccess={handleLoginSuccess}
          onDismiss={handleModalDismiss}
        />
      )}
    </div>
  );
}
function SessionExpiredDialog({ onSignIn }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000, // above everything including AuthModal
        padding: "1rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "2rem 1.75rem",
          maxWidth: "380px",
          width: "100%",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* icon */}
        <div style={{ marginBottom: "1rem" }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="19" stroke="#f59e0b" strokeWidth="1.5" />
            <path
              d="M20 12v9M20 27v2"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: 700,
            color: "#111",
            margin: "0 0 8px",
          }}
        >
          Session expired
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "#6b7280",
            margin: "0 0 1.5rem",
            lineHeight: 1.5,
          }}
        >
          Your login session has expired. Please sign in again to continue.
        </p>

        <button
          onClick={onSignIn}
          style={{
            width: "100%",
            height: "42px",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "0.9375rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Sign in again
        </button>
      </div>
    </div>
  );
}

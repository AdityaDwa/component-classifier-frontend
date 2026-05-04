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

//Mock backend response
const MOCK_RESPONSE = {
  imageUrl: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
  components: [
    { id: 1, label: "Navbar", x: 0.0, y: 0.0, width: 1.0, height: 0.08 },
    { id: 2, label: "Hero Button", x: 0.35, y: 0.42, width: 0.3, height: 0.09 },
    { id: 3, label: "Input Field", x: 0.1, y: 0.25, width: 0.5, height: 0.07 },
    { id: 4, label: "Card", x: 0.05, y: 0.55, width: 0.4, height: 0.3 },
    { id: 5, label: "Sidebar", x: 0.75, y: 0.1, width: 0.22, height: 0.85 },
  ],
  scores: { clutter: 72, alignment: 88, colorContrast: 65 },
};

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

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (guestTimerRef.current) clearTimeout(guestTimerRef.current);
    };
  }, []);

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
      const res = await fetch("/api/v1/images/upload", {
        method: "POST",
        body: formData,
        headers,
      });
      const data = await res.json();
      console.log(res.status);
      if (!res.ok) throw new Error(data.message);
      console.log(data.data);
      setResults(data.data);
      setView("results");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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
    // logged in user
    setShowSaveDialog(true);
  }
  async function handleSaveConfirm(name) {
    try {
      const res = await fetch(`/api/v1/images/save/${results._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ savedName: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }
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
      const res = await fetch(`/api/v1/images/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
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
    if (tab === "evaluate") {
      setView("upload");
      setResults(null);
    }
    if (tab === "saved") {
      const res = await fetch("/api/v1/images/saved", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSavedEvaluations(data.data);
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
            position: "fixed",
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
            onDismiss={handleModalDismiss}
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
    </div>
  );
}

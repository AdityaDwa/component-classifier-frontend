import "./Sidebar.css";

// icons as tiny inline components to keep things self-contained
function EvaluateIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect
        x="2"
        y="2"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M9 13V7M6 10l3-3 3 3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SavedIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect
        x="2"
        y="2"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
      <path
        d="M5 7h8M5 10h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M7 3H4a1 1 0 00-1 1v10a1 1 0 001 1h3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12 12l3-3-3-3M15 9H7"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// nav items config — keeps the JSX below clean
const NAV_ITEMS = [
  { id: "evaluate", label: "Evaluate", icon: <EvaluateIcon /> },
  { id: "saved", label: "Saved Results", icon: <SavedIcon /> },
];

export default function Sidebar({
  activeTab,
  onTabChange,
  onLogout,
  collapsed,
  onToggleCollapse,
}) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`}>
      {/* Logo + collapse toggle */}
      <div className="sidebar-top">
        {!collapsed && (
          <div className="sidebar-logo">
            {/* <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="7" fill="#6366f1"/>
              <path d="M8 14h12M14 8v12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/>
            </svg> */}
            <span className="sidebar-logo-name">UI Evaluator</span>
          </div>
        )}
        {/* collapse / expand toggle button */}
        <button
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 3l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activeTab === item.id ? "sidebar-nav-item--active" : ""}`}
            onClick={() => onTabChange(item.id)}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            {!collapsed && (
              <span className="sidebar-nav-label">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout at the bottom */}
      <div className="sidebar-bottom">
        <button
          className="sidebar-logout"
          onClick={onLogout}
          title={collapsed ? "Log out" : undefined}
          aria-label="Log out"
        >
          <span className="sidebar-nav-icon">
            <LogoutIcon />
          </span>
          {!collapsed && <span className="sidebar-nav-label">Log out</span>}
        </button>
      </div>
    </aside>
  );
}

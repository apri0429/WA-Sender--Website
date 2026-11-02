// Small shared controls so the Data and PDF pages look and behave like the dashboard.
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import "./PageTools.css";

export const OPEN_SETTINGS_EVENT = "sendline:open-settings";

export const openSettings = () => window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));

export function SearchBox({ value, onChange, placeholder = "Cari..." }) {
  return (
    <label className="pt-search">
      <SearchRoundedIcon style={{ fontSize: 16 }} />
      <input type="text" value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {value && (
        <button type="button" aria-label="Hapus pencarian" onClick={() => onChange("")}>
          <CloseRoundedIcon style={{ fontSize: 13 }} />
        </button>
      )}
    </label>
  );
}

export function ToolButton({ icon, children, onClick, disabled, loading, primary, title, tone }) {
  return (
    <button
      type="button"
      className={`pt-btn${primary ? " pt-btn--primary" : ""}${tone ? ` pt-btn--${tone}` : ""}`}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
    >
      {loading ? <span className="pt-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}

// Shown when the Google Sheet URL has not been set yet; points straight to Settings.
export function SetupNotice({ children }) {
  return (
    <div className="pt-notice">
      <span>{children}</span>
      <button type="button" className="pt-btn pt-btn--primary" onClick={openSettings}>
        Buka Settings
      </button>
    </div>
  );
}

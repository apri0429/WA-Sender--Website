import { useEffect, useRef, useState } from "react";
import { ChevronDown, Settings01, LogOut01, Users01 } from "@untitledui/icons";

import { openSettings } from "../../components/PageTools";

const USER = {
  name: "AP PIAGAM",
  role: "Account Receivable",
  company: "PT Pilar Niaga Makmur",
};

export default function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="pm" ref={ref}>
      <button
        type="button"
        className={`pm__trigger${open ? " open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="pm__avatar" aria-hidden="true"><Users01 size={20} /></span>
        <span className="pm__meta">
          <strong>{USER.name}</strong>
          <small>{USER.company} - {USER.role}</small>
        </span>
        <ChevronDown size={14} aria-hidden="true" className="pm__chevron" />
      </button>

      {open ? (
        <div className="pm__panel" role="menu">
          <div className="pm__card">
            <span className="pm__avatar pm__avatar--lg" aria-hidden="true"><Users01 size={22} /></span>
            <div className="pm__who">
              <strong>{USER.name}</strong>
              <span>{USER.role}</span>
            </div>
          </div>

          <dl className="pm__info">
            <dt>Role</dt>
            <dd>{USER.role}</dd>
            <dt>Perusahaan</dt>
            <dd>{USER.company}</dd>
          </dl>

          <div className="pm__list">
            <button
              type="button"
              role="menuitem"
              className="pm__item"
              onClick={() => { setOpen(false); openSettings(); }}
            >
              <Settings01 size={16} aria-hidden="true" />
              Pengaturan
            </button>
            <a role="menuitem" className="pm__item" href="https://pilargroup.id" target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
              <LogOut01 size={16} aria-hidden="true" />
              Kembali ke Pilargroup
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { IconLogout, IconSettings } from "@/components/ui/icons";

function initials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-spectrum-citation text-sm font-semibold text-white transition-transform hover:scale-105"
        aria-label="Account menu"
      >
        {initials(user?.full_name, user?.email)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-60 overflow-hidden rounded-control border bg-bg-elevated p-1.5 shadow-pop animate-fade-up"
        >
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-text">{user?.full_name || "Account"}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <div className="my-1 border-t" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/settings");
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-text transition-colors hover:bg-surface-2"
          >
            <IconSettings className="h-4 w-4 text-muted" />
            Settings
          </button>
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
              navigate("/login");
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-poor transition-colors hover:bg-poor/10"
          >
            <IconLogout className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

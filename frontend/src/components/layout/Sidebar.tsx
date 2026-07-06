import { NavLink } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Primary">
        <p className="eyebrow px-3 pb-2 pt-3">Workspace</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-surface-2 text-text" : "text-muted hover:bg-surface-2/50 hover:text-text",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand transition-opacity",
                    isActive ? "opacity-100" : "opacity-0",
                  )}
                  aria-hidden
                />
                <span className={cn("[&>svg]:h-[1.15rem] [&>svg]:w-[1.15rem]", isActive && "text-brand")}>
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 rounded-control border bg-surface-2/40 p-3.5">
        <p className="eyebrow">Signal status</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-good" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
          </span>
          <p className="text-xs text-muted">Monitoring active</p>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r bg-bg-elevated/60 lg:block">
      <div className="sticky top-0 h-dvh">
        <SidebarContent />
      </div>
    </aside>
  );
}

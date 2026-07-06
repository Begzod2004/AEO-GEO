import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrg } from "@/context/OrgContext";
import { cn } from "@/lib/cn";
import { IconBuilding, IconCheck, IconChevronDown, IconPlus } from "@/components/ui/icons";

export function OrgSwitcher() {
  const { orgs, currentOrg, selectOrg } = useOrg();
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
        className="flex max-w-[15rem] items-center gap-2.5 rounded-control border bg-surface-2/50 px-2.5 py-1.5 text-left transition-colors hover:bg-surface-2"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-brand/15 text-brand">
          <IconBuilding className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-text">
            {currentOrg?.name ?? "Select org"}
          </span>
          {currentOrg?.industry && (
            <span className="block truncate text-[0.7rem] text-muted">{currentOrg.industry}</span>
          )}
        </span>
        <IconChevronDown className={cn("h-4 w-4 shrink-0 text-faint transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-72 overflow-hidden rounded-control border bg-bg-elevated p-1.5 shadow-pop animate-fade-up"
        >
          <p className="px-2.5 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-faint">
            Organizations
          </p>
          <ul className="max-h-64 space-y-0.5 overflow-auto">
            {orgs.map((o) => {
              const active = currentOrg?.id === o.id;
              return (
                <li key={o.id}>
                  <button
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      selectOrg(o.id);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-surface-2"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-2 text-muted">
                      <IconBuilding className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-text">{o.name}</span>
                      {o.plan && <span className="block text-[0.7rem] capitalize text-muted">{o.plan} plan</span>}
                    </span>
                    {active && <IconCheck className="h-4 w-4 text-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="my-1.5 border-t" />
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              navigate("/onboarding");
            }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm text-brand transition-colors hover:bg-brand/10"
          >
            <IconPlus className="h-4 w-4" />
            Create or manage organizations
          </button>
        </div>
      )}
    </div>
  );
}

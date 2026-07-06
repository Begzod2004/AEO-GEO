import type { ReactNode } from "react";
import {
  IconDashboard,
  IconDocs,
  IconGlobe,
  IconSchema,
  IconSettings,
} from "@/components/ui/icons";

export interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: <IconDashboard />, end: true },
  { to: "/documents", label: "Documents", icon: <IconDocs /> },
  { to: "/website", label: "Website", icon: <IconGlobe /> },
  { to: "/schema", label: "Schema", icon: <IconSchema /> },
  { to: "/settings", label: "Settings", icon: <IconSettings /> },
];

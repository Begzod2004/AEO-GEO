import { useTheme } from "@/context/ThemeContext";
import { IconMoon, IconSun } from "@/components/ui/icons";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      className="grid h-9 w-9 place-items-center rounded-control border text-muted transition-colors hover:bg-surface-2 hover:text-text"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
    </button>
  );
}

import { useNavigate } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <p className="font-display text-6xl font-bold text-text">404</p>
        <p className="mt-2 text-sm text-muted">This page is off the spectrum.</p>
        <div className="mt-6">
          <Button onClick={() => navigate("/")}>Back to dashboard</Button>
        </div>
      </div>
    </div>
  );
}

import { Badge } from "./Badge";
import { Spinner } from "./Spinner";

type Status = "pending" | "processing" | "done" | "failed" | string;

const MAP: Record<string, { tone: "neutral" | "brand" | "good" | "poor"; label: string; busy?: boolean }> = {
  pending: { tone: "neutral", label: "Queued", busy: true },
  processing: { tone: "brand", label: "Processing", busy: true },
  done: { tone: "good", label: "Ready" },
  failed: { tone: "poor", label: "Failed" },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = MAP[status] ?? { tone: "neutral" as const, label: status };
  return (
    <Badge tone={cfg.tone} dot={!cfg.busy}>
      {cfg.busy && <Spinner className="h-3 w-3" />}
      {cfg.label}
    </Badge>
  );
}

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { IconChat, IconScan, IconDocs } from "@/components/ui/icons";
import { useCountUp } from "@/hooks/useCountUp";
import type { DashboardSummary } from "@/types/api";

function SummaryItem({ icon, label, value }: { icon: ReactNode; label: string; value: number }) {
  const animated = useCountUp(value, 700);
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-control border bg-surface-2/60 text-muted [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>
      <div>
        <p className="font-display text-xl font-semibold tabular-nums text-text">{animated}</p>
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Card>
  );
}

export function SummaryStrip({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <SummaryItem icon={<IconChat />} label="Prompts tracked" value={summary.prompts} />
      <SummaryItem icon={<IconScan />} label="Scan results" value={summary.scan_results} />
      <SummaryItem icon={<IconDocs />} label="Knowledge documents" value={summary.documents} />
    </div>
  );
}

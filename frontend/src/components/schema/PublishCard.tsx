import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/context/ToastContext";
import { useApiData } from "@/hooks/useApiData";
import { schemaApi } from "@/lib/api";
import { apiError } from "@/lib/http";

const BACKEND_ORIGIN = "http://localhost:8000"; // dev; prod serves same-origin

const AI_ROBOTS_SNIPPET = `# Allow AI answer-engine crawlers (robots.txt)
User-agent: GPTBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Google-Extended
Allow: /`;

/** The delivery half of AEO: get the generated artifacts to where AI actually
 *  reads — llms.txt, a public crawlable profile, embeddable JSON-LD, robots. */
export function PublishCard({
  orgId,
  jsonLdSnippet,
}: {
  orgId: string | number;
  jsonLdSnippet: string | null;
}) {
  const toast = useToast();
  const { data, loading, refetch } = useApiData(
    () => schemaApi.llmsTxt(orgId),
    [orgId],
  );
  const [busy, setBusy] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  async function copy(text: string, what: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied", `${what} is on your clipboard.`);
  }

  async function togglePublish() {
    if (!data) return;
    setBusy(true);
    try {
      await schemaApi.setPublicProfile(orgId, !data.public_profile);
      toast.success(
        data.public_profile ? "Profile unpublished" : "Profile published",
        data.public_profile
          ? "The public page now returns 404."
          : "AI crawlers can now read your profile page and llms.txt.",
      );
      await refetch(false);
    } catch (err) {
      toast.error("Couldn't update", apiError(err));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Skeleton className="h-40 rounded-card" />;
  if (!data) return null;

  const publicUrl = `${BACKEND_ORIGIN}${data.public_url}`;

  return (
    <Card className="p-5 sm:p-6">
      <div>
        <h2 className="font-display text-base font-semibold text-text">Deliver to AI</h2>
        <p className="mt-1 text-sm text-muted">
          Generation alone isn't visibility — these put your structured content
          where answer engines actually read.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {/* public profile */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-line/60 p-4">
          <div>
            <p className="flex items-center gap-2 font-medium text-text">
              Public AI-readable profile
              {data.public_profile ? (
                <Badge tone="good" dot>live</Badge>
              ) : (
                <Badge tone="neutral">off</Badge>
              )}
            </p>
            <p className="mt-1 text-sm text-muted">
              A crawlable page with your JSON-LD, FAQ and llms.txt —{" "}
              {data.public_profile ? (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand hover:underline"
                >
                  {data.public_url}
                </a>
              ) : (
                <span className="font-mono text-xs">{data.public_url}</span>
              )}
            </p>
          </div>
          <Button size="sm" loading={busy} onClick={togglePublish}>
            {data.public_profile ? "Unpublish" : "Publish"}
          </Button>
        </div>

        {/* llms.txt */}
        <div className="rounded-control border border-line/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-text">llms.txt</p>
              <p className="mt-1 text-sm text-muted">
                The emerging standard AI crawlers read first — generated from your
                real content. Host it at <span className="font-mono text-xs">yoursite.com/llms.txt</span>.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowPreview((v) => !v)}>
                {showPreview ? "Hide" : "Preview"}
              </Button>
              <Button size="sm" onClick={() => copy(data.content, "llms.txt")}>
                Copy
              </Button>
            </div>
          </div>
          {showPreview && (
            <pre className="mt-3 max-h-64 overflow-auto rounded-control bg-surface-2/60 p-3 font-mono text-xs leading-relaxed text-muted">
              {data.content}
            </pre>
          )}
        </div>

        {/* embeddable JSON-LD + robots */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-control border border-line/60 p-4">
            <p className="font-medium text-text">JSON-LD snippet</p>
            <p className="mt-1 text-sm text-muted">
              Paste into your site's <span className="font-mono text-xs">&lt;head&gt;</span>.
            </p>
            <Button
              size="sm"
              className="mt-3"
              disabled={!jsonLdSnippet}
              onClick={() => jsonLdSnippet && copy(jsonLdSnippet, "JSON-LD snippet")}
            >
              {jsonLdSnippet ? "Copy snippet" : "Generate schema first"}
            </Button>
          </div>
          <div className="rounded-control border border-line/60 p-4">
            <p className="font-medium text-text">Let AI crawlers in</p>
            <p className="mt-1 text-sm text-muted">
              robots.txt rules for GPTBot, ClaudeBot, PerplexityBot…
            </p>
            <Button
              size="sm"
              className="mt-3"
              onClick={() => copy(AI_ROBOTS_SNIPPET, "robots.txt rules")}
            >
              Copy rules
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

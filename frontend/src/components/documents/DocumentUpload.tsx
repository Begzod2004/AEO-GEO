import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Segmented } from "@/components/ui/Segmented";
import { IconGlobe, IconLink, IconText, IconUpload } from "@/components/ui/icons";
import { useToast } from "@/context/ToastContext";
import { kbApi } from "@/lib/api";
import { apiError } from "@/lib/http";
import { cn } from "@/lib/cn";
import type { KbDocument } from "@/types/api";

type Mode = "text" | "website" | "file";
const ACCEPT = ".pdf,.docx,.txt";
const MAX_MB = 20;

export function DocumentUpload({
  orgId,
  onUploaded,
}: {
  orgId: string | number;
  onUploaded: (doc: KbDocument) => void;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<Mode>("text");
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [rawText, setRawText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  function reset() {
    setTitle("");
    setRawText("");
    setUrl("");
    setFile(null);
  }

  function pickFile(f: File | null) {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error("File too large", `Keep uploads under ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let doc: KbDocument;
      if (mode === "text") {
        if (!rawText.trim()) throw new Error("Paste some text to import.");
        doc = await kbApi.createText(orgId, {
          title: title.trim() || "Pasted text",
          raw_text: rawText,
        });
      } else if (mode === "website") {
        if (!url.trim()) throw new Error("Enter a website URL.");
        doc = await kbApi.createWebsite(orgId, {
          title: title.trim() || url.trim(),
          source_url: url.trim(),
        });
      } else {
        if (!file) throw new Error("Choose a file to upload.");
        doc = await kbApi.createFile(orgId, title.trim() || file.name, file);
      }
      onUploaded(doc);
      toast.success("Import started", "We're extracting and embedding your document.");
      reset();
    } catch (err) {
      const msg = err instanceof Error && !("response" in err) ? err.message : apiError(err);
      toast.error("Couldn't import document", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader eyebrow="Knowledge base" title="Add a document">
        <p className="mt-1 text-sm text-muted">
          Feed the engines your source material. We chunk and embed it for retrieval.
        </p>
      </CardHeader>

      <div className="mt-5">
        <Segmented<Mode>
          ariaLabel="Document source"
          value={mode}
          onChange={setMode}
          segments={[
            { value: "text", label: (<><IconText className="h-4 w-4" /> Paste text</>) },
            { value: "website", label: (<><IconLink className="h-4 w-4" /> Website</>) },
            { value: "file", label: (<><IconUpload className="h-4 w-4" /> Upload file</>) },
          ]}
        />
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Input
          label="Title"
          placeholder={mode === "website" ? "Optional — defaults to the URL" : "Give it a name"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {mode === "text" && (
          <Textarea
            label="Text"
            required
            placeholder="Paste product docs, FAQs, positioning — anything you want the engines to know."
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="min-h-[9rem]"
          />
        )}

        {mode === "website" && (
          <Input
            label="Website URL"
            type="url"
            required
            placeholder="https://yourbrand.com/about"
            iconLeft={<IconGlobe />}
            hint="We fetch the page and import its readable content."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        )}

        {mode === "file" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-control border border-dashed px-6 py-8 text-center transition-colors",
              dragOver ? "border-brand/60 bg-brand/5" : "hover:bg-surface-2/40",
            )}
          >
            <IconUpload className="h-6 w-6 text-muted" />
            {file ? (
              <p className="text-sm text-text">
                <span className="font-medium">{file.name}</span>{" "}
                <span className="text-muted">({(file.size / 1024).toFixed(0)} KB)</span>
              </p>
            ) : (
              <p className="text-sm text-muted">Drag a file here, or</p>
            )}
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <Button type="button" variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
              {file ? "Choose a different file" : "Browse files"}
            </Button>
            <p className="font-mono text-[0.7rem] text-faint">PDF, DOCX or TXT · up to {MAX_MB} MB</p>
          </div>
        )}

        <Button type="submit" loading={busy}>
          Import document
        </Button>
      </form>
    </Card>
  );
}

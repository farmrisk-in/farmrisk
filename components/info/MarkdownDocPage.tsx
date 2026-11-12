import fs from "node:fs";
import path from "node:path";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InfoPage } from "@/components/info/InfoPage";

// Renders a policy document from content/<file>.md (the same files linked from
// Google Play and the mobile app). The markdown's "# Title" and
// "**Last updated:** ..." lines are shown by InfoPage instead.
function loadDoc(file: string) {
  const raw = fs.readFileSync(path.join(process.cwd(), "content", file), "utf8");
  const body = raw.replace(/^---[\s\S]*?---\s*/, ""); // front matter
  const updated = body.match(/\*\*Last updated:\*\*\s*(.+)/)?.[1]?.trim();
  const content = body
    .replace(/^#\s+.*$/m, "")
    .replace(/^\*\*Last updated:\*\*.*$/m, "")
    .trim();
  return { updated, content };
}

export function MarkdownDocPage({ title, file }: { title: string; file: string }) {
  const { updated, content } = loadDoc(file);
  return (
    <InfoPage title={title} updated={updated}>
      <div className="space-y-4 [&_h3]:mt-6 [&_h3]:font-semibold [&_hr]:my-8 [&_ol]:space-y-1 [&_ol>li]:ml-5 [&_ol>li]:list-decimal [&_th]:border-b [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_td]:border-b [&_td]:border-border/60 [&_td]:px-3 [&_td]:py-1.5 [&_p>code:only-child]:block [&_p>code:only-child]:overflow-x-auto [&_p>code:only-child]:rounded-lg [&_p>code:only-child]:bg-muted [&_p>code:only-child]:px-4 [&_p>code:only-child]:py-3 [&_p>code:only-child]:text-center [&_p>code:only-child]:font-mono [&_p>code:only-child]:text-sm">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            // Wide tables scroll inside their own box on phones.
            table: (props) => (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" {...props} />
              </div>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </InfoPage>
  );
}

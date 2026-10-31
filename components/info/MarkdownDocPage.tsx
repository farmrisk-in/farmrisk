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
      <div className="space-y-4 [&_h3]:mt-6 [&_h3]:font-semibold [&_hr]:my-8 [&_ol]:space-y-1 [&_ol>li]:ml-5 [&_ol>li]:list-decimal">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </InfoPage>
  );
}

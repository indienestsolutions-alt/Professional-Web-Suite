import { Link } from "wouter";
import {
  useGetLearningTopic,
  getGetLearningTopicQueryKey,
} from "@workspace/api-client-react";
import { PageContainer } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, ArrowRight, Mic } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import type { ReactNode } from "react";

export default function LearningTopicPage({ slug }: { slug: string }) {
  const q = useGetLearningTopic(slug, {
    query: { enabled: !!slug, queryKey: getGetLearningTopicQueryKey(slug) },
  });
  const [, setLocation] = useLocation();

  if (q.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-5 w-24 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-3" />
        <Skeleton className="h-6 w-2/3 mb-10" />
        <div className="space-y-3 max-w-2xl">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className={`h-4 ${i % 3 === 2 ? "w-3/4" : "w-full"}`} />
          ))}
        </div>
      </PageContainer>
    );
  }

  const topic = q.data;
  if (!topic) {
    return (
      <PageContainer>
        <p className="text-muted-foreground">Topic not found.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link href="/learning">
        <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to library
        </a>
      </Link>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
            {topic.category}
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            <Clock className="h-3 w-3 mr-1" />
            {topic.readMinutes} min read
          </Badge>
        </div>

        <h1 className="mt-4 font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight pm-text-balance leading-[1.08]">
          {topic.title}
        </h1>

        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl pm-text-balance leading-relaxed">
          {topic.summary}
        </p>
      </motion.div>

      <div className="mt-1 border-b border-border" />

      <article className="mt-10 max-w-2xl space-y-0">
        <MarkdownArticle body={topic.body} />
      </article>

      <div className="mt-12 border-t border-border pt-8 max-w-2xl">
        <div className="rounded-2xl bg-secondary text-secondary-foreground p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-semibold">Put it into practice</p>
            <p className="text-sm text-secondary-foreground/70 mt-1">
              Reading is step one. The real test is defending it under pressure.
            </p>
          </div>
          <Button onClick={() => setLocation("/train/new")}>
            <Mic className="h-3.5 w-3.5 mr-1.5" />
            Start a session
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        <Link href="/learning">
          <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back to library
          </a>
        </Link>
      </div>
    </PageContainer>
  );
}

function MarkdownArticle({ body }: { body: string }) {
  const blocks = parseMarkdown(body);
  return (
    <>
      {blocks.map((block, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.025, duration: 0.3 }}
        >
          <RenderBlock block={block} />
        </motion.div>
      ))}
    </>
  );
}

type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "bullet-list"; items: string[] }
  | { type: "numbered-list"; items: string[] }
  | { type: "paragraph"; text: string }
  | { type: "divider" };

function parseMarkdown(raw: string): Block[] {
  const lines = raw.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const trimmed = line.trim();

    if (trimmed === "" || trimmed === "---" || trimmed === "***") {
      if (trimmed === "---") blocks.push({ type: "divider" });
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h2", text: trimmed.slice(3).trim() });
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "h3", text: trimmed.slice(4).trim() });
      i++;
      continue;
    }

    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h2", text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    if (trimmed.startsWith("> ")) {
      blocks.push({ type: "blockquote", text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i]!.trim().startsWith("- ") || lines[i]!.trim().startsWith("* "))
      ) {
        items.push(lines[i]!.trim().slice(2).trim());
        i++;
      }
      blocks.push({ type: "bullet-list", items });
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i]!.trim())) {
        items.push(lines[i]!.trim().replace(/^\d+\.\s/, "").trim());
        i++;
      }
      blocks.push({ type: "numbered-list", items });
      continue;
    }

    // Paragraph — accumulate consecutive non-blank, non-special lines
    const textLines: string[] = [];
    while (
      i < lines.length &&
      lines[i]!.trim() !== "" &&
      !lines[i]!.trim().startsWith("#") &&
      !lines[i]!.trim().startsWith("> ") &&
      !lines[i]!.trim().startsWith("- ") &&
      !lines[i]!.trim().startsWith("* ") &&
      !/^\d+\.\s/.test(lines[i]!.trim()) &&
      lines[i]!.trim() !== "---"
    ) {
      textLines.push(lines[i]!.trim());
      i++;
    }
    if (textLines.length > 0) {
      blocks.push({ type: "paragraph", text: textLines.join(" ") });
    }
  }

  return blocks;
}

function RenderBlock({ block }: { block: Block }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 className="mt-10 mb-3 font-display text-2xl font-semibold tracking-tight text-foreground">
          {block.text}
        </h2>
      );
    case "h3":
      return (
        <h3 className="mt-7 mb-2 font-display text-lg font-semibold text-foreground">
          {block.text}
        </h3>
      );
    case "divider":
      return <div className="my-8 border-t border-border" />;
    case "blockquote":
      return (
        <blockquote className="my-5 border-l-[3px] border-primary pl-4 py-1">
          <p className="text-foreground text-base leading-relaxed italic">
            <InlineMarkdown text={block.text} />
          </p>
        </blockquote>
      );
    case "bullet-list":
      return (
        <ul className="my-4 space-y-2 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-base text-foreground leading-relaxed">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span><InlineMarkdown text={item} /></span>
            </li>
          ))}
        </ul>
      );
    case "numbered-list":
      return (
        <ol className="my-4 space-y-2.5 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-base text-foreground leading-relaxed">
              <span className="font-mono text-primary text-sm font-semibold shrink-0 w-5 mt-0.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span><InlineMarkdown text={item} /></span>
            </li>
          ))}
        </ol>
      );
    case "paragraph":
      return (
        <p className="my-4 text-base text-foreground leading-relaxed">
          <InlineMarkdown text={block.text} />
        </p>
      );
    default:
      return null;
  }
}

function InlineMarkdown({ text }: { text: string }): ReactNode {
  // Handle **bold** and *italic*
  const parts: ReactNode[] = [];
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[0].startsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold text-foreground">{match[2]}</strong>);
    } else if (match[0].startsWith("`")) {
      parts.push(<code key={match.index} className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded text-primary">{match[4]}</code>);
    } else {
      parts.push(<em key={match.index} className="italic">{match[3]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

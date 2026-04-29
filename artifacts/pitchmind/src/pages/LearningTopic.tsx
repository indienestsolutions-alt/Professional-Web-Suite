import { Link } from "wouter";
import {
  useGetLearningTopic,
  getGetLearningTopicQueryKey,
} from "@workspace/api-client-react";
import { PageContainer } from "@/components/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function LearningTopicPage({ slug }: { slug: string }) {
  const q = useGetLearningTopic(slug, {
    query: { enabled: !!slug, queryKey: getGetLearningTopicQueryKey(slug) },
  });

  if (q.isLoading) {
    return (
      <PageContainer>
        <Skeleton className="h-8 w-1/2 mb-3" />
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </PageContainer>
    );
  }

  const topic = q.data;
  if (!topic) {
    return (
      <PageContainer>
        <p>Topic not found.</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Link href="/learning">
        <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Library
        </a>
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-primary">
          {topic.category}
          <Badge variant="outline" className="font-mono text-[10px]">
            <Clock className="h-3 w-3 mr-1" />
            {topic.readMinutes} min read
          </Badge>
        </div>
        <h1 className="mt-3 font-display text-4xl md:text-5xl font-semibold tracking-tight pm-text-balance leading-[1.1]">
          {topic.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          {topic.summary}
        </p>
      </motion.div>

      <article className="mt-10 max-w-2xl prose prose-neutral dark:prose-invert">
        {topic.body.split(/\n\n+/).map((para, i) => (
          <p
            key={i}
            className="text-base leading-relaxed text-foreground mb-5 whitespace-pre-wrap"
          >
            {para}
          </p>
        ))}
      </article>
    </PageContainer>
  );
}

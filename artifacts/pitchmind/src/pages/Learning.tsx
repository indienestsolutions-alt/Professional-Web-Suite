import { useMemo } from "react";
import { Link } from "wouter";
import {
  useListLearningTopics,
  getListLearningTopicsQueryKey,
} from "@workspace/api-client-react";
import { PageContainer, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Clock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LearningPage() {
  const topics = useListLearningTopics({
    query: { queryKey: getListLearningTopicsQueryKey() },
  });

  const grouped = useMemo(() => {
    const m = new Map<string, typeof topics.data extends undefined ? never : NonNullable<typeof topics.data>>();
    for (const t of topics.data ?? []) {
      const list = m.get(t.category) ?? [];
      list.push(t);
      m.set(t.category, list);
    }
    return [...m.entries()];
  }, [topics.data]);

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <>
            <GraduationCap className="h-3.5 w-3.5" /> Founder library
          </>
        }
        title="Learn"
        description="Short, sharp lessons from the parts of being a founder nobody teaches you."
      />

      {topics.isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(([category, items]) => (
            <div key={category}>
              <div className="font-mono text-xs uppercase tracking-[0.2em] text-primary mb-4">
                {category}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <Link href={`/learning/${t.slug}`}>
                      <a className="block h-full">
                        <Card className="group h-full hover:border-foreground/20 transition-colors">
                          <CardContent className="p-5 flex flex-col h-full">
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px] self-start"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {t.readMinutes} min read
                            </Badge>
                            <h3 className="mt-3 font-display text-lg font-semibold leading-tight">
                              {t.title}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground line-clamp-3 flex-1">
                              {t.summary}
                            </p>
                            <div className="mt-4 inline-flex items-center text-sm text-primary font-medium">
                              Read
                              <ArrowRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}

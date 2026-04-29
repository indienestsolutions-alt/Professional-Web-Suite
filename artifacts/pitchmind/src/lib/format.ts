export function formatRelative(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatScore(n: number | null | undefined): string {
  if (n == null) return "—";
  return Math.round(n).toString();
}

export function initials(first?: string | null, last?: string | null): string {
  const f = (first ?? "").trim()[0] ?? "";
  const l = (last ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "F";
}

export function ideaStatusLabel(status: string): string {
  if (status === "draft") return "Draft";
  if (status === "structured") return "Structured";
  if (status === "deck_generated") return "Deck ready";
  return status;
}

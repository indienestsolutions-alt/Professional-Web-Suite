import { type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import {
  LayoutDashboard,
  Lightbulb,
  Mic,
  GraduationCap,
  Settings,
  LogOut,
} from "lucide-react";
import { Wordmark } from "./Logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/format";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  match: (path: string) => boolean;
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/ideas",
    label: "Ideas",
    icon: Lightbulb,
    match: (p) => p === "/ideas" || p.startsWith("/ideas/"),
  },
  {
    href: "/train",
    label: "Arena",
    icon: Mic,
    match: (p) => p === "/train" || p.startsWith("/train/"),
  },
  {
    href: "/learning",
    label: "Learn",
    icon: GraduationCap,
    match: (p) => p === "/learning" || p.startsWith("/learning/"),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();

  const firstName = user?.firstName ?? null;
  const lastName = user?.lastName ?? null;
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const imageUrl = user?.imageUrl ?? undefined;

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 py-6">
          <Link href="/dashboard">
            <a className="inline-flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-foreground text-sidebar">
                <svg viewBox="0 0 32 32" fill="none" width="18" height="18">
                  <path
                    d="M6 24 L6 8 L14 8 C18.4183 8 22 11.5817 22 16 L22 16 C22 18.0 20.5 19.5 18.5 19.5 L13 19.5 L13 24"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="24" cy="9" r="3" fill="hsl(16 95% 60%)" />
                </svg>
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                PitchMind<span className="text-primary">.</span>
              </span>
            </a>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {NAV.map((item) => {
            const active = item.match(location);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-sidebar-border">
          <Link href="/settings">
            <a
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                location === "/settings"
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </a>
          </Link>
        </div>

        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors text-left">
                <Avatar className="h-9 w-9 ring-2 ring-sidebar-border">
                  <AvatarImage src={imageUrl} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {initials(firstName, lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {firstName ?? "Founder"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {email ?? "Signed in"}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
          <Wordmark />
          <Button variant="ghost" size="icon" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 mb-6 md:mb-8">
      <div className="space-y-2 max-w-3xl">
        {eyebrow && (
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground font-mono">
            {eyebrow}
          </div>
        )}
        <h1 className="text-2xl md:text-4xl font-semibold tracking-tight pm-text-balance">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground text-sm md:text-lg pm-text-balance">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="px-3 md:px-8 lg:px-12 py-6 md:py-10 max-w-7xl mx-auto w-full overflow-x-hidden">
      {children}
    </div>
  );
}

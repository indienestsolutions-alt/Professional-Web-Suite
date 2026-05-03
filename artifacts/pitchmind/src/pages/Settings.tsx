import { useAuth } from "@workspace/replit-auth-web";
import { PageContainer, PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { initials } from "@/lib/format";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  return (
    <PageContainer>
      <PageHeader
        eyebrow={
          <>
            <SettingsIcon className="h-3.5 w-3.5" /> Account
          </>
        }
        title="Settings"
        description="Your account and session preferences."
      />

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.profileImageUrl ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {initials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-display text-xl font-semibold">
                  {user?.firstName ?? ""} {user?.lastName ?? ""}
                </div>
                <div className="text-sm text-muted-foreground">
                  {user?.email ?? "No email on file"}
                </div>
              </div>
            </div>
            <div className="mt-6 grid sm:grid-cols-2 gap-4">
              <Field label="First name" value={user?.firstName ?? "—"} />
              <Field label="Last name" value={user?.lastName ?? "—"} />
              <Field label="Email" value={user?.email ?? "—"} />
              <Field label="User ID" value={user?.id ?? "—"} mono />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-4 w-4" />
              <span className="font-mono text-xs uppercase tracking-widest">
                Session
              </span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold">
              You're signed in.
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Logging out clears your session in this browser. Your ideas and
              sessions stay safe.
            </p>
            <Button
              variant="outline"
              className="mt-5 w-full"
              onClick={() => logout()}
              data-testid="logout-button"
            >
              <LogOut className="h-4 w-4 mr-2" /> Log out
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 ${mono ? "font-mono text-sm" : "text-sm"} text-foreground truncate`}
      >
        {value}
      </div>
    </div>
  );
}

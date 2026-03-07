import { doctorProfile } from "@/lib/data/doctor";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AppBreadcrumb } from "./app-breadcrumb";
import { MobileSidebar } from "./mobile-sidebar";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <MobileSidebar />

            <div className="min-w-0 space-y-2">
              <AppBreadcrumb />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-3 rounded-2xl border bg-card px-3 py-2 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold">{doctorProfile.name}</p>
              <p className="text-xs text-muted-foreground">
                {doctorProfile.specialty}
              </p>
            </div>

            <Avatar className="h-10 w-10">
              <AvatarFallback>JU</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  );
}

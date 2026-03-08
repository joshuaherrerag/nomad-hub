import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Briefcase, Gift, Users, ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const adminNav = [
  { icon: LayoutDashboard, label: "Resumen", to: "/admin" },
  { icon: Briefcase, label: "Empleos", to: "/admin/empleos" },
  { icon: Gift, label: "Beneficios", to: "/admin/beneficios" },
  { icon: Users, label: "Usuarios", to: "/admin/usuarios" },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const { profile } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  const isActive = (to: string) =>
    to === "/admin" ? pathname === "/admin" : pathname.startsWith(to);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-60 flex-col border-r border-border bg-card md:flex">
        <div className="px-5 py-5">
          <div className="flex items-center gap-2">
            <Badge className="border-0 bg-primary font-accent text-[10px] font-bold uppercase text-primary-foreground">
              Admin
            </Badge>
            <span className="text-sm font-medium text-muted-foreground">Panel de control</span>
          </div>
        </div>

        <div className="mx-4 border-t border-border" />

        <nav className="flex-1 space-y-1 px-3 pt-4" aria-label="Navegación admin">
          {adminNav.map(({ icon: Icon, label, to }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex min-h-[44px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive(to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <Link
            to="/dashboard"
            className="flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver a la app
          </Link>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <div className="flex items-center gap-2">
          <span className="font-display text-lg font-bold text-foreground">Nestify</span>
          <Badge className="border-0 bg-primary font-accent text-[10px] font-bold uppercase text-primary-foreground">
            Admin
          </Badge>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegación admin móvil"
      >
        {adminNav.map(({ icon: Icon, label, to }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-1 min-h-[56px] text-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-sm",
              isActive(to) ? "text-primary" : "text-muted-foreground"
            )}
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Content */}
      <main className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))] pt-14 md:ml-60 md:pb-8 md:pt-0">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

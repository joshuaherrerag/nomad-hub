import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Briefcase, Gift, User, MessageCircle, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" },
  { icon: Briefcase, label: "Empleos", to: "/empleos" },
  { icon: Gift, label: "Beneficios", to: "/beneficios" },
];

const DISCORD_LINK = "https://discord.gg/nestify";

export default function AppLayout() {
  const { pathname } = useLocation();
  const { profile, signOut } = useAuth();

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-col border-r border-border bg-card md:flex">
        <div className="px-6 py-6">
          <span className="font-display text-xl font-bold text-foreground">Nestify</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {navItems.map(({ icon: Icon, label, to }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                pathname.startsWith(to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}

          <div className="my-3 border-t border-border" />

          <Link
            to="/perfil"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              pathname.startsWith("/perfil")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/10 hover:text-foreground"
            )}
          >
            <User className="h-5 w-5" />
            Mi perfil
          </Link>

          <a
            href={DISCORD_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/10 hover:text-foreground"
          >
            <MessageCircle className="h-5 w-5" />
            Comunidad
            <span className="ml-auto rounded-full bg-accent px-2 py-0.5 font-accent text-[10px] font-semibold text-accent-foreground">
              Discord
            </span>
          </a>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{profile?.full_name || "Usuario"}</p>
            </div>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground" title="Cerrar sesión">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <header className="fixed left-0 right-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <span className="font-display text-lg font-bold text-foreground">Nestify</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {initials}
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-card md:hidden">
        {[...navItems, { icon: User, label: "Perfil", to: "/perfil" }].map(({ icon: Icon, label, to }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
              pathname.startsWith(to) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Content */}
      <main className="min-h-screen pb-24 pt-14 md:ml-64 md:pb-8 md:pt-0">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

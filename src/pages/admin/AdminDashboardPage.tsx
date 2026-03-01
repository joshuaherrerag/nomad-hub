import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Gift, Users, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

function StatCard({ icon: Icon, label, value, loading, color }: {
  icon: React.ElementType; label: string; value?: number; loading: boolean; color: string;
}) {
  return (
    <div className="flex-1 min-w-[160px] rounded-2xl border border-border bg-card p-5">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      {loading ? <Skeleton className="mb-1 h-8 w-16" /> : (
        <p className="font-display text-3xl font-bold text-foreground">{value ?? 0}</p>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: jobsCount, isLoading: l1 } = useQuery({
    queryKey: ["admin", "stats", "jobs"],
    queryFn: async () => {
      const { count } = await supabase.from("jobs").select("*", { count: "exact", head: true }).eq("status", "active");
      return count ?? 0;
    },
  });

  const { data: benefitsCount, isLoading: l2 } = useQuery({
    queryKey: ["admin", "stats", "benefits"],
    queryFn: async () => {
      const { count } = await supabase.from("benefits").select("*", { count: "exact", head: true }).eq("status", "active");
      return count ?? 0;
    },
  });

  const { data: usersCount, isLoading: l3 } = useQuery({
    queryKey: ["admin", "stats", "users"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: newToday, isLoading: l4 } = useQuery({
    queryKey: ["admin", "stats", "newToday"],
    queryFn: async () => {
      const since = new Date(Date.now() - 86_400_000).toISOString();
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", since);
      return count ?? 0;
    },
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ["admin", "logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10) as any;
      return (data ?? []) as Array<{
        id: string; action: string; entity_type: string; entity_id: string | null; created_at: string;
      }>;
    },
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Resumen</h1>

      <div className="flex gap-4 overflow-x-auto pb-2">
        <StatCard icon={Briefcase} label="Empleos activos" value={jobsCount} loading={l1} color="bg-primary/10 text-primary" />
        <StatCard icon={Gift} label="Beneficios activos" value={benefitsCount} loading={l2} color="bg-accent/10 text-accent" />
        <StatCard icon={Users} label="Total usuarios" value={usersCount} loading={l3} color="bg-primary/10 text-primary" />
        <StatCard icon={UserPlus} label="Nuevos hoy" value={newToday} loading={l4} color="bg-accent/10 text-accent" />
      </div>

      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Actividad reciente</h2>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {logsLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead className="hidden sm:table-cell">ID</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.entity_type}</TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs text-muted-foreground">
                      {log.entity_id?.slice(0, 8) ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: es })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Briefcase className="mb-2 h-10 w-10 text-border" />
              <p className="text-sm">Sin actividad registrada</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

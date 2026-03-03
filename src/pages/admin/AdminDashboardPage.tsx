import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Gift, Users, UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { formatDistanceToNow, subDays, format } from "date-fns";
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

const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(160, 60%, 45%)",
  "hsl(200, 60%, 50%)",
  "hsl(280, 50%, 55%)",
  "hsl(40, 70%, 50%)",
  "hsl(340, 60%, 50%)",
];

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

  // Registrations over last 14 days
  const { data: registrations, isLoading: regLoading } = useQuery({
    queryKey: ["admin", "chart", "registrations"],
    queryFn: async () => {
      const since = subDays(new Date(), 13).toISOString();
      const { data } = await supabase
        .from("profiles")
        .select("created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      const grouped: Record<string, number> = {};
      for (let i = 0; i < 14; i++) {
        const key = format(subDays(new Date(), 13 - i), "dd/MM");
        grouped[key] = 0;
      }
      (data ?? []).forEach((p) => {
        if (p.created_at) {
          const key = format(new Date(p.created_at), "dd/MM");
          if (key in grouped) grouped[key]++;
        }
      });
      return Object.entries(grouped).map(([date, count]) => ({ date, registros: count }));
    },
  });

  // Jobs by category
  const { data: jobsByCategory, isLoading: catLoading } = useQuery({
    queryKey: ["admin", "chart", "jobsByCategory"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("category").eq("status", "active");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((j) => {
        const cat = j.category || "Sin categoría";
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 7);
    },
  });

  // Benefits by category
  const { data: benefitsByCategory, isLoading: benCatLoading } = useQuery({
    queryKey: ["admin", "chart", "benefitsByCategory"],
    queryFn: async () => {
      const { data } = await supabase.from("benefits").select("category").eq("status", "active");
      const counts: Record<string, number> = {};
      (data ?? []).forEach((b) => {
        const cat = b.category || "Sin categoría";
        counts[cat] = (counts[cat] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
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

  const regChartConfig = {
    registros: { label: "Registros", color: "hsl(var(--primary))" },
  };

  const catChartConfig = {
    value: { label: "Empleos", color: "hsl(var(--primary))" },
  };

  const benChartConfig = Object.fromEntries(
    (benefitsByCategory ?? []).map((item, i) => [
      item.name,
      { label: item.name, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] },
    ])
  );

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold text-foreground">Resumen</h1>

      <div className="flex gap-4 overflow-x-auto pb-2">
        <StatCard icon={Briefcase} label="Empleos activos" value={jobsCount} loading={l1} color="bg-primary/10 text-primary" />
        <StatCard icon={Gift} label="Beneficios activos" value={benefitsCount} loading={l2} color="bg-accent/10 text-accent" />
        <StatCard icon={Users} label="Total usuarios" value={usersCount} loading={l3} color="bg-primary/10 text-primary" />
        <StatCard icon={UserPlus} label="Nuevos hoy" value={newToday} loading={l4} color="bg-accent/10 text-accent" />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registrations over time */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-semibold">Registros últimos 14 días</CardTitle>
          </CardHeader>
          <CardContent>
            {regLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChartContainer config={regChartConfig} className="h-[220px] w-full">
                <LineChart data={registrations} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="registros"
                    stroke="var(--color-registros)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Jobs by category */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base font-semibold">Empleos por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {catLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ChartContainer config={catChartConfig} className="h-[220px] w-full">
                <BarChart data={jobsByCategory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="var(--color-value)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Benefits by category (pie) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base font-semibold">Beneficios por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {benCatLoading ? (
              <Skeleton className="mx-auto h-[250px] w-[250px] rounded-full" />
            ) : benefitsByCategory && benefitsByCategory.length > 0 ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <ChartContainer config={benChartConfig} className="h-[250px] w-[250px]">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Pie
                      data={benefitsByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                    >
                      {benefitsByCategory.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-3">
                  {benefitsByCategory.map((item, i) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-semibold text-foreground">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Sin beneficios activos</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity log */}
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

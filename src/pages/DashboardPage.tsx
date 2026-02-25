import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getHours } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import JobCard from "@/components/jobs/JobCard";
import {
  Briefcase,
  Bookmark,
  Gift,
  Users,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

/* ─── Greeting ─── */
function getGreeting(name: string) {
  const h = getHours(new Date());
  if (h >= 6 && h < 12) return `Buenos días, ${name} 👋`;
  if (h >= 12 && h < 18) return `Buenas tardes, ${name} 👋`;
  return `Buenas noches, ${name} 👋`;
}

/* ─── Fallback data ─── */
const FALLBACK_JOBS = [
  { title: "Frontend Developer", company_name: "Acme Corp", category: "Desarrollo", contract_type: "fulltime", salary_min: 3000, salary_max: 5000, currency: "USD" },
  { title: "UX Designer", company_name: "DesignCo", category: "Diseño", contract_type: "contract", salary_min: 2000, salary_max: 3500, currency: "USD" },
  { title: "Marketing Manager", company_name: "StartupX", category: "Marketing", contract_type: "fulltime", salary_min: 2500, salary_max: 4000, currency: "USD" },
];

const FALLBACK_BENEFITS = [
  { partner_name: "Notion", title: "6 meses gratis", value_label: "GRATIS" },
  { partner_name: "Wise", title: "Sin comisiones", value_label: "0% FEE" },
  { partner_name: "Coworking", title: "20% descuento", value_label: "20% OFF" },
];

/* ─── Stat Card ─── */
function StatCard({ icon: Icon, label, value, loading }: { icon: React.ElementType; label: string; value?: number; loading: boolean }) {
  return (
    <div className="min-w-[160px] flex-1 rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      {loading ? (
        <Skeleton className="mb-1 h-8 w-16" />
      ) : (
        <p className="font-display text-3xl font-bold text-foreground">{value ?? 0}</p>
      )}
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ─── Benefit Mini Card ─── */
function BenefitMiniCard({ partner_name, title, value_label }: { partner_name: string; title: string; value_label?: string | null }) {
  const initials = partner_name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="min-w-[200px] rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-display text-xs font-bold text-primary">
          {initials}
        </div>
        <span className="text-xs text-muted-foreground">{partner_name}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {value_label && (
        <Badge className="mt-2 border-0 bg-primary/10 font-accent text-sm font-bold text-primary">
          {value_label}
        </Badge>
      )}
    </div>
  );
}

/* ─── Page ─── */
export default function DashboardPage() {
  const { user, profile } = useAuth();
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Hola";

  const { data: jobsToday, isLoading: loadingJobs } = useQuery({
    queryKey: ["stats", "jobsToday"],
    queryFn: async () => {
      const since = new Date(Date.now() - 86_400_000).toISOString();
      const { count } = await supabase.from("jobs").select("*", { count: "exact", head: true }).gte("published_at", since);
      return count ?? 0;
    },
  });

  const { data: savedCount, isLoading: loadingSaved } = useQuery({
    queryKey: ["stats", "savedJobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count } = await supabase.from("saved_jobs").select("*", { count: "exact", head: true }).eq("profile_id", user!.id);
      return count ?? 0;
    },
  });

  const { data: benefitsCount, isLoading: loadingBenefits } = useQuery({
    queryKey: ["stats", "benefitsCount"],
    queryFn: async () => {
      const { count } = await supabase.from("benefits").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: membersCount, isLoading: loadingMembers } = useQuery({
    queryKey: ["stats", "members", profile?.location_country],
    enabled: !!profile?.location_country,
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("location_country", profile!.location_country!);
      return count ?? 0;
    },
  });

  const { data: recentJobs, isLoading: loadingRecentJobs } = useQuery({
    queryKey: ["dashboard", "recentJobs"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("*").order("published_at", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const { data: featuredBenefits, isLoading: loadingFeaturedBenefits } = useQuery({
    queryKey: ["dashboard", "featuredBenefits"],
    queryFn: async () => {
      const { data } = await supabase.from("benefits").select("*").eq("is_featured", true).limit(3);
      return data ?? [];
    },
  });

  const jobsToShow = recentJobs && recentJobs.length > 0 ? recentJobs : FALLBACK_JOBS;
  const benefitsToShow = featuredBenefits && featuredBenefits.length > 0 ? featuredBenefits : FALLBACK_BENEFITS;

  return (
    <div className="space-y-8">
      {/* 1. Greeting */}
      <h1 className="font-display text-2xl font-bold text-foreground">
        {getGreeting(firstName)}
      </h1>

      {/* 2. Stats */}
      <div className="flex gap-4 overflow-x-auto pb-2">
        <StatCard icon={Briefcase} label="Empleos nuevos hoy" value={jobsToday} loading={loadingJobs} />
        <StatCard icon={Bookmark} label="Empleos guardados" value={savedCount} loading={loadingSaved} />
        <StatCard icon={Gift} label="Beneficios disponibles" value={benefitsCount} loading={loadingBenefits} />
        <StatCard icon={Users} label="Miembros en tu país" value={membersCount} loading={loadingMembers} />
      </div>

      {/* 3. Jobs */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Empleos para vos</h2>
          <Link to="/empleos" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loadingRecentJobs ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobsToShow.map((job, i) => (
              <JobCard key={"id" in job ? (job as { id: string }).id : i} {...job} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Discord Banner */}
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-gradient-to-r from-foreground to-[hsl(224,43%,17%)] p-6 md:flex-row">
        <div className="flex flex-1 items-center gap-4">
          <MessageCircle className="h-10 w-10 shrink-0 text-primary" />
          <div>
            <h3 className="font-display text-xl font-bold text-primary-foreground">
              Conectate con la comunidad
            </h3>
            <p className="text-sm text-primary-foreground/60">
              Nómadas de toda Latam te esperan en Discord.
            </p>
          </div>
        </div>
        <Button
          className="w-full rounded-full bg-card font-semibold text-foreground hover:bg-card/90 md:w-auto"
          onClick={() => window.open("https://discord.gg/nestify", "_blank")}
        >
          Unirse al Discord
        </Button>
      </div>

      {/* 5. Featured Benefits */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-foreground">Beneficios exclusivos</h2>
          <Link to="/beneficios" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loadingFeaturedBenefits ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 min-w-[200px] rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {benefitsToShow.map((b, i) => (
              <BenefitMiniCard key={i} partner_name={b.partner_name} title={b.title} value_label={b.value_label} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

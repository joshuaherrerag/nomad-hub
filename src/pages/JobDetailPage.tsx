import { useParams, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, ExternalLink, Heart, AlertTriangle, Briefcase, Clock, BarChart3, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobDetail, useSavedJobs, useToggleSaveJob } from "@/hooks/useJobs";
import { toast } from "sonner";

const CONTRACT_LABELS: Record<string, string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contrato",
  freelance: "Freelance",
};

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: job, isLoading } = useJobDetail(id);
  const { data: savedSet } = useSavedJobs();
  const toggleSave = useToggleSaveJob();

  const saved = savedSet?.has(id ?? "") ?? false;
  const formatSalary = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)},000` : String(n));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Empleo no encontrado.</p>
        <Button className="mt-4" onClick={() => navigate("/empleos")}>Volver a empleos</Button>
      </div>
    );
  }

  const isExternal = job.source !== "nestify" && job.source_url;

  const initials = job.company_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/empleos")}
        className="flex min-h-[44px] items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      >
        <ArrowLeft className="h-4 w-4" /> Volver a empleos
      </button>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main column */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            {job.company_logo_url ? (
              <img src={job.company_logo_url} alt={`Logo de ${job.company_name}`} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-base font-bold text-primary">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-display text-xl font-bold text-foreground lg:text-2xl">{job.title}</h1>
              <p className="text-muted-foreground">{job.company_name}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.category && <Badge variant="secondary" className="border-0 bg-accent/10 text-xs text-accent">{job.category}</Badge>}
                {job.contract_type && <Badge variant="outline" className="text-xs">{CONTRACT_LABELS[job.contract_type] ?? job.contract_type}</Badge>}
                {job.seniority && <Badge variant="outline" className="text-xs">{job.seniority}</Badge>}
                {job.published_at && (
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(job.published_at), { addSuffix: true, locale: es })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* External banner */}
          {isExternal && (
            <div className="flex items-start gap-3 rounded-xl border border-secondary/20 bg-secondary/10 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              <p className="text-sm text-foreground">
                Esta oferta es de <strong>{job.source}</strong>. Al hacer click serás redirigido al sitio original.
              </p>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div
              className="prose prose-sm max-w-none text-foreground/80 dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: job.description }}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 space-y-4 lg:w-80">
          {/* Summary card */}
          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-[0_8px_32px_rgba(231,111,81,0.1)]">
            {job.salary_min != null && job.salary_max != null && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Briefcase className="h-3.5 w-3.5" /> Salario</div>
                <p className="text-sm font-semibold text-foreground">{job.currency ?? "USD"} {formatSalary(job.salary_min)} – {formatSalary(job.salary_max)}</p>
              </div>
            )}
            {job.contract_type && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Contrato</div>
                <p className="text-sm font-semibold text-foreground">{CONTRACT_LABELS[job.contract_type] ?? job.contract_type}</p>
              </div>
            )}
            {job.seniority && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><BarChart3 className="h-3.5 w-3.5" /> Seniority</div>
                <p className="text-sm font-semibold text-foreground">{job.seniority}</p>
              </div>
            )}
            {job.category && (
              <div>
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"><Tag className="h-3.5 w-3.5" /> Categoría</div>
                <p className="text-sm font-semibold text-foreground">{job.category}</p>
              </div>
            )}
          </div>

          {/* CTA */}
          {isExternal ? (
            <Button className="w-full gap-2" onClick={() => window.open(job.source_url!, "_blank")}>
              Ver oferta original <ExternalLink className="h-4 w-4" />
            </Button>
          ) : (
            <Button className="w-full" onClick={() => toast.info("Próximamente")}>
              Postularme
            </Button>
          )}

          {/* Save */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => id && toggleSave.mutate({ jobId: id, saved })}
          >
            <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : ""}`} />
            {saved ? "Guardado" : "Guardar oferta"}
          </Button>

          {/* Company card */}
          <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-[0_8px_32px_rgba(231,111,81,0.1)]">
            <div className="flex items-center gap-3">
              {job.company_logo_url ? (
                <img src={job.company_logo_url} alt={`Logo de ${job.company_name}`} className="h-10 w-10 rounded-xl object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
                  {initials}
                </div>
              )}
              <p className="font-semibold text-foreground">{job.company_name}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

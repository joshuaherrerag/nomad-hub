import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/integrations/supabase/types";

const CONTRACT_LABELS: Record<string, string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contrato",
  freelance: "Freelance",
};

interface Props {
  job: Tables<"jobs">;
  saved: boolean;
  onToggleSave: () => void;
}

export default function JobListCard({ job, saved, onToggleSave }: Props) {
  const navigate = useNavigate();

  const initials = job.company_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatSalary = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)},000` : String(n));

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[0_8px_32px_hsl(var(--primary)/0.08)] ${
        job.is_featured ? "border-l-4 border-l-primary bg-primary/5" : ""
      }`}
    >
      {/* Logo */}
      {job.company_logo_url ? (
        <img src={job.company_logo_url} alt={job.company_name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-foreground">{job.title}</h3>
        <p className="truncate text-sm text-muted-foreground">{job.company_name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {job.category && (
            <Badge variant="secondary" className="border-0 bg-accent/10 text-xs text-accent">
              {job.category}
            </Badge>
          )}
          {job.contract_type && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {CONTRACT_LABELS[job.contract_type] ?? job.contract_type}
            </Badge>
          )}
          {job.salary_min != null && job.salary_max != null && (
            <span className="text-xs font-medium text-foreground">
              {job.currency ?? "USD"} {formatSalary(job.salary_min)} – {formatSalary(job.salary_max)}
            </span>
          )}
          {job.published_at && (
            <span className="text-xs text-muted-foreground">
              · {formatDistanceToNow(new Date(job.published_at), { addSuffix: true, locale: es })}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onToggleSave(); }}>
          <Heart className={`h-4 w-4 ${saved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate(`/empleos/${job.id}`)}>
          Ver oferta
        </Button>
      </div>
    </div>
  );
}

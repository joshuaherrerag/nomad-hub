import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface JobCardProps {
  id?: string;
  title: string;
  company_name: string;
  company_logo_url?: string | null;
  category?: string | null;
  contract_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  currency?: string | null;
  published_at?: string | null;
  is_featured?: boolean | null;
}

const CONTRACT_LABELS: Record<string, string> = {
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contrato",
  freelance: "Freelance",
};

export default function JobCard({
  id,
  title,
  company_name,
  company_logo_url,
  category,
  contract_type,
  salary_min,
  salary_max,
  currency,
  published_at,
  is_featured,
}: JobCardProps) {
  const navigate = useNavigate();

  const initials = company_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const formatSalary = (n: number) =>
    n >= 1000 ? `${Math.round(n / 1000)},000` : String(n);

  return (
    <div
      className={`rounded-2xl border border-border bg-card p-5 transition-shadow duration-200 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.1)] ${
        is_featured ? "border-l-4 border-l-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Logo */}
        {company_logo_url ? (
          <img
            src={company_logo_url}
            alt={company_name}
            className="h-10 w-10 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-display text-sm font-bold text-primary">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-body text-sm font-semibold text-foreground">
            {title}
          </h3>
          <p className="truncate text-sm text-muted-foreground">{company_name}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {category && (
          <Badge variant="secondary" className="bg-accent/10 text-accent border-0 text-xs font-accent">
            {category}
          </Badge>
        )}
        {contract_type && (
          <Badge variant="outline" className="text-xs text-muted-foreground">
            {CONTRACT_LABELS[contract_type] ?? contract_type}
          </Badge>
        )}
      </div>

      {/* Salary */}
      {salary_min != null && salary_max != null && (
        <p className="mt-3 text-sm font-medium text-foreground">
          {currency ?? "USD"} {formatSalary(salary_min)} – {formatSalary(salary_max)}
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        {published_at ? (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(published_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
        ) : (
          <span />
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => id && navigate(`/empleos/${id}`)}
        >
          Ver oferta
        </Button>
      </div>
    </div>
  );
}

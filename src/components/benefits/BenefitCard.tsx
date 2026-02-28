import { differenceInDays } from "date-fns";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BenefitCardProps {
  id?: string;
  partner_name: string;
  partner_logo_url?: string | null;
  title: string;
  description?: string | null;
  value_label?: string | null;
  is_featured?: boolean | null;
  valid_until?: string | null;
  onRedeem: () => void;
}

export default function BenefitCard({
  partner_name,
  partner_logo_url,
  title,
  description,
  value_label,
  is_featured,
  valid_until,
  onRedeem,
}: BenefitCardProps) {
  const initials = partner_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const expiringSoon =
    valid_until && differenceInDays(new Date(valid_until), new Date()) < 7 && differenceInDays(new Date(valid_until), new Date()) >= 0;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-card p-5 md:p-6 transition-shadow hover:shadow-[0_8px_32px_rgba(231,111,81,0.1)] ${
        is_featured ? "border-2 border-primary" : "border-border"
      }`}
    >
      {/* Badges top */}
      <div className="mb-3 flex gap-2">
        {is_featured && (
          <Badge className="border-0 bg-primary/10 text-xs font-semibold text-primary">Destacado</Badge>
        )}
        {expiringSoon && (
          <Badge className="border-0 bg-secondary/10 text-xs font-semibold text-secondary">Vence pronto</Badge>
        )}
      </div>

      {/* Logo + partner */}
      <div className="mb-3 flex items-center gap-3">
        {partner_logo_url ? (
          <img src={partner_logo_url} alt={partner_name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 font-display text-sm font-bold text-accent">
            {initials}
          </div>
        )}
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{partner_name}</span>
      </div>

      {/* Content */}
      <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      {description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>}

      {/* Value badge */}
      {value_label && (
        <Badge className="mt-3 w-fit border-0 bg-primary/10 font-accent text-sm font-bold text-primary">
          {value_label}
        </Badge>
      )}

      {/* CTA */}
      <div className="mt-auto pt-4">
        <Button variant="ghost" className="w-full gap-2 text-sm" onClick={onRedeem}>
          Canjear beneficio <ExternalLink className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

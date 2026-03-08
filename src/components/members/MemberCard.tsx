import { useNavigate } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MemberProfile } from "@/hooks/useMembers";

const AVAILABILITY_MAP: Record<string, { label: string; className: string }> = {
  open: { label: "Disponible", className: "bg-accent/10 text-accent" },
  freelance: { label: "Para proyectos", className: "bg-secondary/10 text-secondary" },
  unavailable: { label: "No disponible", className: "bg-muted/20 text-muted-foreground" },
};

export default function MemberCard({ member }: { member: MemberProfile }) {
  const navigate = useNavigate();
  const initials = (member.full_name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avail = AVAILABILITY_MAP[member.availability ?? "open"];
  const location = [member.location_city, member.location_country].filter(Boolean).join(", ");

  return (
    <button
      onClick={() => navigate(`/perfil/${member.id}`)}
      className="flex w-full min-h-[44px] flex-col items-center rounded-2xl border border-border bg-card p-5 md:p-6 text-center transition-shadow hover:shadow-[0_8px_32px_rgba(231,111,81,0.1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Ver perfil de ${member.full_name || "miembro"}`}
    >
      {member.avatar_url ? (
        <img src={member.avatar_url} alt={`Avatar de ${member.full_name || "miembro"}`} className="h-14 w-14 rounded-full object-cover" />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 font-display text-lg font-bold text-primary">
          {initials || "?"}
        </div>
      )}

      <p className="mt-3 w-full truncate font-display font-semibold text-foreground">{member.full_name || "Sin nombre"}</p>

      {member.title && (
        <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{member.title}</p>
      )}

      {location && (
        <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location}
        </p>
      )}

      {avail && (
        <Badge className={`mt-2 border-0 text-xs font-medium ${avail.className}`}>
          {avail.label}
        </Badge>
      )}

      {member.skills.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-1.5">
          {member.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

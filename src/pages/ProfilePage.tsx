import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Pencil } from "lucide-react";

const AVAILABILITY_MAP: Record<string, { label: string; className: string }> = {
  open: { label: "● Disponible para trabajo", className: "bg-green-500/10 text-green-600" },
  freelance: { label: "● Disponible para proyectos", className: "bg-amber-500/10 text-amber-600" },
  unavailable: { label: "● No disponible", className: "bg-muted/20 text-muted-foreground" },
};

export default function ProfilePage() {
  const { id: paramId } = useParams<{ id?: string }>();
  const { user, profile: ownProfile } = useAuth();

  const isOwnProfile = !paramId || paramId === user?.id;
  const profileId = isOwnProfile ? user?.id : paramId;

  const { data: fetchedProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile", profileId],
    enabled: !!profileId && !isOwnProfile,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId!)
        .single();
      return data;
    },
  });

  const profile = isOwnProfile ? ownProfile : fetchedProfile;

  const { data: skills, isLoading: loadingSkills } = useQuery({
    queryKey: ["profile-skills", profileId],
    enabled: !!profileId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_skills")
        .select("skill_id, skills(name)")
        .eq("profile_id", profileId!);
      return data?.map((ps: any) => ps.skills?.name).filter(Boolean) as string[] ?? [];
    },
  });

  const initials = (profile?.full_name ?? "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avail = AVAILABILITY_MAP[profile?.availability ?? "open"];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start gap-5">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="h-20 w-20 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-2xl font-bold text-primary">
              {initials || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {profile?.full_name || "Sin nombre"}
            </h1>
            {profile?.title && <p className="text-muted-foreground">{profile.title}</p>}
            {(profile?.location_city || profile?.location_country) && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {[profile.location_city, profile.location_country].filter(Boolean).join(", ")}
              </p>
            )}
            {avail && (
              <Badge className={`mt-2 border-0 text-xs font-medium ${avail.className}`}>
                {avail.label}
              </Badge>
            )}
          </div>
          {isOwnProfile && (
            <Button variant="secondary" size="sm" className="shrink-0 gap-1.5" asChild>
              <Link to="/perfil/editar">
                <Pencil className="h-3.5 w-3.5" /> Editar perfil
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-2 font-display text-lg font-bold text-foreground">Bio</h2>
        {profile?.bio ? (
          <p className="text-sm text-foreground/80">{profile.bio}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No has agregado una bio todavía.</p>
        )}
      </div>

      {/* Skills */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3 font-display text-lg font-bold text-foreground">Habilidades</h2>
        {loadingSkills ? (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-20 rounded-full" />)}
          </div>
        ) : skills && skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} className="border-0 bg-primary/10 text-primary">
                {skill}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">No has agregado habilidades todavía.</p>
        )}
      </div>
    </div>
  );
}

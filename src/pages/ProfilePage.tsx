import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Pencil, Globe, Linkedin, Github, Twitter, Instagram, ExternalLink } from "lucide-react";

const AVAILABILITY_MAP: Record<string, { label: string; className: string }> = {
  open: { label: "● Disponible para trabajo", className: "bg-accent/10 text-accent" },
  freelance: { label: "● Disponible para proyectos", className: "bg-secondary/10 text-secondary" },
  unavailable: { label: "● No disponible", className: "bg-muted/20 text-muted-foreground" },
};

const SOCIAL_LINKS = [
  { key: "social_linkedin", icon: Linkedin, label: "LinkedIn" },
  { key: "social_github", icon: Github, label: "GitHub" },
  { key: "social_twitter", icon: Twitter, label: "X / Twitter" },
  { key: "social_instagram", icon: Instagram, label: "Instagram" },
] as const;

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
  const p = profile as any; // for new columns not yet in generated types

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

  const hasSocialLinks = SOCIAL_LINKS.some((s) => p?.[s.key]);
  const hasWebsite = !!p?.website_url;

  return (
    <div className="mx-auto max-w-2xl space-y-8 md:space-y-10">
      {/* Cover + Header card */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_8px_32px_rgba(231,111,81,0.1)]">
        {/* Cover */}
        {p?.cover_url ? (
          <div className="h-40 w-full">
            <img src={p.cover_url} alt="Portada" className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="h-24 w-full bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />
        )}

        <div className="p-5 md:p-6">
          {/* Mobile: stacked layout */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-5 -mt-12">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="h-20 w-20 shrink-0 rounded-full border-4 border-card object-cover" />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-card bg-primary/10 font-display text-2xl font-bold text-primary">
                {initials || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1 mt-3 sm:mt-8">
              <div className="flex items-start justify-between gap-2">
                <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground break-words">
                  {profile?.full_name || "Sin nombre"}
                </h1>
                {isOwnProfile && (
                  <Button variant="secondary" size="sm" className="shrink-0 gap-1.5" asChild>
                    <Link to="/perfil/editar">
                      <Pencil className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Editar perfil</span><span className="sm:hidden">Editar</span>
                    </Link>
                  </Button>
                )}
              </div>
              {profile?.title && <p className="text-sm sm:text-base text-muted-foreground">{profile.title}</p>}
              {(profile?.location_city || profile?.location_country) && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {[profile.location_city, profile.location_country].filter(Boolean).join(", ")}
                </p>
              )}
              {avail && (
                <Badge className={`mt-2 border-0 text-xs font-medium ${avail.className}`}>
                  {avail.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-[0_8px_32px_rgba(231,111,81,0.1)]">
        <h2 className="mb-2 font-display text-lg font-semibold text-foreground">Bio</h2>
        {profile?.bio ? (
          <p className="text-sm text-foreground/80">{profile.bio}</p>
        ) : (
          <p className="text-sm italic text-muted-foreground">No has agregado una bio todavía.</p>
        )}
      </div>

      {/* Website & Social Links */}
      {(hasWebsite || hasSocialLinks) && (
        <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-[0_8px_32px_rgba(231,111,81,0.1)]">
          <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Enlaces</h2>
          <div className="flex flex-wrap gap-2">
            {hasWebsite && (
              <a
                href={p.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                <Globe className="h-4 w-4" />
                Portfolio
                <ExternalLink className="h-3 w-3 opacity-50" />
              </a>
            )}
            {SOCIAL_LINKS.map(({ key, icon: Icon, label }) => {
              const url = p?.[key];
              if (!url) return null;
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <ExternalLink className="h-3 w-3 opacity-50" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills */}
      <div className="rounded-2xl border border-border bg-card p-5 md:p-6 shadow-[0_8px_32px_rgba(231,111,81,0.1)]">
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Habilidades</h2>
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

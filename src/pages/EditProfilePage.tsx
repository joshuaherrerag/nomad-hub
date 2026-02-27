import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Loader2, X, Camera, Plus } from "lucide-react";

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Ecuador",
  "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua", "Panamá",
  "Paraguay", "Perú", "Puerto Rico", "Rep. Dominicana", "Uruguay", "Venezuela", "Otro",
];

const schema = z.object({
  full_name: z.string().min(2, "Mínimo 2 caracteres"),
  title: z.string().optional(),
  bio: z.string().max(300, "Máximo 300 caracteres").optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
  availability: z.enum(["open", "freelance", "unavailable"]),
});

type FormValues = z.infer<typeof schema>;

const AVAILABILITY_OPTIONS = [
  { value: "open" as const, label: "Disponible para trabajo", desc: "Buscando activamente" },
  { value: "freelance" as const, label: "Para proyectos", desc: "Freelance / Consultoría" },
  { value: "unavailable" as const, label: "No disponible", desc: "Solo explorando" },
];

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const setProfile = useAuthStore((s) => s.setProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? "");

  // Skills state
  const [selectedSkills, setSelectedSkills] = useState<{ id: string; name: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: profile?.full_name ?? "",
      title: profile?.title ?? "",
      bio: profile?.bio ?? "",
      location_city: profile?.location_city ?? "",
      location_country: profile?.location_country ?? "",
      availability: (profile?.availability as FormValues["availability"]) ?? "open",
    },
  });

  // Load existing skills
  useQuery({
    queryKey: ["edit-profile-skills", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_skills")
        .select("skill_id, skills(id, name)")
        .eq("profile_id", user!.id);
      const skills = data?.map((ps: any) => ({ id: ps.skills.id, name: ps.skills.name })).filter(Boolean) ?? [];
      setSelectedSkills(skills);
      return skills;
    },
  });

  // Search skills
  const { data: skillSuggestions } = useQuery({
    queryKey: ["skill-search", skillSearch],
    enabled: skillSearch.length > 1,
    queryFn: async () => {
      const { data } = await supabase.from("skills").select("id, name").ilike("name", `%${skillSearch}%`).limit(10);
      return data ?? [];
    },
  });

  const bioValue = form.watch("bio") ?? "";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
      toast.success("Avatar actualizado");
    } catch {
      toast.error("Error al subir avatar");
    } finally {
      setUploading(false);
    }
  };

  const addSkill = async (skill: { id: string; name: string }) => {
    if (selectedSkills.length >= 10) return toast.error("Máximo 10 habilidades");
    if (selectedSkills.find((s) => s.id === skill.id)) return;
    setSelectedSkills((prev) => [...prev, skill]);
    setSkillSearch("");
    setShowSkillDropdown(false);
  };

  const createAndAddSkill = async (name: string) => {
    if (selectedSkills.length >= 10) return toast.error("Máximo 10 habilidades");
    const { data, error } = await supabase.from("skills").insert({ name: name.trim() }).select("id, name").single();
    if (error || !data) return toast.error("Error al crear habilidad");
    addSkill(data);
  };

  const removeSkill = (id: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s.id !== id));
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: values.full_name,
          title: values.title || null,
          bio: values.bio || null,
          location_city: values.location_city || null,
          location_country: values.location_country || null,
          availability: values.availability,
          avatar_url: avatarUrl || null,
        })
        .eq("id", user.id);
      if (error) throw error;

      // Sync skills
      await supabase.from("profile_skills").delete().eq("profile_id", user.id);
      if (selectedSkills.length > 0) {
        await supabase.from("profile_skills").insert(
          selectedSkills.map((s) => ({ profile_id: user.id, skill_id: s.id }))
        );
      }

      // Refresh profile
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      toast.success("Perfil actualizado ✓");
      navigate("/perfil");
    } catch {
      toast.error("Error al guardar perfil");
    }
  };

  const initials = (profile?.full_name ?? "").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const filteredSuggestions = skillSuggestions?.filter((s) => !selectedSkills.find((sel) => sel.id === s.id)) ?? [];
  const showCreateOption = skillSearch.length > 1 && !skillSuggestions?.find((s) => s.name.toLowerCase() === skillSearch.toLowerCase());

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Editar perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Actualiza tu información personal</p>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/10 font-display text-2xl font-bold text-primary">
              {initials || "?"}
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
            {uploading ? <Loader2 className="h-5 w-5 animate-spin text-primary-foreground" /> : <Camera className="h-5 w-5 text-primary-foreground" />}
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        <p className="text-xs text-muted-foreground">Haz click para cambiar tu foto de perfil</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="full_name" render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre completo *</FormLabel>
              <FormControl><Input {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Título profesional</FormLabel>
              <FormControl><Input {...field} placeholder="Ej: Frontend Developer" /></FormControl>
            </FormItem>
          )} />

          <FormField control={form.control} name="bio" render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl><Textarea {...field} placeholder="Cuéntanos sobre ti…" rows={3} className="resize-none" maxLength={300} /></FormControl>
              <p className="text-right text-xs text-muted-foreground">{300 - bioValue.length} caracteres restantes</p>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="location_city" render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl><Input {...field} placeholder="Ej: CDMX" /></FormControl>
              </FormItem>
            )} />

            <FormField control={form.control} name="location_country" render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

          {/* Availability */}
          <FormField control={form.control} name="availability" render={({ field }) => (
            <FormItem>
              <FormLabel>Disponibilidad</FormLabel>
              <div className="mt-1 grid grid-cols-3 gap-3">
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`rounded-xl border px-3 py-3 text-left transition-all ${
                      field.value === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </FormItem>
          )} />

          {/* Skills */}
          <div className="space-y-2">
            <Label>Habilidades (máx. 10)</Label>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((s) => (
                  <Badge key={s.id} className="gap-1 border-0 bg-primary/10 text-primary">
                    {s.name}
                    <button type="button" onClick={() => removeSkill(s.id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Input
                value={skillSearch}
                onChange={(e) => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }}
                onFocus={() => setShowSkillDropdown(true)}
                placeholder="Buscar habilidad…"
              />
              {showSkillDropdown && skillSearch.length > 1 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-border bg-card shadow-lg">
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-muted/10"
                      onClick={() => addSkill(s)}
                    >
                      {s.name}
                    </button>
                  ))}
                  {showCreateOption && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary hover:bg-muted/10"
                      onClick={() => createAndAddSkill(skillSearch)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Agregar "{skillSearch}"
                    </button>
                  )}
                  {filteredSuggestions.length === 0 && !showCreateOption && (
                    <p className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate("/perfil")}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-1.5">
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar cambios
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

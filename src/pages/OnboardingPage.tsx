import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Briefcase,
  Heart,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

const INTEREST_OPTIONS = [
  "Trabajo remoto",
  "Freelance",
  "Startups",
  "Tecnología",
  "Diseño",
  "Marketing",
  "Finanzas",
  "Viajes",
  "Coworking",
  "Networking",
  "Salud & Bienestar",
  "Educación",
];

const AVAILABILITY_OPTIONS = [
  { value: "open", label: "Abierto a ofertas", description: "Buscando activamente" },
  { value: "freelance", label: "Freelance", description: "Disponible para proyectos" },
  { value: "unavailable", label: "No disponible", description: "Solo explorando" },
];

const STEPS = [
  { icon: MapPin, label: "Tu información" },
  { icon: Heart, label: "Intereses" },
  { icon: Briefcase, label: "Disponibilidad" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const setProfile = useAuthStore((s) => s.setProfile);

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [title, setTitle] = useState(profile?.title ?? "");
  const [city, setCity] = useState(profile?.location_city ?? "");
  const [country, setCountry] = useState(profile?.location_country ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.interests ?? []);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [availability, setAvailability] = useState(profile?.availability ?? "open");

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const canAdvance = () => {
    if (step === 0) return fullName.trim().length > 0;
    if (step === 1) return interests.length > 0;
    return true;
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          title: title.trim() || null,
          location_city: city.trim() || null,
          location_country: country.trim() || null,
          interests,
          bio: bio.trim() || null,
          availability,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Refresh profile in store
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);

      toast.success("¡Perfil completado!");
      navigate("/dashboard", { replace: true });
    } catch {
      toast.error("Error al guardar tu perfil. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Completa tu perfil
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paso {step + 1} de {STEPS.length} — {STEPS[step].label}
          </p>
        </div>

        {/* Progress */}
        <Progress value={progress} className="mb-8 h-2" />

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {/* Step 0 — Basic info */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label className="font-body text-sm font-medium">
                  Nombre completo *
                </Label>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="font-body text-sm font-medium">
                  Título profesional
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Diseñador UX, Dev Full-Stack…"
                  className="mt-1.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="font-body text-sm font-medium">Ciudad</Label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej: CDMX"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="font-body text-sm font-medium">País</Label>
                  <Input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ej: México"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Interests */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selecciona al menos uno para personalizar tu experiencia.
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2 — Availability + Bio */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <Label className="font-body text-sm font-medium">
                  Disponibilidad
                </Label>
                <div className="mt-2 space-y-2">
                  {AVAILABILITY_OPTIONS.map((opt) => {
                    const selected = availability === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAvailability(opt.value)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40"
                        }`}
                      >
                        <div
                          className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                            selected
                              ? "border-primary bg-primary"
                              : "border-muted"
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {opt.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {opt.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="font-body text-sm font-medium">
                  Bio (opcional)
                </Label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Cuéntanos un poco sobre ti…"
                  rows={3}
                  className="mt-1.5 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          {step > 0 ? (
            <Button
              variant="ghost"
              onClick={() => setStep((s) => s - 1)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Atrás
            </Button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="gap-1.5"
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="gap-1.5"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Completar perfil
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  Gift,
  Users,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

const INTEREST_OPTIONS = [
  "Desarrollo",
  "Diseño",
  "Marketing",
  "Datos",
  "Negocios",
  "Contenido",
  "Legal",
  "Educación",
  "Salud",
];

const PILLS = [
  { icon: Briefcase, label: "Empleos remotos" },
  { icon: Gift, label: "Beneficios" },
  { icon: Users, label: "Comunidad" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const setProfile = useAuthStore((s) => s.setProfile);

  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) return prev.filter((i) => i !== interest);
      if (prev.length >= 5) return prev;
      return [...prev, interest];
    });
  };

  const completeOnboarding = useCallback(
    async (selectedInterests: string[] = []) => {
      if (!user) return;
      setSaving(true);
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            interests: selectedInterests.length > 0 ? selectedInterests : [],
            onboarding_completed: true,
          })
          .eq("id", user.id);

        if (error) throw error;

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);

        toast.success("Bienvenido a Nestify 🎉");
        navigate("/dashboard", { replace: true });
      } catch {
        toast.error("Error al guardar. Intenta de nuevo.");
      } finally {
        setSaving(false);
      }
    },
    [user, navigate, setProfile]
  );

  const handleSkip = () => completeOnboarding([]);
  const handleFinish = () => completeOnboarding(interests);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Skip button */}
      <button
        onClick={handleSkip}
        disabled={saving}
        className="absolute right-6 top-6 z-20 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Omitir
      </button>

      {/* Progress dots */}
      <div className="absolute left-1/2 top-6 z-20 flex -translate-x-1/2 gap-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors duration-300 ${
              i <= step ? "bg-primary" : "bg-border"
            }`}
          />
        ))}
      </div>

      {/* Slides container */}
      <div
        className="flex h-full w-[200vw] transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${step * 100}vw)` }}
      >
        {/* STEP 0 — Welcome */}
        <div className="relative flex h-full w-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-foreground to-[#16213E] px-6 text-center">
          {/* Orange blob */}
          <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-20 blur-[120px]" />

          <h2 className="relative z-10 font-display text-4xl font-bold text-primary-foreground">
            Nestify
          </h2>

          <h1 className="relative z-10 mt-8 max-w-md font-display text-3xl font-bold leading-tight text-primary-foreground">
            Tu carrera no tiene dirección fija.
            <br />
            <span className="text-primary-foreground">Tu comunidad sí.</span>
          </h1>

          <p className="relative z-10 mt-4 max-w-sm text-primary-foreground/70">
            Estás a 2 pasos de acceder a empleos remotos, beneficios exclusivos
            y una comunidad real en Latam.
          </p>

          <div className="relative z-10 mt-8 flex flex-wrap justify-center gap-3">
            {PILLS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-2 text-sm text-primary-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </div>

          <Button
            onClick={() => setStep(1)}
            className="relative z-10 mt-10 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90"
            size="lg"
          >
            Empezar
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>

          <p className="relative z-10 mt-3 text-xs text-primary-foreground/40">
            Tarda menos de 1 minuto
          </p>
        </div>

        {/* STEP 1 — Interests */}
        <div className="flex h-full w-screen flex-col items-center justify-center bg-background px-6 text-center">
          <h1 className="font-display text-2xl font-bold text-foreground">
            ¿En qué área trabajás?
          </h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Elegí tus áreas para que personalicemos tu feed de empleos.
          </p>

          <div className="mt-8 flex max-w-md flex-wrap justify-center gap-2.5">
            {INTEREST_OPTIONS.map((interest) => {
              const selected = interests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground hover:border-primary"
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                  {interest}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleFinish}
            disabled={interests.length === 0 || saving}
            className="mt-10 rounded-full px-8 py-3 font-semibold"
            size="lg"
          >
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Finalizar y explorar
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

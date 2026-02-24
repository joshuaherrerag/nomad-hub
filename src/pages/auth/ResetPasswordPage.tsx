import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Contraseña actualizada correctamente");
      navigate("/dashboard");
    }
  };

  if (!isRecovery) {
    return (
      <AuthLayout>
        <p className="text-muted-foreground">Enlace de recuperación inválido.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h2 className="mb-1 font-display text-2xl font-bold text-foreground">
        Nueva contraseña
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">Ingresa tu nueva contraseña</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input id="password" type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 rounded-xl" />
        </div>
        <Button type="submit" className="w-full rounded-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Actualizar contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}

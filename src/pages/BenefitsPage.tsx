import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import BenefitCard from "@/components/benefits/BenefitCard";
import RedeemModal from "@/components/benefits/RedeemModal";
import type { Tables } from "@/integrations/supabase/types";

const CATEGORIES = ["Todos", "Tecnología", "Viaje", "Finanzas", "Salud", "Formación"];

const FALLBACK_BENEFITS: Partial<Tables<"benefits">>[] = [
  { id: "f1", partner_name: "Notion", title: "6 meses gratis", value_label: "GRATIS", category: "Tecnología", description: "Acceso completo a Notion Plus por 6 meses." },
  { id: "f2", partner_name: "Wise", title: "Sin comisiones", value_label: "0% FEE", category: "Finanzas", description: "Transferencias sin comisión durante 3 meses." },
  { id: "f3", partner_name: "Coworking Pass", title: "20% descuento", value_label: "20% OFF", category: "Viaje", description: "Descuento en espacios de coworking en toda Latam." },
];

export default function BenefitsPage() {
  const [activeTab, setActiveTab] = useState("Todos");
  const [redeemBenefit, setRedeemBenefit] = useState<Tables<"benefits"> | null>(null);

  const { data: benefits, isLoading } = useQuery({
    queryKey: ["benefits"],
    queryFn: async () => {
      const { data } = await supabase.from("benefits").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const items = benefits && benefits.length > 0 ? benefits : FALLBACK_BENEFITS;
  const filtered = activeTab === "Todos" ? items : items.filter((b) => b.category === activeTab);

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Beneficios</h1>
        <p className="mt-1 text-muted-foreground">Descuentos y ventajas para la comunidad Nestify.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              activeTab === cat
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-muted-foreground">No hay beneficios en esta categoría.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b, i) => (
            <BenefitCard
              key={b.id ?? i}
              partner_name={b.partner_name!}
              partner_logo_url={b.partner_logo_url}
              title={b.title!}
              description={b.description}
              value_label={b.value_label}
              is_featured={b.is_featured}
              valid_until={b.valid_until}
              onRedeem={() => setRedeemBenefit(b as Tables<"benefits">)}
            />
          ))}
        </div>
      )}

      <RedeemModal
        open={!!redeemBenefit}
        onOpenChange={(open) => !open && setRedeemBenefit(null)}
        benefit={redeemBenefit}
      />
    </div>
  );
}

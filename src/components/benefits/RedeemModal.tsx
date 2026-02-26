import { useState } from "react";
import { Copy, Check, ExternalLink, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RedeemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefit: {
    partner_name: string;
    partner_logo_url?: string | null;
    title: string;
    redeem_type?: string | null;
    redeem_value?: string | null;
    redeem_instructions?: string | null;
  } | null;
}

export default function RedeemModal({ open, onOpenChange, benefit }: RedeemModalProps) {
  const [copied, setCopied] = useState(false);

  if (!benefit) return null;

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Código copiado ✓");
    setTimeout(() => setCopied(false), 2000);
  };

  const initials = benefit.partner_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {benefit.partner_logo_url ? (
              <img src={benefit.partner_logo_url} alt={benefit.partner_name} className="h-10 w-10 rounded-xl object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 font-display text-sm font-bold text-accent">
                {initials}
              </div>
            )}
            <DialogTitle className="text-left">{benefit.title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {benefit.redeem_type === "code" && benefit.redeem_value && (
            <>
              <div className="rounded-xl bg-muted/20 p-4 text-center font-mono text-lg font-bold text-foreground">
                {benefit.redeem_value}
              </div>
              <Button className="w-full gap-2" onClick={() => handleCopy(benefit.redeem_value!)}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar código"}
              </Button>
            </>
          )}

          {benefit.redeem_type === "link" && benefit.redeem_value && (
            <Button className="w-full gap-2" onClick={() => window.open(benefit.redeem_value!, "_blank")}>
              Ir al beneficio <ExternalLink className="h-4 w-4" />
            </Button>
          )}

          {benefit.redeem_type === "email" && benefit.redeem_value && (
            <>
              <div className="rounded-xl bg-muted/20 p-4 text-center text-sm font-medium text-foreground">
                {benefit.redeem_value}
              </div>
              <Button className="w-full gap-2" onClick={() => handleCopy(benefit.redeem_value!)}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar email"}
              </Button>
            </>
          )}

          {benefit.redeem_instructions && (
            <p className="text-sm text-muted-foreground">{benefit.redeem_instructions}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

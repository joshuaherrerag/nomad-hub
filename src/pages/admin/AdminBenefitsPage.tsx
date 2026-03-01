import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Gift, Plus, Pencil, Pause, Play, Trash2 } from "lucide-react";

const CATEGORIES = ["tech", "travel", "finance", "health", "education"];
const REDEEM_TYPES = ["code", "link", "email"];

const benefitSchema = z.object({
  partner_name: z.string().min(1, "Requerido"),
  partner_logo_url: z.string().optional(),
  title: z.string().min(1, "Requerido"),
  description: z.string().optional(),
  value_label: z.string().min(1, "Requerido"),
  category: z.string().optional(),
  redeem_type: z.string().optional(),
  redeem_value: z.string().optional(),
  redeem_instructions: z.string().optional(),
  is_featured: z.boolean().optional(),
  valid_until: z.string().optional(),
  status: z.string().optional(),
});

type BenefitForm = z.infer<typeof benefitSchema>;

export default function AdminBenefitsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; benefit: any } | null>(null);

  const form = useForm<BenefitForm>({
    resolver: zodResolver(benefitSchema),
    defaultValues: { status: "active", is_featured: false },
  });

  const { data: benefits, isLoading } = useQuery({
    queryKey: ["admin", "benefits"],
    queryFn: async () => {
      const { data, error } = await supabase.from("benefits").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: BenefitForm) => {
      const payload = { ...values, valid_until: values.valid_until || null } as any;
      if (editing) {
        const { error } = await supabase.from("benefits").update(payload).eq("id", editing.id);
        if (error) throw error;
        await logAdminAction("update_benefit", "benefit", editing.id, payload);
      } else {
        const { data, error } = await supabase.from("benefits").insert(payload).select().single();
        if (error) throw error;
        await logAdminAction("create_benefit", "benefit", data.id, payload);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Beneficio actualizado" : "Beneficio creado");
      qc.invalidateQueries({ queryKey: ["admin", "benefits"] });
      setModalOpen(false);
      setEditing(null);
      form.reset({ status: "active", is_featured: false });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("benefits").update({ status } as any).eq("id", id);
      if (error) throw error;
      await logAdminAction(`${status}_benefit`, "benefit", id);
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["admin", "benefits"] });
      setConfirmAction(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openEdit = (b: any) => {
    setEditing(b);
    form.reset({
      partner_name: b.partner_name,
      partner_logo_url: b.partner_logo_url ?? "",
      title: b.title,
      description: b.description ?? "",
      value_label: b.value_label ?? "",
      category: b.category ?? "",
      redeem_type: b.redeem_type ?? "",
      redeem_value: b.redeem_value ?? "",
      redeem_instructions: b.redeem_instructions ?? "",
      is_featured: b.is_featured ?? false,
      valid_until: b.valid_until ? b.valid_until.slice(0, 10) : "",
      status: b.status ?? "active",
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    form.reset({ status: "active", is_featured: false });
    setModalOpen(true);
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="border-0 bg-accent/20 text-accent text-xs">Activo</Badge>;
    if (status === "paused") return <Badge className="border-0 bg-secondary/20 text-secondary text-xs">Pausado</Badge>;
    return <Badge className="border-0 bg-destructive/20 text-destructive text-xs">Eliminado</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Gestión de Beneficios</h1>
        <Button onClick={openCreate} className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> Agregar beneficio
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      ) : benefits && benefits.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-muted-foreground">
          <Gift className="mb-3 h-12 w-12 text-border" />
          <p>No hay beneficios</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {benefits?.map((b: any) => {
            const initials = b.partner_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
            return (
              <div key={b.id} className="relative rounded-2xl border border-border bg-card p-5">
                <div className="absolute right-4 top-4">{statusBadge(b.status ?? "active")}</div>
                <div className="flex items-center gap-3 mb-3">
                  {b.partner_logo_url ? (
                    <img src={b.partner_logo_url} alt="" className="h-10 w-10 rounded-xl object-contain" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">{initials}</div>
                  )}
                  <span className="text-sm text-muted-foreground">{b.partner_name}</span>
                </div>
                <p className="font-semibold text-foreground">{b.title}</p>
                {b.value_label && (
                  <Badge className="mt-2 border-0 bg-primary/10 font-accent text-sm font-bold text-primary">{b.value_label}</Badge>
                )}
                <div className="mt-4 flex gap-2 border-t border-border pt-3">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)} className="gap-1">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                  {(b.status ?? "active") === "active" ? (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: "pause", benefit: b })} className="gap-1">
                      <Pause className="h-3.5 w-3.5" /> Pausar
                    </Button>
                  ) : (b.status ?? "active") === "paused" ? (
                    <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: "activate", benefit: b })} className="gap-1">
                      <Play className="h-3.5 w-3.5" /> Activar
                    </Button>
                  ) : null}
                  <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: "delete", benefit: b })} className="gap-1 text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={(v) => { if (!v) { setModalOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? "Editar Beneficio" : "Agregar Beneficio"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="partner_name" render={({ field }) => (
                  <FormItem><FormLabel>Nombre del partner *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="partner_logo_url" render={({ field }) => (
                  <FormItem><FormLabel>URL logo partner</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Título *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="value_label" render={({ field }) => (
                  <FormItem><FormLabel>Value label * (ej: 30% OFF)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Categoría</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="redeem_type" render={({ field }) => (
                  <FormItem><FormLabel>Tipo de canje</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                      <SelectContent>{REDEEM_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="redeem_value" render={({ field }) => (
                  <FormItem><FormLabel>Valor de canje</FormLabel><FormControl><Input {...field} placeholder="Código, URL o email" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="valid_until" render={({ field }) => (
                  <FormItem><FormLabel>Válido hasta</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Estado</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="paused">Pausado</SelectItem>
                        <SelectItem value="deleted">Eliminado</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="redeem_instructions" render={({ field }) => (
                <FormItem><FormLabel>Instrucciones de canje</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="is_featured" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">Destacado</FormLabel>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setEditing(null); }}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete" ? "¿Eliminar?" : confirmAction?.type === "pause" ? "¿Pausar?" : "¿Activar?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? "El beneficio se marcará como eliminado."
                : confirmAction?.type === "pause"
                  ? "El beneficio no será visible temporalmente."
                  : "El beneficio volverá a estar visible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!confirmAction) return;
              const status = confirmAction.type === "delete" ? "deleted" : confirmAction.type === "pause" ? "paused" : "active";
              changeStatus.mutate({ id: confirmAction.benefit.id, status });
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

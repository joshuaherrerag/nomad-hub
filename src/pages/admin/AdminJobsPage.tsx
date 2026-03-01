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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, Pencil, Pause, Play, Trash2, Plus, RefreshCw, Search, Briefcase } from "lucide-react";

const CATEGORIES = ["Desarrollo", "Diseño", "Marketing", "Producto", "Data", "DevOps", "Soporte", "Ventas", "Otro"];
const SENIORITIES = ["Junior", "Mid", "Senior", "Lead", "Manager"];
const CONTRACT_TYPES = ["fulltime", "contract", "parttime", "freelance", "internship"];
const SOURCES = ["nestify", "remotive", "weworkremotely", "remoteok", "jobicy", "arc"];

const PAGE_SIZE = 25;

const jobSchema = z.object({
  title: z.string().min(1, "Requerido"),
  company_name: z.string().min(1, "Requerido"),
  company_logo_url: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  seniority: z.string().optional(),
  contract_type: z.string().optional(),
  salary_min: z.coerce.number().optional(),
  salary_max: z.coerce.number().optional(),
  currency: z.string().optional(),
  source_url: z.string().optional(),
  is_featured: z.boolean().optional(),
  status: z.string().optional(),
});

type JobForm = z.infer<typeof jobSchema>;

export default function AdminJobsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [featuredFilter, setFeaturedFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [previewJob, setPreviewJob] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: string; job: any } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const form = useForm<JobForm>({
    resolver: zodResolver(jobSchema),
    defaultValues: { currency: "USD", status: "active", is_featured: false },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "jobs", page, search, sourceFilter, statusFilter, featuredFilter],
    queryFn: async () => {
      let q = supabase.from("jobs").select("*", { count: "exact" });
      if (search) q = q.or(`title.ilike.%${search}%,company_name.ilike.%${search}%`);
      if (sourceFilter !== "all") q = q.eq("source", sourceFilter);
      if (statusFilter !== "all") q = q.eq("status", statusFilter);
      if (featuredFilter === "featured") q = q.eq("is_featured", true);
      q = q.order("published_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { jobs: data ?? [], total: count ?? 0 };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (values: JobForm) => {
      const payload = { ...values, source: "nestify" } as any;
      if (editingJob) {
        const { error } = await supabase.from("jobs").update(payload).eq("id", editingJob.id);
        if (error) throw error;
        await logAdminAction("update_job", "job", editingJob.id, payload);
      } else {
        const { data, error } = await supabase.from("jobs").insert(payload).select().single();
        if (error) throw error;
        await logAdminAction("create_job", "job", data.id, payload);
      }
    },
    onSuccess: () => {
      toast.success(editingJob ? "Empleo actualizado" : "Empleo creado");
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
      setModalOpen(false);
      setEditingJob(null);
      form.reset({ currency: "USD", status: "active", is_featured: false });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const { error } = await supabase.from("jobs").update({ is_featured: !featured }).eq("id", id);
      if (error) throw error;
      await logAdminAction(featured ? "unfeature_job" : "feature_job", "job", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "jobs"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const changeStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("jobs").update({ status }).eq("id", id);
      if (error) throw error;
      await logAdminAction(`${status}_job`, "job", id);
    },
    onSuccess: () => {
      toast.success("Estado actualizado");
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
      setConfirmAction(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await supabase.functions.invoke("sync-remotive");
      if (res.error) throw res.error;
      toast.success(`Se sincronizaron ${res.data?.synced ?? 0} empleos`);
      qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
    } catch (e: any) {
      toast.error(e.message ?? "Error al sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  const openEdit = (job: any) => {
    setEditingJob(job);
    form.reset({
      title: job.title,
      company_name: job.company_name,
      company_logo_url: job.company_logo_url ?? "",
      description: job.description ?? "",
      category: job.category ?? "",
      seniority: job.seniority ?? "",
      contract_type: job.contract_type ?? "",
      salary_min: job.salary_min ?? undefined,
      salary_max: job.salary_max ?? undefined,
      currency: job.currency ?? "USD",
      source_url: job.source_url ?? "",
      is_featured: job.is_featured ?? false,
      status: job.status ?? "active",
    });
    setModalOpen(true);
  };

  const openCreate = () => {
    setEditingJob(null);
    form.reset({ currency: "USD", status: "active", is_featured: false });
    setModalOpen(true);
  };

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge className="border-0 bg-accent/20 text-accent">Activo</Badge>;
    if (status === "paused") return <Badge className="border-0 bg-secondary/20 text-secondary">Pausado</Badge>;
    return <Badge className="border-0 bg-destructive/20 text-destructive">Eliminado</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Gestión de Empleos</h1>
        <div className="flex gap-2">
          <Button onClick={openCreate} className="rounded-full gap-2">
            <Plus className="h-4 w-4" /> Agregar empleo
          </Button>
          <Button variant="outline" onClick={handleSync} disabled={syncing} className="rounded-full gap-2">
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} /> Sincronizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Fuente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="deleted">Eliminado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={featuredFilter} onValueChange={(v) => { setFeaturedFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Destacados" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="featured">Destacados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : data?.jobs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Briefcase className="mb-2 h-12 w-12 text-border" />
            <p>No se encontraron empleos</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="hidden md:table-cell">Fuente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden sm:table-cell">Featured</TableHead>
                <TableHead className="hidden lg:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.jobs.map((job: any) => {
                const initials = job.company_name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();
                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {job.company_logo_url ? (
                          <img src={job.company_logo_url} alt="" className="h-8 w-8 rounded-lg object-contain" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{initials}</div>
                        )}
                        <span className="text-sm font-medium hidden sm:inline">{job.company_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{job.title}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{job.source ?? "nestify"}</Badge>
                    </TableCell>
                    <TableCell>{statusBadge(job.status ?? "active")}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Switch
                        checked={!!job.is_featured}
                        onCheckedChange={() => toggleFeatured.mutate({ id: job.id, featured: !!job.is_featured })}
                        aria-label="Toggle destacado"
                      />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {job.published_at ? new Date(job.published_at).toLocaleDateString("es") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setPreviewJob(job)} aria-label="Ver empleo">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(job)} aria-label="Editar empleo">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {(job.status ?? "active") === "active" ? (
                          <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: "pause", job })} aria-label="Pausar empleo">
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (job.status ?? "active") === "paused" ? (
                          <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: "activate", job })} aria-label="Activar empleo">
                            <Play className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: "delete", job })} aria-label="Eliminar empleo">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{data?.total} empleos</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewJob} onOpenChange={() => setPreviewJob(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{previewJob?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p><strong>Empresa:</strong> {previewJob?.company_name}</p>
            <p><strong>Categoría:</strong> {previewJob?.category ?? "—"}</p>
            <p><strong>Seniority:</strong> {previewJob?.seniority ?? "—"}</p>
            <p><strong>Contrato:</strong> {previewJob?.contract_type ?? "—"}</p>
            <p><strong>Salario:</strong> {previewJob?.salary_min || previewJob?.salary_max ? `${previewJob.salary_min ?? "?"} - ${previewJob.salary_max ?? "?"} ${previewJob.currency}` : "—"}</p>
            {previewJob?.description && <div className="prose prose-sm max-w-none text-foreground" dangerouslySetInnerHTML={{ __html: previewJob.description }} />}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={modalOpen} onOpenChange={(v) => { if (!v) { setModalOpen(false); setEditingJob(null); } }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingJob ? "Editar Empleo" : "Agregar Empleo"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Título *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company_name" render={({ field }) => (
                  <FormItem><FormLabel>Empresa *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="company_logo_url" render={({ field }) => (
                  <FormItem><FormLabel>URL logo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem><FormLabel>Categoría</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                      <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="seniority" render={({ field }) => (
                  <FormItem><FormLabel>Seniority</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                      <SelectContent>{SENIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contract_type" render={({ field }) => (
                  <FormItem><FormLabel>Tipo contrato</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                      <SelectContent>{CONTRACT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="salary_min" render={({ field }) => (
                  <FormItem><FormLabel>Salario mín</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="salary_max" render={({ field }) => (
                  <FormItem><FormLabel>Salario máx</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="currency" render={({ field }) => (
                  <FormItem><FormLabel>Moneda</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="source_url" render={({ field }) => (
                  <FormItem><FormLabel>URL oferta</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="is_featured" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="!mt-0">Destacado</FormLabel>
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setEditingJob(null); }}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete" ? "¿Eliminar este empleo?" : confirmAction?.type === "pause" ? "¿Pausar este empleo?" : "¿Activar este empleo?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete"
                ? "El empleo se marcará como eliminado y no será visible para los usuarios."
                : confirmAction?.type === "pause"
                  ? "El empleo se pausará y no será visible temporalmente."
                  : "El empleo volverá a ser visible para los usuarios."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!confirmAction) return;
              const status = confirmAction.type === "delete" ? "deleted" : confirmAction.type === "pause" ? "paused" : "active";
              changeStatus.mutate({ id: confirmAction.job.id, status });
            }}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

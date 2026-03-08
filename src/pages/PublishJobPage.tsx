import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2 } from "lucide-react";

const CATEGORIES = ["Desarrollo", "Diseño", "Marketing", "Datos", "Negocios", "Contenido", "Otro"];
const CONTRACT_TYPES = [
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "contract", label: "Contrato" },
  { value: "freelance", label: "Freelance" },
];
const SENIORITIES = ["Junior", "Mid", "Senior", "Lead"];
const CURRENCIES = ["USD", "EUR", "ARS", "MXN", "CLP", "COP", "BRL"];

const schema = z.object({
  title: z.string().min(3, "Mínimo 3 caracteres").max(120, "Máximo 120 caracteres"),
  company_name: z.string().min(2, "Mínimo 2 caracteres").max(80, "Máximo 80 caracteres"),
  company_logo_url: z.string().url("URL inválida").or(z.literal("")).optional(),
  category: z.string().min(1, "Selecciona una categoría"),
  contract_type: z.string().min(1, "Selecciona un tipo"),
  seniority: z.string().optional(),
  description: z.string().min(20, "Mínimo 20 caracteres").max(5000, "Máximo 5000 caracteres"),
  salary_min: z.coerce.number().min(0).optional().or(z.literal(0)),
  salary_max: z.coerce.number().min(0).optional().or(z.literal(0)),
  currency: z.string().default("USD"),
  source_url: z.string().url("URL inválida").or(z.literal("")).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function PublishJobPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      company_name: "",
      company_logo_url: "",
      category: "",
      contract_type: "",
      seniority: "",
      description: "",
      salary_min: undefined,
      salary_max: undefined,
      currency: "USD",
      source_url: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    try {
      const { error } = await (supabase as any).from("jobs").insert({
        title: values.title,
        company_name: values.company_name,
        company_logo_url: values.company_logo_url || null,
        category: values.category,
        contract_type: values.contract_type,
        seniority: values.seniority || null,
        description: values.description,
        salary_min: values.salary_min || null,
        salary_max: values.salary_max || null,
        currency: values.currency,
        source_url: values.source_url || null,
        source: "nestify",
        status: "active",
        posted_by: user.id,
        published_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Empleo publicado ✓");
      navigate("/empleos");
    } catch (err: any) {
      toast.error(err.message || "Error al publicar");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 gap-1.5 text-muted-foreground" onClick={() => navigate("/empleos")}>
          <ArrowLeft className="h-4 w-4" /> Volver a empleos
        </Button>
        <h1 className="font-display text-2xl font-bold text-foreground">Publicar empleo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completa los datos de la oferta de trabajo</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem>
              <FormLabel>Título del puesto *</FormLabel>
              <FormControl><Input {...field} placeholder="Ej: Senior Frontend Developer" /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="company_name" render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa *</FormLabel>
                <FormControl><Input {...field} placeholder="Nombre de la empresa" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="company_logo_url" render={({ field }) => (
              <FormItem>
                <FormLabel>Logo de la empresa (URL)</FormLabel>
                <FormControl><Input {...field} placeholder="https://..." /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="contract_type" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de contrato *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CONTRACT_TYPES.map((ct) => <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="seniority" render={({ field }) => (
              <FormItem>
                <FormLabel>Seniority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {SENIORITIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción *</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Describe el puesto, requisitos, beneficios…" rows={6} className="resize-none" maxLength={5000} />
              </FormControl>
              <p className="text-right text-xs text-muted-foreground">{5000 - (field.value?.length ?? 0)} caracteres</p>
              <FormMessage />
            </FormItem>
          )} />

          {/* Salary */}
          <div>
            <FormLabel>Rango salarial</FormLabel>
            <div className="mt-1.5 grid grid-cols-3 gap-3">
              <FormField control={form.control} name="salary_min" render={({ field }) => (
                <FormItem>
                  <FormControl><Input {...field} type="number" placeholder="Mínimo" value={field.value ?? ""} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="salary_max" render={({ field }) => (
                <FormItem>
                  <FormControl><Input {...field} type="number" placeholder="Máximo" value={field.value ?? ""} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>
          </div>

          <FormField control={form.control} name="source_url" render={({ field }) => (
            <FormItem>
              <FormLabel>Link externo (opcional)</FormLabel>
              <FormControl><Input {...field} placeholder="https://empresa.com/careers/..." /></FormControl>
              <FormMessage />
            </FormItem>
          )} />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate("/empleos")}>Cancelar</Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="gap-1.5">
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Publicar empleo
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { logAdminAction } from "@/lib/adminLog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Eye, Shield, Ban, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica", "Cuba",
  "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua",
  "Panamá", "Paraguay", "Perú", "República Dominicana", "Uruguay", "Venezuela",
];

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [confirmAction, setConfirmAction] = useState<{ type: string; user: any; currentRole?: string } | null>(null);

  // Fetch auth user emails via edge function
  const { data: authUsers } = useQuery({
    queryKey: ["admin", "authUsers"],
    queryFn: async () => {
      const res = await supabase.functions.invoke("get-users");
      if (res.error) throw res.error;
      return (res.data ?? []) as Array<{ id: string; email: string; created_at: string }>;
    },
  });

  const emailMap = new Map((authUsers ?? []).map((u) => [u.id, u]));

  // Fetch profiles
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, search, countryFilter, availabilityFilter],
    queryFn: async () => {
      let q = supabase.from("profiles").select("*", { count: "exact" });
      if (search) q = q.ilike("full_name", `%${search}%`);
      if (countryFilter !== "all") q = q.eq("location_country", countryFilter);
      if (availabilityFilter !== "all") q = q.eq("availability", availabilityFilter);
      q = q.order("created_at", { ascending: false }).range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
      const { data, count, error } = await q;
      if (error) throw error;
      return { profiles: data ?? [], total: count ?? 0 };
    },
  });

  // Fetch user roles
  const { data: allRoles } = useQuery({
    queryKey: ["admin", "userRoles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*") as any;
      return (data ?? []) as Array<{ user_id: string; role: string }>;
    },
  });

  const roleMap = new Map((allRoles ?? []).map((r) => [r.user_id, r.role]));

  const toggleRole = useMutation({
    mutationFn: async ({ userId, currentRole }: { userId: string; currentRole: string | undefined }) => {
      if (currentRole === "admin") {
        const { error } = await (supabase as any).from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
        if (error) throw error;
        await logAdminAction("remove_admin", "user", userId);
      } else {
        const { error } = await (supabase as any).from("user_roles").insert({ user_id: userId, role: "admin" });
        if (error) throw error;
        await logAdminAction("grant_admin", "user", userId);
      }
    },
    onSuccess: () => {
      toast.success("Rol actualizado");
      qc.invalidateQueries({ queryKey: ["admin", "userRoles"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const suspendUser = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase.from("profiles").update({ availability: "unavailable" }).eq("id", userId);
      if (error) throw error;
      await logAdminAction("suspend_user", "user", userId);
    },
    onSuccess: () => {
      toast.success("Usuario suspendido");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setConfirmAction(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredProfiles = roleFilter === "all"
    ? data?.profiles
    : data?.profiles.filter((p) => {
        const role = roleMap.get(p.id);
        return roleFilter === "admin" ? role === "admin" : role !== "admin";
      });

  const totalPages = Math.ceil((data?.total ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
          <Badge className="border-0 bg-accent/20 text-accent">{data?.total ?? 0} miembros</Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nombre..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-9" />
        </div>
        <Select value={countryFilter} onValueChange={(v) => { setCountryFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="País" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={availabilityFilter} onValueChange={(v) => { setAvailabilityFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Disponibilidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Disponible</SelectItem>
            <SelectItem value="projects">Para proyectos</SelectItem>
            <SelectItem value="unavailable">No disponible</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Rol" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Miembro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : !filteredProfiles || filteredProfiles.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Users className="mb-2 h-12 w-12 text-border" />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden sm:table-cell">País</TableHead>
                <TableHead className="hidden lg:table-cell">Disponibilidad</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead className="hidden lg:table-cell">Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.map((p) => {
                const authUser = emailMap.get(p.id);
                const role = roleMap.get(p.id);
                const initials = p.full_name
                  ? p.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                  : "?";
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.avatar_url ? (
                          <img src={p.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials}</div>
                        )}
                        <span className="font-medium">{p.full_name || "Sin nombre"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {authUser?.email ?? "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{p.location_country ?? "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{p.availability ?? "—"}</TableCell>
                    <TableCell>
                      {role === "admin" ? (
                        <Badge className="border-0 bg-primary/20 text-primary text-xs">Admin</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Miembro</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString("es") : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/perfil/${p.id}`)} aria-label="Ver perfil">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmAction({ type: "role", user: p, currentRole: role })}
                          aria-label={role === "admin" ? "Quitar admin" : "Hacer admin"}
                          title={role === "admin" ? "Quitar admin" : "Hacer admin"}
                        >
                          <Shield className={`h-4 w-4 ${role === "admin" ? "text-primary" : ""}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmAction({ type: "suspend", user: p })}
                          aria-label="Suspender usuario"
                        >
                          <Ban className="h-4 w-4 text-destructive" />
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
          <p className="text-sm text-muted-foreground">{data?.total} usuarios</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Siguiente</Button>
          </div>
        </div>
      )}

      {/* Confirm Action Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "role"
                ? confirmAction?.currentRole === "admin"
                  ? `¿Quitar rol de admin a ${confirmAction?.user?.full_name || "este usuario"}?`
                  : `¿Hacer admin a ${confirmAction?.user?.full_name || "este usuario"}?`
                : `¿Suspender a ${confirmAction?.user?.full_name}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "role"
                ? confirmAction?.currentRole === "admin"
                  ? "Este usuario perderá acceso al panel de administración."
                  : "Este usuario tendrá acceso completo al panel de administración y podrá gestionar empleos, beneficios y usuarios."
                : "Su disponibilidad se cambiará a \"no disponible\". El usuario seguirá teniendo acceso a la plataforma."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (!confirmAction?.user) return;
              if (confirmAction.type === "role") {
                toggleRole.mutate({ userId: confirmAction.user.id, currentRole: confirmAction.currentRole });
              } else {
                suspendUser.mutate(confirmAction.user.id);
              }
              setConfirmAction(null);
            }}>
              {confirmAction?.type === "role"
                ? confirmAction?.currentRole === "admin" ? "Quitar admin" : "Hacer admin"
                : "Suspender"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

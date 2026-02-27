import { useState } from "react";
import { useMembers, type MemberFilters } from "@/hooks/useMembers";
import MemberCard from "@/components/members/MemberCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users } from "lucide-react";

const COUNTRIES = [
  "Argentina", "Bolivia", "Brasil", "Chile", "Colombia", "Costa Rica",
  "Ecuador", "El Salvador", "Guatemala", "Honduras", "México", "Nicaragua",
  "Panamá", "Paraguay", "Perú", "Puerto Rico", "Rep. Dominicana",
  "Uruguay", "Venezuela",
];

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Disponible" },
  { value: "freelance", label: "Para proyectos" },
];

export default function MembersPage() {
  const [filters, setFilters] = useState<MemberFilters>({
    search: "",
    country: "",
    availability: "all",
  });

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useMembers(filters);

  const members = data?.pages.flatMap((p) => p.members) ?? [];
  const totalShown = members.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-foreground">Comunidad</h1>
          {totalShown > 0 && (
            <Badge className="border-0 bg-accent/10 text-accent font-medium">
              {totalShown} miembros
            </Badge>
          )}
        </div>
        <p className="mt-1 text-muted-foreground">Nómadas digitales de toda Latam.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre…"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.country || "all_countries"}
          onValueChange={(v) =>
            setFilters((f) => ({ ...f, country: v === "all_countries" ? "" : v }))
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="País" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_countries">Todos los países</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filters.availability}
          onValueChange={(v) => setFilters((f) => ({ ...f, availability: v }))}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Disponibilidad" />
          </SelectTrigger>
          <SelectContent>
            {AVAILABILITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="h-12 w-12 text-border" />
          <p className="mt-4 text-muted-foreground">No encontramos miembros.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {members.map((m) => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Cargando…" : "Ver más"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

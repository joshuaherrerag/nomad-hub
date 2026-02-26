import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, SearchX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useJobs, useSavedJobs, useToggleSaveJob, type JobFilters } from "@/hooks/useJobs";
import JobListCard from "@/components/jobs/JobListCard";

const CATEGORIES = ["Desarrollo", "Diseño", "Marketing", "Datos", "Negocios", "Contenido", "Otro"];
const CONTRACT_TYPES = [
  { value: "fulltime", label: "Full-time" },
  { value: "parttime", label: "Part-time" },
  { value: "contract", label: "Contrato" },
  { value: "freelance", label: "Freelance" },
];
const SENIORITIES = ["Junior", "Mid", "Senior", "Lead"];

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [contractTypes, setContractTypes] = useState<string[]>([]);
  const [seniorities, setSeniorities] = useState<string[]>([]);
  const [sort, setSort] = useState<JobFilters["sort"]>("recent");

  const filters: JobFilters = useMemo(
    () => ({
      search: search || undefined,
      categories: categories.length ? categories : undefined,
      contractTypes: contractTypes.length ? contractTypes : undefined,
      seniorities: seniorities.length ? seniorities : undefined,
      sort,
    }),
    [search, categories, contractTypes, seniorities, sort]
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useJobs(filters);
  const { data: savedSet } = useSavedJobs();
  const toggleSave = useToggleSaveJob();

  const jobs = data?.pages.flatMap((p) => p.data) ?? [];

  const hasFilters = categories.length > 0 || contractTypes.length > 0 || seniorities.length > 0 || !!search;

  const clearFilters = () => {
    setSearch("");
    setCategories([]);
    setContractTypes([]);
    setSeniorities([]);
  };

  const activeChips = [
    ...categories.map((c) => ({ label: c, remove: () => setCategories((p) => p.filter((x) => x !== c)) })),
    ...contractTypes.map((c) => {
      const found = CONTRACT_TYPES.find((ct) => ct.value === c);
      return { label: found?.label ?? c, remove: () => setContractTypes((p) => p.filter((x) => x !== c)) };
    }),
    ...seniorities.map((c) => ({ label: c, remove: () => setSeniorities((p) => p.filter((x) => x !== c)) })),
  ];

  const toggle = (arr: string[], val: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const filterContent = (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar empleo o empresa..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Categoría</h4>
        <div className="space-y-2">
          {CATEGORIES.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox checked={categories.includes(c)} onCheckedChange={() => toggle(categories, c, setCategories)} />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Tipo contrato</h4>
        <div className="space-y-2">
          {CONTRACT_TYPES.map((ct) => (
            <label key={ct.value} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox checked={contractTypes.includes(ct.value)} onCheckedChange={() => toggle(contractTypes, ct.value, setContractTypes)} />
              {ct.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Seniority</h4>
        <div className="space-y-2">
          {SENIORITIES.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Checkbox checked={seniorities.includes(s)} onCheckedChange={() => toggle(seniorities, s, setSeniorities)} />
              {s}
            </label>
          ))}
        </div>
      </div>

      {hasFilters && (
        <Button variant="link" size="sm" className="px-0 text-primary" onClick={clearFilters}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden w-72 shrink-0 lg:block">{filterContent}</aside>

      {/* Main */}
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold text-foreground">Empleos</h1>
            {/* Mobile filter button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" /> Filtrar
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtros</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{filterContent}</div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {isLoading ? "..." : `${jobs.length} empleos encontrados`}
            </span>
            <Select value={sort} onValueChange={(v) => setSort(v as JobFilters["sort"])}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="salary">Mejor pago</SelectItem>
                <SelectItem value="featured">Destacados primero</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active chips */}
        {activeChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <Badge key={chip.label} variant="secondary" className="gap-1 pr-1">
                {chip.label}
                <button onClick={chip.remove} className="ml-1 rounded-full p-0.5 hover:bg-muted">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Job list */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchX className="mb-4 h-12 w-12 text-border" />
            <p className="mb-4 text-lg font-medium text-muted-foreground">No hay empleos con esos filtros.</p>
            <Button onClick={clearFilters}>Limpiar filtros</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {jobs.map((job) => (
                <JobListCard
                  key={job.id}
                  job={job}
                  saved={savedSet?.has(job.id) ?? false}
                  onToggleSave={() => toggleSave.mutate({ jobId: job.id, saved: savedSet?.has(job.id) ?? false })}
                />
              ))}
            </div>
            {hasNextPage && (
              <div className="mt-6 text-center">
                <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? "Cargando..." : "Cargar más"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

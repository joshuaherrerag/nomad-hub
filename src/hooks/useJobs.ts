import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface JobFilters {
  search?: string;
  categories?: string[];
  contractTypes?: string[];
  seniorities?: string[];
  sort?: "recent" | "salary" | "featured";
}

const PAGE_SIZE = 15;

export function useJobs(filters: JobFilters) {
  return useInfiniteQuery({
    queryKey: ["jobs", filters],
    queryFn: async ({ pageParam = 0 }) => {
      let q = supabase.from("jobs").select("*").eq("status", "active");

      if (filters.search) {
        q = q.or(`title.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
      }
      if (filters.categories?.length) {
        q = q.in("category", filters.categories);
      }
      if (filters.contractTypes?.length) {
        q = q.in("contract_type", filters.contractTypes);
      }
      if (filters.seniorities?.length) {
        q = q.in("seniority", filters.seniorities);
      }

      if (filters.sort === "salary") {
        q = q.order("salary_max", { ascending: false, nullsFirst: false });
      } else if (filters.sort === "featured") {
        q = q.order("is_featured", { ascending: false, nullsFirst: false }).order("published_at", { ascending: false });
      } else {
        q = q.order("published_at", { ascending: false });
      }

      q = q.range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      const { data, error } = await q;
      if (error) throw error;
      return { data: data ?? [], nextPage: (data?.length ?? 0) === PAGE_SIZE ? pageParam + 1 : undefined };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

export function useJobDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["job", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("jobs").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });
}

export function useSavedJobs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["savedJobs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_jobs").select("job_id").eq("profile_id", user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.job_id));
    },
  });
}

export function useToggleSaveJob() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ jobId, saved }: { jobId: string; saved: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (saved) {
        const { error } = await supabase.from("saved_jobs").delete().eq("profile_id", user.id).eq("job_id", jobId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("saved_jobs").insert({ profile_id: user.id, job_id: jobId });
        if (error) throw error;
      }
    },
    onMutate: async ({ jobId, saved }) => {
      await qc.cancelQueries({ queryKey: ["savedJobs", user?.id] });
      const prev = qc.getQueryData<Set<string>>(["savedJobs", user?.id]);
      qc.setQueryData<Set<string>>(["savedJobs", user?.id], (old) => {
        const next = new Set(old);
        saved ? next.delete(jobId) : next.add(jobId);
        return next;
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["savedJobs", user?.id], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["savedJobs", user?.id] });
      qc.invalidateQueries({ queryKey: ["stats", "savedJobs"] });
    },
  });
}

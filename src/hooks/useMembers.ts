import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 24;

export interface MemberFilters {
  search: string;
  country: string;
  availability: string;
}

export interface MemberProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  title: string | null;
  location_city: string | null;
  location_country: string | null;
  availability: string | null;
  skills: string[];
}

export function useMembers(filters: MemberFilters) {
  return useInfiniteQuery({
    queryKey: ["members", filters],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("profiles")
        .select("id, full_name, avatar_url, title, location_city, location_country, availability, created_at")
        .eq("onboarding_completed", true)
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (filters.search.trim()) {
        query = query.ilike("full_name", `%${filters.search.trim()}%`);
      }
      if (filters.country) {
        query = query.eq("location_country", filters.country);
      }
      if (filters.availability && filters.availability !== "all") {
        query = query.eq("availability", filters.availability);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Fetch skills for all returned profiles
      const profileIds = (profiles ?? []).map((p) => p.id);
      let skillsMap: Record<string, string[]> = {};

      if (profileIds.length > 0) {
        const { data: psData } = await supabase
          .from("profile_skills")
          .select("profile_id, skills(name)")
          .in("profile_id", profileIds);

        if (psData) {
          for (const row of psData as any[]) {
            const name = row.skills?.name;
            if (!name) continue;
            if (!skillsMap[row.profile_id]) skillsMap[row.profile_id] = [];
            skillsMap[row.profile_id].push(name);
          }
        }
      }

      const members: MemberProfile[] = (profiles ?? []).map((p) => ({
        id: p.id,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        title: p.title,
        location_city: p.location_city,
        location_country: p.location_country,
        availability: p.availability,
        skills: skillsMap[p.id] ?? [],
      }));

      return { members, page: pageParam };
    },
    getNextPageParam: (lastPage) =>
      lastPage.members.length === PAGE_SIZE ? lastPage.page + 1 : undefined,
  });
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  category: string;
  job_type: string;
  publication_date: string;
  description: string;
  salary: string;
}

function mapCategory(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes("software") || lower.includes("dev") || lower.includes("qa")) return "Desarrollo";
  if (lower.includes("design")) return "Diseño";
  if (lower.includes("marketing")) return "Marketing";
  if (lower.includes("data") || lower.includes("machine")) return "Datos";
  if (lower.includes("business") || lower.includes("sales") || lower.includes("finance")) return "Negocios";
  if (lower.includes("writing") || lower.includes("content")) return "Contenido";
  return "Otro";
}

function mapContractType(jt: string): string {
  const lower = jt.toLowerCase();
  if (lower.includes("full")) return "fulltime";
  if (lower.includes("part")) return "parttime";
  if (lower.includes("contract")) return "contract";
  if (lower.includes("freelance")) return "freelance";
  return "fulltime";
}

function parseSalary(salary: string): { min: number | null; max: number | null } {
  if (!salary) return { min: null, max: null };
  const nums = salary.match(/[\d,]+/g)?.map((n) => parseInt(n.replace(/,/g, ""), 10)) ?? [];
  if (nums.length >= 2) return { min: Math.min(...nums), max: Math.max(...nums) };
  if (nums.length === 1) return { min: nums[0], max: nums[0] };
  return { min: null, max: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const res = await fetch("https://remotive.com/api/remote-jobs?limit=50");
    const json = await res.json();
    const jobs: RemotiveJob[] = json.jobs ?? [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    const rows = jobs.map((j) => {
      const sal = parseSalary(j.salary);
      return {
        title: j.title,
        company_name: j.company_name,
        company_logo_url: j.company_logo || null,
        description: j.description,
        category: mapCategory(j.category),
        contract_type: mapContractType(j.job_type),
        salary_min: sal.min,
        salary_max: sal.max,
        currency: "USD",
        source: "remotive",
        source_url: j.url,
        published_at: j.publication_date,
        is_featured: false,
      };
    });

    const { data, error } = await sb
      .from("jobs")
      .upsert(rows, { onConflict: "source_url", ignoreDuplicates: false })
      .select("id");

    if (error) throw error;

    return new Response(JSON.stringify({ synced: data?.length ?? 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Backfill all professions: for each profession, run fetch-pulse → fetch-library → synthesize-insights in sequence.
// Triggered manually via UI button or callable URL.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const headers = {
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    };

    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "true";
    const start = parseInt(url.searchParams.get("start") || "0", 10);
    const batchSize = parseInt(url.searchParams.get("batch") || "0", 10); // 0 = all

    // Fetch all professions
    const { data: allProfessions, error } = await supabase
      .from("professions")
      .select("id, name, field_id, keywords, display_order")
      .order("display_order");

    if (error) throw error;
    if (!allProfessions || allProfessions.length === 0) {
      return new Response(JSON.stringify({ error: "No professions found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const totalCount = allProfessions.length;
    const professions = batchSize > 0
      ? allProfessions.slice(start, start + batchSize)
      : allProfessions;

    const results: Array<{
      profession: string;
      pulse: string;
      library: string;
      synthesis: string;
    }> = [];

    let successCount = 0;
    let failCount = 0;

    for (const prof of professions) {
      const entry: { profession: string; pulse: string; library: string; synthesis: string } = {
        profession: prof.name,
        pulse: "",
        library: "",
        synthesis: "",
      };

      // Step 1: Fetch Pulse (GNews)
      try {
        const pulseResp = await fetch(
          `${supabaseUrl}/functions/v1/fetch-pulse?profession_id=${prof.id}${force ? "&force=true" : ""}`,
          { headers }
        );
        const pulseData = await pulseResp.json().catch(() => ({}));
        if (pulseResp.ok) {
          const diags = pulseData.diagnostics || [];
          const profDiag = diags.find((d: string) => d.startsWith(prof.name)) || diags[0] || "ok";
          entry.pulse = profDiag;
        } else {
          entry.pulse = `error: ${pulseResp.status}`;
        }
      } catch (e) {
        entry.pulse = `error: ${e.message}`;
      }

      // Step 2: Fetch Library (Google Books + arXiv/Semantic Scholar)
      try {
        const libResp = await fetch(
          `${supabaseUrl}/functions/v1/fetch-library?profession_id=${prof.id}${force ? "&force=true" : ""}`,
          { headers }
        );
        const libData = await libResp.json().catch(() => ({}));
        if (libResp.ok) {
          const diags = libData.diagnostics || [];
          const profDiag = diags.find((d: string) => d.startsWith(prof.name)) || diags[0] || "ok";
          entry.library = profDiag;
        } else {
          entry.library = `error: ${libResp.status}`;
        }
      } catch (e) {
        entry.library = `error: ${e.message}`;
      }

      // Step 3: Synthesize insights (Skill Radar) — only after pulse data exists
      try {
        // Verify pulse items exist for this profession before synthesizing
        const { count: pulseCount } = await supabase
          .from("pulse_items")
          .select("id", { count: "exact", head: true })
          .eq("profession_id", prof.id);

        if (!pulseCount || pulseCount === 0) {
          entry.synthesis = "skipped: no pulse items";
        } else {
          const synthResp = await fetch(
            `${supabaseUrl}/functions/v1/synthesize-insights?profession_id=${prof.id}${force ? "&force=true" : ""}`,
            { headers }
          );
          const synthData = await synthResp.json().catch(() => ({}));
          if (synthResp.ok) {
            const diags = synthData.diagnostics || [];
            const profDiag = diags.find((d: string) => d.startsWith(prof.name)) || diags[0] || "ok";
            entry.synthesis = profDiag;
          } else {
            entry.synthesis = `error: ${synthResp.status}`;
          }
        }
      } catch (e) {
        entry.synthesis = `error: ${e.message}`;
      }

      const hasErrors = entry.pulse.startsWith("error") || entry.library.startsWith("error") || entry.synthesis.startsWith("error");
      if (hasErrors) {
        failCount++;
      } else {
        successCount++;
      }

      results.push(entry);
    }

    return new Response(JSON.stringify({
      message: "Backfill batch complete",
      total: totalCount,
      processed: professions.length,
      startIndex: start,
      nextStart: start + professions.length,
      hasMore: start + professions.length < totalCount,
      success: successCount,
      failed: failCount,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

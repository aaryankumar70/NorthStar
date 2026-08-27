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

    const gnewsKey = Deno.env.get("GNEWS_API_KEY");
    if (!gnewsKey) {
      return new Response(JSON.stringify({ error: "GNEWS_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const professionFilter = url.searchParams.get("profession_id");
    const forceRefresh = url.searchParams.get("force") === "true";

    let query = supabase.from("professions").select(`
      id, name, keywords,
      fields!inner(slug)
    `);
    if (professionFilter) {
      query = query.eq("id", professionFilter);
    }
    const { data: professions, error: profError } = await query;

    if (profError) throw profError;
    if (!professions || professions.length === 0) {
      return new Response(JSON.stringify({ message: "No professions found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    let totalInserted = 0;
    const diagnostics: string[] = [];

    // GNews free plan has a 12-hour delay on real-time articles.
    // Request articles from 7 days ago to yesterday to stay within the free tier.
    const now = new Date();
    const toDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const toDateStr = toDate.toISOString().split("T")[0];
    const fromDateStr = fromDate.toISOString().split("T")[0];

    for (let i = 0; i < professions.length; i++) {
      const prof = professions[i];

      const { data: existing } = await supabase
        .from("pulse_items")
        .select("id")
        .eq("profession_id", prof.id)
        .eq("fetched_date", today)
        .limit(1);

      if (existing && existing.length > 0 && !forceRefresh) {
        diagnostics.push(`${prof.name}: already has today's data, skipping`);
        continue;
      }

      // Try profession name first, then fall back to first keyword if no results
      // Sanitize: GNews query syntax doesn't support special chars like / and -
      const sanitizeTerm = (t: string) => t.replace(/[/()\\\"\-]/g, " ").replace(/\s+/g, " ").trim();
      const searchTerms = [prof.name, ...(prof.keywords || []).slice(0, 1)].map(sanitizeTerm).filter((t) => t.length > 0);
      let articles: any[] = [];
      let usedTerm = "";

      for (const term of searchTerms) {
        const gnewsUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(term)}&lang=en&max=10&from=${fromDateStr}&to=${toDateStr}&sortby=publishedat&apikey=${gnewsKey}`;
        const gnewsResp = await fetch(gnewsUrl);
        if (!gnewsResp.ok) {
          const errBody = await gnewsResp.text();
          diagnostics.push(`${prof.name}: GNews ${gnewsResp.status} for "${term}": ${errBody.slice(0, 150)}`);
          if (gnewsResp.status === 429) {
            diagnostics.push("Rate limited — stopping");
            break;
          }
          continue;
        }
        const gnewsData = await gnewsResp.json();
        articles = gnewsData.articles || [];
        if (articles.length > 0) {
          usedTerm = term;
          break;
        }
        // 1-second delay between GNews requests to respect rate limit
        await new Promise((r) => setTimeout(r, 1100));
      }

      if (articles.length === 0) {
        diagnostics.push(`${prof.name}: no articles found from any query`);
        continue;
      }

      diagnostics.push(`${prof.name}: found ${articles.length} articles using "${usedTerm}"`);

      // When force-refreshing, delete ALL items (including today's) so we get fresh data.
      // Otherwise, only delete old (non-today) items.
      if (forceRefresh) {
        await supabase
          .from("pulse_items")
          .delete()
          .eq("profession_id", prof.id);
      } else {
        await supabase
          .from("pulse_items")
          .delete()
          .eq("profession_id", prof.id)
          .neq("fetched_date", today);
      }

      const rows = articles.map((a: any) => ({
        profession_id: prof.id,
        headline: a.title,
        summary: a.description || "",
        source: a.source?.name || "Unknown",
        source_url: a.url,
        published_date: a.publishedAt ? a.publishedAt.split("T")[0] : today,
        fetched_date: today,
        why_it_matters: null,
      }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from("pulse_items")
          .upsert(rows, { onConflict: "profession_id,headline,fetched_date", ignoreDuplicates: true });
        if (insertError) {
          diagnostics.push(`${prof.name}: insert error: ${insertError.message}`);
        } else {
          totalInserted += rows.length;
        }
      }

      // GNews free tier: 1 request per second
      if (i < professions.length - 1) {
        await new Promise((r) => setTimeout(r, 1100));
      }
    }

    return new Response(JSON.stringify({
      message: "Pulse fetch complete",
      professions_processed: professions.length,
      items_inserted: totalInserted,
      diagnostics,
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

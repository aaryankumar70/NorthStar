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

    const googleBooksKey = Deno.env.get("GOOGLE_BOOKS_API_KEY");
    const githubToken = Deno.env.get("GITHUB_TOKEN");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    const url = new URL(req.url);
    const professionFilter = url.searchParams.get("profession_id");
    const forceRefresh = url.searchParams.get("force") === "true";

    let query = supabase.from("professions").select(`
      id, name, keywords,
      fields!inner(slug, name)
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

    for (const prof of professions) {
      const fieldSlug = (prof.fields as any)?.slug;

      // Check if we already have data for today
      const { data: existing } = await supabase
        .from("library_items")
        .select("id")
        .eq("profession_id", prof.id)
        .eq("fetched_date", today)
        .limit(1);

      if (existing && existing.length > 0 && !forceRefresh) {
        diagnostics.push(`${prof.name}: already has today's data, skipping`);
        continue;
      }

      // When force-refreshing, delete ALL items (including today's) so we get fresh data.
      // Otherwise, only delete old (non-today) items.
      if (forceRefresh) {
        await supabase
          .from("library_items")
          .delete()
          .eq("profession_id", prof.id);
      } else {
        await supabase
          .from("library_items")
          .delete()
          .eq("profession_id", prof.id)
          .neq("fetched_date", today);
      }

      // --- BOOKS (Google Books API) ---
      if (googleBooksKey) {
        const bookQuery = `${prof.name} ${prof.keywords[0] || ""}`;
        const booksUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(bookQuery)}&maxResults=5&key=${googleBooksKey}`;
        try {
          const booksResp = await fetch(booksUrl);
          if (booksResp.ok) {
            const booksData = await booksResp.json();
            const bookRows = (booksData.items || []).slice(0, 5).map((item: any) => ({
              profession_id: prof.id,
              type: "book" as const,
              title: item.volumeInfo?.title || "Unknown",
              author_or_source: (item.volumeInfo?.authors || []).join(", ") || "Unknown",
              why_it_matters: `A relevant read for ${prof.name.toLowerCase()} professionals covering ${prof.keywords[0] || "core topics"}.`,
              url: item.volumeInfo?.infoLink || null,
              fetched_date: today,
            }));
            if (bookRows.length > 0) {
              const { error } = await supabase.from("library_items").upsert(bookRows, { onConflict: "profession_id,title,type,fetched_date", ignoreDuplicates: true });
              if (!error) totalInserted += bookRows.length;
            }
          }
        } catch (e) {
          diagnostics.push(`${prof.name}: books error: ${e.message}`);
        }
      }

      // --- PAPERS ---
      // arXiv for IT/CS, OpenAlex for everything else (OpenAlex also covers IT/CS as fallback)
      let paperRows: any[] = [];

      if (fieldSlug === "it-cs") {
        const arxivQuery = `all:${encodeURIComponent(prof.name + " " + (prof.keywords[0] || ""))}`;
        const arxivUrl = `https://export.arxiv.org/api/query?search_query=${arxivQuery}&max_results=5&sortBy=relevance`;
        try {
          const arxivResp = await fetch(arxivUrl);
          if (arxivResp.ok) {
            const arxivText = await arxivResp.text();
            const entries = parseArxivXml(arxivText);
            paperRows = entries.slice(0, 5).map((e: any) => ({
              profession_id: prof.id,
              type: "paper" as const,
              title: e.title,
              author_or_source: e.authors,
              why_it_matters: `Recent research relevant to ${prof.keywords[0] || prof.name.toLowerCase()}.`,
              url: e.link,
              fetched_date: today,
            }));
          }
        } catch (e) {
          diagnostics.push(`${prof.name}: arXiv error: ${e.message}`);
        }
      }

      // Fallback: OpenAlex API (no key needed, generous rate limits, covers all fields)
      if (paperRows.length === 0) {
        const oaQuery = `${prof.name} ${prof.keywords[0] || ""}`;
        const oaUrl = `https://api.openalex.org/works?search=${encodeURIComponent(oaQuery)}&per-page=5&select=title,authorships,doi`;
        try {
          const oaResp = await fetch(oaUrl);
          if (oaResp.ok) {
            const oaData = await oaResp.json();
            const works = oaData.results || [];
            paperRows = works.slice(0, 5).map((w: any) => ({
              profession_id: prof.id,
              type: "paper" as const,
              title: w.title || "Untitled",
              author_or_source: (w.authorships || []).slice(0, 3).map((a: any) => a.author?.display_name).filter(Boolean).join(", ") || "Unknown",
              why_it_matters: `Scholarly work relevant to ${prof.keywords[0] || prof.name.toLowerCase()}.`,
              url: w.doi ? `https://doi.org/${w.doi}` : null,
              fetched_date: today,
            }));
          }
        } catch (e) {
          diagnostics.push(`${prof.name}: OpenAlex error: ${e.message}`);
        }
      }

      if (paperRows.length > 0) {
        const { error } = await supabase.from("library_items").upsert(paperRows, { onConflict: "profession_id,title,type,fetched_date", ignoreDuplicates: true });
        if (!error) totalInserted += paperRows.length;
      }

      // --- TOOLS ---
      // For IT/CS: use GitHub trending repos. For others: use Gemini to suggest tools.
      let toolRows: any[] = [];

      if (fieldSlug === "it-cs" && githubToken) {
        const ghQuery = encodeURIComponent(`${prof.name} ${prof.keywords[0] || ""}`);
        const ghUrl = `https://api.github.com/search/repositories?q=${ghQuery}&sort=stars&order=desc&per_page=5`;
        try {
          const ghResp = await fetch(ghUrl, {
            headers: {
              "Authorization": `Bearer ${githubToken}`,
              "Accept": "application/vnd.github.v3+json",
            },
          });
          if (ghResp.ok) {
            const ghData = await ghResp.json();
            const repos = (ghData.items || []).slice(0, 5);
            toolRows = repos.map((r: any) => ({
              profession_id: prof.id,
              type: "tool" as const,
              title: r.full_name,
              author_or_source: `${r.stargazers_count} stars on GitHub`,
              why_it_matters: r.description || `Popular open-source tool for ${prof.name.toLowerCase()}.`,
              url: r.html_url,
              fetched_date: today,
            }));
          }
        } catch (e) {
          diagnostics.push(`${prof.name}: GitHub tools error: ${e.message}`);
        }
      }

      // If no tools from GitHub (non-CS field or GitHub failed), ask Gemini
      if (toolRows.length === 0 && geminiKey) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
        const prompt = `List 5 essential software tools, platforms, or frameworks that a ${prof.name} should know about in 2025. For each, provide:
- name (the tool/platform name)
- description (one sentence describing what it does)
- url (official website if known, or empty string)

Return ONLY a JSON array of objects with keys: name, description, url. No markdown, no commentary.`;

        try {
          const geminiResp = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          });
          if (geminiResp.ok) {
            const geminiData = await geminiResp.json();
            const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              const cleaned = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
              const tools = JSON.parse(cleaned);
              toolRows = (Array.isArray(tools) ? tools : []).slice(0, 5).map((t: any) => ({
                profession_id: prof.id,
                type: "tool" as const,
                title: t.name || "Unknown",
                author_or_source: "AI-recommended",
                why_it_matters: t.description || `Essential tool for ${prof.name.toLowerCase()}.`,
                url: t.url && t.url.startsWith("http") ? t.url : null,
                fetched_date: today,
              }));
            }
          } else {
            diagnostics.push(`${prof.name}: Gemini tools ${geminiResp.status}`);
          }
        } catch (e) {
          diagnostics.push(`${prof.name}: Gemini tools error: ${e.message}`);
        }
      }

      if (toolRows.length > 0) {
        const { error } = await supabase.from("library_items").upsert(toolRows, { onConflict: "profession_id,title,type,fetched_date", ignoreDuplicates: true });
        if (!error) totalInserted += toolRows.length;
        diagnostics.push(`${prof.name}: ${toolRows.length} tools added`);
      }
    }

    return new Response(JSON.stringify({
      message: "Library fetch complete",
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

function parseArxivXml(xml: string): Array<{ title: string; authors: string; link: string }> {
  const entries: Array<{ title: string; authors: string; link: string }> = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null && entries.length < 5) {
    const block = match[1];
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/);
    const title = titleMatch ? titleMatch[1].trim().replace(/\n/g, " ") : "Untitled";
    const authorMatches = [...block.matchAll(/<name>([\s\S]*?)<\/name>/g)];
    const authors = authorMatches.map((m) => m[1].trim()).join(", ") || "Unknown";
    const linkMatch = block.match(/<id>([\s\S]*?)<\/id>/);
    const link = linkMatch ? linkMatch[1].trim() : "";
    entries.push({ title, authors, link });
  }
  return entries;
}

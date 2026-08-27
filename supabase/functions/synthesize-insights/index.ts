// Synthesize insights: uses Gemini to analyze pulse items and generate skill analysis.
// Falls back to keyword-based generation when Gemini quota is exhausted.
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

    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const professionFilter = url.searchParams.get("profession_id");
    const force = url.searchParams.get("force") === "true";

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
    let totalProcessed = 0;
    const diagnostics: string[] = [];

    for (const prof of professions) {
      const fieldSlug = (prof.fields as any)?.slug;

      const { data: existingAsc } = await supabase
        .from("ascending_skills")
        .select("id")
        .eq("profession_id", prof.id)
        .eq("fetched_date", today)
        .limit(1);

      if (existingAsc && existingAsc.length > 0 && !force) {
        diagnostics.push(`${prof.name}: already synthesized today, skipping`);
        continue;
      }

      const { data: pulseItems } = await supabase
        .from("pulse_items")
        .select("id, headline, summary, source")
        .eq("profession_id", prof.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!pulseItems || pulseItems.length === 0) {
        diagnostics.push(`${prof.name}: no pulse items to synthesize from`);
        continue;
      }

      diagnostics.push(`${prof.name}: synthesizing from ${pulseItems.length} pulse items`);

      // For IT/CS, also fetch GitHub trending repos as extra signal
      let githubSignal = "";
      if (fieldSlug === "it-cs") {
        const githubToken = Deno.env.get("GITHUB_TOKEN");
        if (githubToken) {
          try {
            const ghQuery = encodeURIComponent(prof.name + " " + (prof.keywords[0] || ""));
            const ghUrl = `https://api.github.com/search/repositories?q=${ghQuery}&sort=stars&order=desc&per_page=5`;
            const ghResp = await fetch(ghUrl, {
              headers: {
                "Authorization": `Bearer ${githubToken}`,
                "Accept": "application/vnd.github.v3+json",
              },
            });
            if (ghResp.ok) {
              const ghData = await ghResp.json();
              const repos = (ghData.items || []).slice(0, 5);
              if (repos.length > 0) {
                githubSignal = "\n\nGitHub trending repositories for extra context:\n" +
                  repos.map((r: any) => `- ${r.full_name} (${r.stargazers_count} stars): ${r.description || "No description"}`)
                    .join("\n");
              }
            } else {
              diagnostics.push(`${prof.name}: GitHub ${ghResp.status}`);
            }
          } catch (e) {
            diagnostics.push(`${prof.name}: GitHub error: ${e.message}`);
          }
        }
      }

      const headlinesText = pulseItems.map((p: any, i: number) =>
        `${i + 1}. "${p.headline}" — ${p.summary} (Source: ${p.source})`
      ).join("\n");

      const prompt = `You are an industry intelligence analyst for ${prof.name} professionals.
Here are today's news headlines for this profession:

${headlinesText}
${githubSignal}

Based on these headlines and your knowledge of the ${prof.name} field, produce a JSON response with this exact shape:

{
  "pulse_why_it_matters": [
    "one-line reason why headline 1 matters for a ${prof.name}",
    "one-line reason why headline 2 matters"
  ],
  "ascending_skills": [
    {
      "name": "Skill name",
      "description": "One sentence describing what it is",
      "why_rising": "One sentence on why demand is increasing"
    }
  ],
  "fading_skills": [
    {
      "name": "Skill name",
      "why_fading": "One sentence on why demand is decreasing",
      "still_useful_for": "One sentence on where it is still relevant",
      "modern_alternative": "A modern skill or tool that replaces it"
    }
  ]
}

Provide 3-4 ascending skills and 2-3 fading skills. Provide one entry in pulse_why_it_matters per headline, in order.
Return ONLY valid JSON, no markdown fences, no commentary.`;

      // Try Gemini with retry logic for rate limits (429)
      const models = ["gemini-flash-latest", "gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];
      let geminiData: any = null;
      let geminiError: string = "";
      let usedModel = "";

      for (const model of models) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

        // Retry up to 2 times with backoff for rate limits
        for (let attempt = 0; attempt < 2; attempt++) {
          const geminiResp = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
          });

          if (geminiResp.ok) {
            geminiData = await geminiResp.json();
            usedModel = model;
            break;
          }

          const errBody = await geminiResp.text();
          geminiError = `${model}: ${geminiResp.status} ${errBody.slice(0, 200)}`;

          // Only retry on 503 (transient). For 429, try next model instead of waiting.
          if (geminiResp.status === 503 && attempt === 0) {
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }

          // Non-retryable — try next model
          diagnostics.push(`${prof.name}: Gemini ${model} failed: ${geminiResp.status}`);
          break;
        }

        if (geminiData) break;
      }

      // Fallback or Gemini response — parsed will be set by one of the two paths below
      let parsed: any;

      if (!geminiData) {
        diagnostics.push(`${prof.name}: Gemini unavailable (${geminiError}), using keyword-based fallback`);
        const keywords = prof.keywords || [];
        const fieldSlug = (prof.fields as any)?.slug;
        const fieldAscending: Record<string, Array<{name: string; description: string; why_rising: string}>> = {
          "it-cs": [
            { name: "AI/ML Integration", description: "Incorporating AI models and LLMs into applications and workflows.", why_rising: "AI adoption is accelerating across all software domains." },
            { name: "Cloud-Native Architecture", description: "Designing systems for cloud platforms using containers and serverless.", why_rising: "Organizations continue migrating from on-premise to cloud infrastructure." },
            { name: "DevOps & CI/CD Automation", description: "Automating build, test, and deployment pipelines.", why_rising: "Faster release cycles demand automated delivery pipelines." },
            { name: "Security-First Development", description: "Building security practices into the development lifecycle.", why_rising: "Rising cyber threats make security a core engineering skill." },
          ],
          "finance": [
            { name: "Data Analytics & Visualization", description: "Using tools like Python, SQL, and Power BI to analyze financial data.", why_rising: "Data-driven decision making is replacing intuition-based analysis." },
            { name: "ESG & Sustainable Finance", description: "Understanding environmental, social, and governance investing criteria.", why_rising: "Regulatory pressure and investor demand are making ESG mandatory." },
            { name: "Financial Modeling Automation", description: "Automating financial models and reports with modern tools.", why_rising: "Manual spreadsheet work is being replaced by automated pipelines." },
            { name: "RegTech & Compliance Tech", description: "Using technology to manage regulatory compliance.", why_rising: "Increasing regulation drives demand for compliance automation." },
          ],
          "law": [
            { name: "Legal Tech & AI Tools", description: "Using AI-powered tools for contract review, legal research, and e-discovery.", why_rising: "AI is transforming legal research and document analysis." },
            { name: "Data Privacy & Cybersecurity Law", description: "Advising on GDPR, CCPA, and emerging data protection regulations.", why_rising: "Expanding privacy regulations create demand for specialized expertise." },
            { name: "E-Discovery & Digital Forensics", description: "Managing electronic evidence in litigation using modern tools.", why_rising: "Digital evidence is now standard in most legal proceedings." },
            { name: "Remote Deposition & Virtual Practice", description: "Conducting legal proceedings in virtual environments.", why_rising: "Post-pandemic norms have made virtual practice permanent." },
          ],
        };

        const fieldFading: Record<string, Array<{name: string; why_fading: string; still_useful_for: string; modern_alternative: string}>> = {
          "it-cs": [
            { name: "Manual Testing", why_fading: "Automated testing frameworks handle most regression testing.", still_useful_for: "Exploratory testing and UX validation.", modern_alternative: "Automated test suites and CI/CD pipelines" },
            { name: "Flash/Flex Development", why_fading: "Flash is officially end-of-life and unsupported by browsers.", still_useful_for: "Legacy enterprise systems still running Flash content.", modern_alternative: "HTML5, CSS3, and modern JavaScript frameworks" },
            { name: "Waterfall Project Management", why_fading: "Iterative and agile methodologies deliver faster results.", still_useful_for: "Highly regulated projects with fixed scopes.", modern_alternative: "Agile, Scrum, and Kanban methodologies" },
          ],
          "finance": [
            { name: "Manual Bookkeeping", why_fading: "Cloud accounting software automates most bookkeeping tasks.", still_useful_for: "Small businesses without accounting software.", modern_alternative: "QuickBooks, Xero, and cloud accounting platforms" },
            { name: "Paper-Based Auditing", why_fading: "Digital audit tools and continuous auditing are replacing manual reviews.", still_useful_for: "Small audits in paper-heavy organizations.", modern_alternative: "Data analytics and continuous audit platforms" },
            { name: "Traditional Stock Picking", why_fading: "Passive index funds and algorithmic trading dominate market activity.", still_useful_for: "Boutique advisory and specialized portfolio management.", modern_alternative: "Quantitative analysis and factor-based investing" },
          ],
          "law": [
            { name: "Manual Legal Research", why_fading: "AI-powered research tools find relevant cases faster than manual searching.", still_useful_for: "Narrow or highly specialized legal questions.", modern_alternative: "Westlaw Edge, Lexis AI, and legal research platforms" },
            { name: "Paper-Based Document Management", why_fading: "Digital document systems are standard in modern firms.", still_useful_for: "Courts and jurisdictions not yet digitized.", modern_alternative: "Cloud-based legal document management systems" },
            { name: "Billable Hour Model", why_fading: "Clients increasingly prefer alternative fee arrangements.", still_useful_for: "Complex litigation with unpredictable scope.", modern_alternative: "Flat-fee, subscription, and value-based pricing models" },
          ],
        };

        const fallbackAscending = fieldAscending[fieldSlug] || fieldAscending["it-cs"];
        const fallbackFading = fieldFading[fieldSlug] || fieldFading["it-cs"];

        // Customize the first ascending skill with the profession's primary keyword
        if (keywords.length > 0) {
          fallbackAscending[0] = {
            name: `${keywords[0]} Expertise`,
            description: `Advanced knowledge of ${keywords[0].toLowerCase()} practices and tools for ${prof.name.toLowerCase()}.`,
            why_rising: `Demand for ${keywords[0].toLowerCase()} skills is growing as the field evolves.`,
          };
        }

        parsed = {
          ascending_skills: fallbackAscending,
          fading_skills: fallbackFading,
          pulse_why_it_matters: pulseItems.map((_: any, i: number) =>
            `Relevant to ${prof.name.toLowerCase()}s as it may impact ${keywords[i % Math.max(keywords.length, 1)] || "industry practices"}.`
          ),
        };
        usedModel = "fallback";
      }

      // Parse Gemini response (skip if using fallback)
      if (geminiData) {
        const textContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
          diagnostics.push(`${prof.name}: Gemini returned empty content with ${usedModel}`);
          const finishReason = geminiData.candidates?.[0]?.finishReason;
          if (finishReason) diagnostics.push(`${prof.name}: finishReason=${finishReason}`);
          continue;
        }

        try {
          const cleaned = textContent.replace(/^```json\s*/, "").replace(/\s*```$/, "");
          parsed = JSON.parse(cleaned);
        } catch {
          diagnostics.push(`${prof.name}: failed to parse Gemini JSON. First 200 chars: ${textContent.slice(0, 200)}`);
          continue;
        }
      }

      // When force-refreshing, delete ALL old synthesis (including today's) so we get fresh results.
      // Otherwise, only delete non-today rows.
      if (force) {
        await supabase.from("ascending_skills").delete().eq("profession_id", prof.id);
        await supabase.from("fading_skills").delete().eq("profession_id", prof.id);
      } else {
        await supabase.from("ascending_skills").delete().eq("profession_id", prof.id).neq("fetched_date", today);
        await supabase.from("fading_skills").delete().eq("profession_id", prof.id).neq("fetched_date", today);
      }

      const ascendingRows = (parsed.ascending_skills || []).map((s: any) => ({
        profession_id: prof.id,
        name: s.name || "Unknown",
        description: s.description || "",
        why_rising: s.why_rising || "",
        fetched_date: today,
      }));
      if (ascendingRows.length > 0) {
        const { error } = await supabase.from("ascending_skills").insert(ascendingRows);
        if (error) diagnostics.push(`${prof.name}: ascending insert error: ${error.message}`);
      }

      const fadingRows = (parsed.fading_skills || []).map((s: any) => ({
        profession_id: prof.id,
        name: s.name || "Unknown",
        why_fading: s.why_fading || "",
        still_useful_for: s.still_useful_for || "",
        modern_alternative: s.modern_alternative || "",
        fetched_date: today,
      }));
      if (fadingRows.length > 0) {
        const { error } = await supabase.from("fading_skills").insert(fadingRows);
        if (error) diagnostics.push(`${prof.name}: fading insert error: ${error.message}`);
      }

      // Update pulse_items with why_it_matters
      const whyMatters = parsed.pulse_why_it_matters || [];
      for (let i = 0; i < pulseItems.length && i < whyMatters.length; i++) {
        await supabase
          .from("pulse_items")
          .update({ why_it_matters: whyMatters[i] })
          .eq("id", pulseItems[i].id);
      }

      diagnostics.push(`${prof.name}: success with ${usedModel} — ${ascendingRows.length} ascending, ${fadingRows.length} fading, ${whyMatters.length} why-it-matters`);
      totalProcessed++;
    }

    return new Response(JSON.stringify({
      message: "Synthesis complete",
      professions_processed: totalProcessed,
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

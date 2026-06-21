const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { patient } = await req.json()
    const apiKey = Deno.env.get("OPENAI_API_KEY")

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY not found")
    }

    const prompt = `
You are PrecisionEducation, a clinical learning assistant embedded in an Epic-style workflow.

Audience:
Medical staff reviewing the patient chart: nurses, APPs, residents, fellows, attendings, and students.

You are receiving mock chart data that represents what could be pulled from a real EHR:
- demographics
- encounter details
- problem list
- allergies
- vitals
- labs
- medications
- orders
- notes
- discharge planning context

Chart context:
${JSON.stringify(patient, null, 2)}

Task:
Generate patient-specific clinical learning content from the chart context.

Do NOT treat the chart data as prewritten education.
Do NOT repeat the full clinical snapshot.
Do NOT provide medical orders.
Do NOT invent exact article citations.
Do recommend PubMed search queries.
Do connect insights to the patient’s active problems, trends, orders, notes, and discharge barriers.

Return ONLY valid JSON.
No markdown.
No explanation outside JSON.

Content guidance:
- Clinical Insights should answer: “What matters most for this patient right now?”
- Clinical Pearls should surface frequently missed or high-consequence concepts specific to the case.
- Evidence Review should summarize patient-relevant evidence themes and provide useful PubMed searches.
- Use details from notes, orders, labs, vitals, medications, and discharge barriers.
- Keep each bullet concise and clinically useful.
`

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        text: {
          format: {
            type: "json_schema",
            name: "clinical_learning_brief",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                clinicalInsights: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    whatMattersMost: {
                      type: "array",
                      items: { type: "string" },
                    },
                    keyRisks: {
                      type: "array",
                      items: { type: "string" },
                    },
                    reinforceToday: {
                      type: "array",
                      items: { type: "string" },
                    },
                    anticipateNext: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: [
                    "whatMattersMost",
                    "keyRisks",
                    "reinforceToday",
                    "anticipateNext",
                  ],
                },
                clinicalPearls: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    frequentlyMissed: {
                      type: "array",
                      items: { type: "string" },
                    },
                    highConsequenceConcepts: {
                      type: "array",
                      items: { type: "string" },
                    },
                    attendingPearls: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: [
                    "frequentlyMissed",
                    "highConsequenceConcepts",
                    "attendingPearls",
                  ],
                },
                evidenceReview: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    patientRelevantSummary: {
                      type: "array",
                      items: { type: "string" },
                    },
                    pubmedSearches: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          label: { type: "string" },
                          query: { type: "string" },
                        },
                        required: ["label", "query"],
                      },
                    },
                  },
                  required: ["patientRelevantSummary", "pubmedSearches"],
                },
              },
              required: [
                "clinicalInsights",
                "clinicalPearls",
                "evidenceReview",
              ],
            },
          },
        },
      }),
    })

    const result = await openaiResponse.json()

    if (!openaiResponse.ok) {
      console.error("OpenAI error:", result)

      return new Response(JSON.stringify({ error: result }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      })
    }

    const raw =
      result.output_text ||
      result.output?.[0]?.content?.[0]?.text ||
      "{}"

    const brief = JSON.parse(raw)

    return new Response(JSON.stringify({ brief }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Function error:", error)

    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    })
  }
})
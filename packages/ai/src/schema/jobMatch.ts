import z from "zod";

export const KeywordExtractionSchema = z.object({
  keywords: z.array(
    z.object({
      priority: z
        .enum(["MUST_HAVE", "NICE_TO_HAVE", "OPTIONAL"])
        .describe(
          "MUST_HAVE: Essential/required skills explicitly stated. NICE_TO_HAVE: Preferred/desired skills. OPTIONAL: Bonus/plus skills mentioned.",
        ),
      text: z
        .string()
        .trim()
        .max(100)
        .describe(
          "The keyword/skill text. Use standard industry terms (e.g., 'React' not 'React.js', 'JavaScript' not 'JS').",
        ),
      type: z
        .enum(["TECH_TOOL", "SOFT_SKILL", "CERTIFICATION", "DOMAIN"])
        .describe(
          "TECH_TOOL: Programming languages, frameworks, tools, technologies. SOFT_SKILL: Communication, leadership, teamwork. CERTIFICATION: AWS, PMP, etc. DOMAIN: Industry knowledge like fintech, healthcare.",
        ),
      jobMatches: z
        .array(z.string())
        .default([])
        .describe(
          "Direct quotes from the job description that match this keyword. Include 1-3 relevant excerpts.",
        ),
    }),
  ),
});

export type KeywordExtractionResult = z.infer<typeof KeywordExtractionSchema>;

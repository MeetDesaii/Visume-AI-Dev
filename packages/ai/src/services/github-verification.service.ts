import { randomUUID } from "crypto";
import FirecrawlApp from "@mendable/firecrawl-js";
import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { z } from "zod";
// Corrected import path spelling if needed, assuming user path is fixed or kept as is
import { structuredExtract, type LLMRuntimeOptions } from "../langchian.config";
import { type ResumeExtraction } from "../schema";
import { type NormalizedResume } from "./verification.service";

// --- Types & Schemas ---

type NormalizedProject = {
  title: string;
  description: string;
  achievements: string[];
  skills: string[];
};

export type NormalizedResumeWithProjects = NormalizedResume & {
  projects: NormalizedProject[];
};

type ProjectVerificationStatus = "MATCHED" | "NOT_FOUND" | "FAILED";

export type GithubProjectVerification = {
  projectTitle: string;
  repoName?: string;
  repoUrl?: string;
  status: ProjectVerificationStatus;
  matchConfidence: number;
  matchReasoning: string;
  repoSummary: string;
  supportedClaims: string[];
  missingClaims: string[];
  riskFlags: string[];
  alignmentScore: number;
};

export type GithubVerificationAgentResult = {
  githubProfileUrl: string;
  profileMarkdown: string;
  projectResults: GithubProjectVerification[];
  overallScore: number;
  runMetadata?: Record<string, unknown>;
};

// --- Zod Schemas ---

const RepoListSchema = z.object({
  repos: z
    .array(
      z.object({
        name: z.string().trim().default(""),
        url: z.string().trim().default(""),
        description: z.string().trim().default(""),
        topics: z.array(z.string().trim()).default([]),
        stars: z.number().min(0).default(0),
        forks: z.number().min(0).default(0),
      })
    )
    .default([]),
});

const ResumeProjectsSchema = z.object({
  projects: z
    .array(
      z.object({
        title: z.string().trim().default(""),
        description: z.string().trim().default(""),
        achievements: z.array(z.string().trim()).default([]),
        skills: z.array(z.string().trim()).default([]),
      })
    )
    .default([]),
});

const ProjectRepoMappingSchema = z.object({
  projectMappings: z
    .array(
      z.object({
        projectTitle: z.string().trim(),
        repoName: z.string().trim().default(""),
        repoUrl: z.string().trim().default(""),
        status: z.enum(["MATCHED", "NOT_FOUND"]).default("NOT_FOUND"),
        matchConfidence: z.number().min(0).max(1).default(0),
        reasoning: z.string().trim().default(""),
      })
    )
    .default([]),
});

const ProjectVerificationSchema = z.object({
  repoSummary: z.string().trim().default(""),
  supportedClaims: z.array(z.string().trim()).default([]),
  missingClaims: z.array(z.string().trim()).default([]),
  riskFlags: z.array(z.string().trim()).default([]),
  alignmentScore: z.number().min(0).max(100).default(0),
  confidence: z.number().min(0).max(1).default(0),
  reasoning: z.string().trim().default(""),
});

// --- State Definition ---

type GraphState = {
  resume: NormalizedResumeWithProjects;
  githubProfileUrl: string;
  profileMarkdown: string;
  repos: z.infer<typeof RepoListSchema>["repos"];
  resumeProjects: z.infer<typeof ResumeProjectsSchema>["projects"];
  mappings: z.infer<typeof ProjectRepoMappingSchema>["projectMappings"];
  projectResults: GithubProjectVerification[];
};

// --- Helper Functions ---

function truncate(text: string, max = 15000): string {
  return text.length > max ? `${text.slice(0, max)}... [TRUNCATED]` : text;
}
function normalizeGithubProfileUrl(raw: string): {
  profileUrl: string;
  username: string;
} {
  const input = (raw ?? "").trim();
  if (!input) throw new Error("GitHub profile URL is required");

<<<<<<< Updated upstream
function normalizeGithubProfileUrl(raw: string): {
  profileUrl: string;
  username: string;
} {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) throw new Error("GitHub profile URL is required");
=======
  // 1. Remove protocol and 'www' (e.g. "https://www.github.com/..." -> "github.com/...")
  let clean = input.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "");
>>>>>>> Stashed changes

  // 2. Remove the domain "github.com/" if it exists at the start
  // (e.g. "github.com/meetdesaii" -> "meetdesaii")
  clean = clean.replace(/^github\.com\//i, "");

  // 3. Remove any leading "@" symbol (e.g. "@meetdesaii" -> "meetdesaii")
  clean = clean.replace(/^@/, "");

  // 4. Handle extra paths (e.g. "meetdesaii/repositories" -> "meetdesaii")
  // We split by slash and take the first segment.
  const segments = clean.split("/").filter(Boolean);
  const username = segments[0];

  if (!username) {
    throw new Error(`Could not parse GitHub username from: ${raw}`);
  }

  // 5. Rebuild the URL cleanly
  return {
    profileUrl: `https://github.com/${username}?tab=repositories`,
    username,
  };
}

function normalizeResumeForGithub(
  resume: ResumeExtraction | NormalizedResumeWithProjects
): any {
<<<<<<< Updated upstream
=======
  // Safe extraction with optional chaining to prevent crashes on partial data
>>>>>>> Stashed changes
  const projects =
    (resume as any).projects?.map((project: any) => ({
      title: project.title ?? "Untitled Project",
      description: project.description ?? "",
      achievements: (project.achievements ?? [])
        .map((a: any) => a?.text ?? a ?? "")
        .filter(Boolean),
      skills: (project.skills ?? [])
        .map((skill: any) => skill?.name ?? skill ?? "")
        .filter(Boolean),
    })) ?? [];

<<<<<<< Updated upstream
  return {
    firstName: (resume as any).firstName ?? "",
    lastName: (resume as any).lastName ?? "",
    resumeName: (resume as any).resumeName ?? "",
    targetJobTitle:
      (resume as any).targetJobTitle ?? (resume as any).resumeName,
    email: (resume as any).email ?? "",
    phoneNumber: (resume as any).phoneNumber ?? "",
    location: (resume as any).location ?? "",
    summary: (resume as any).summary ?? "",
    profiles: (resume as any).profiles ?? {},
    links: (resume as any).links ?? [],

    workExperiences: (resume as any).workExperiences ?? [],
    educations: (resume as any).educations ?? [],
    certifications: (resume as any).certifications ?? [],
    projects,
  };
=======
  return { ...resume, projects };
>>>>>>> Stashed changes
}

async function scrapeMarkdown(
  client: FirecrawlApp,
  url: string
<<<<<<< Updated upstream
): Promise<{
  markdown: string;
  raw?: unknown;
}> {
=======
): Promise<{ markdown: string; raw?: unknown }> {
>>>>>>> Stashed changes
  try {
    const result = await client.scrapeUrl(url, {
      formats: ["markdown"],
      onlyMainContent: true,
    } as any);

    const markdown = (result as any)?.markdown ?? "";
    return { markdown, raw: result };
  } catch (error) {
    console.warn(`[VerificationAgent] Scrape failed for ${url}:`, error);
    return { markdown: "", raw: { error: (error as Error)?.message } };
  }
}

function buildRepoUrl(username: string, repoName?: string, fallback?: string) {
  if (fallback && fallback.includes("github.com")) return fallback;
  if (!username || !repoName) return "";
  return `https://github.com/${username}/${repoName}`;
}

function computeOverallScore(results: GithubProjectVerification[]) {
  const scored = results.filter((p) => p.status === "MATCHED");
  if (scored.length === 0) return 0;
  const total = scored.reduce((sum, item) => sum + item.alignmentScore, 0);
  return Math.round(total / scored.length);
}

// --- Main Graph Logic ---

async function buildGraph(params: {
  firecrawl: FirecrawlApp;
  profileUrl: string;
  username: string;
  llmOptions?: LLMRuntimeOptions;
}) {
  const { firecrawl, profileUrl, username, llmOptions } = params;

  // Define Graph State
  const GraphAnnotation = Annotation.Root({
    resume: Annotation<NormalizedResumeWithProjects>(),
    githubProfileUrl: Annotation<string>(),
    profileMarkdown: Annotation<string>({ reducer: (_, b) => b ?? "" }),
    repos: Annotation<z.infer<typeof RepoListSchema>["repos"]>({
      reducer: (_, b) => b ?? [],
    }),
    resumeProjects: Annotation<
      z.infer<typeof ResumeProjectsSchema>["projects"]
<<<<<<< Updated upstream
    >({
      default: () => [],
      reducer: (_, b) => b ?? [],
    }),
    mappings: Annotation<
      z.infer<typeof ProjectRepoMappingSchema>["projectMappings"]
    >({
      default: () => [],
      reducer: (_, b) => b ?? [],
    }),
=======
    >({ reducer: (_, b) => b ?? [] }),
    mappings: Annotation<
      z.infer<typeof ProjectRepoMappingSchema>["projectMappings"]
    >({ reducer: (_, b) => b ?? [] }),
>>>>>>> Stashed changes
    projectResults: Annotation<GithubProjectVerification[]>({
      reducer: (_, b) => b ?? [],
    }),
  });

  // --- Nodes ---

  const extractProjectsNode = async (state: typeof GraphAnnotation.State) => {
    // Optimization: If projects are already normalized in the resume, skip LLM extraction
    if (state.resume.projects && state.resume.projects.length > 0) {
      return { resumeProjects: state.resume.projects };
    }

    const projects = await structuredExtract({
      schema: ResumeProjectsSchema,
      input: [
        {
          role: "system",
          content:
            "Extract technical projects from the resume. Capture titles, descriptions, and lists of achievements/skills.",
        },
        {
          role: "user",
          content: `Resume JSON:\n${JSON.stringify(state.resume, null, 2)}`,
        },
      ],
      ...llmOptions,
    });
    return { resumeProjects: projects.projects };
  };

  const scrapeProfileNode = async () => {
    const profileScrape = await scrapeMarkdown(firecrawl, profileUrl);

    if (!profileScrape.markdown) {
      throw new Error(`Failed to scrape GitHub profile: ${profileUrl}`);
    }
    return { profileMarkdown: profileScrape.markdown };
  };

  const extractReposNode = async (state: typeof GraphAnnotation.State) => {
    const repos = await structuredExtract({
      schema: RepoListSchema,
      input: [
        {
          role: "system",
          content:
            "Extract repositories strictly belonging to this user from the markdown. Ignore pinned repos if they belong to others (forks are okay).",
        },
        {
          role: "user",
          content: `Profile URL: ${state.githubProfileUrl}\nContent:\n${truncate(state.profileMarkdown)}`,
        },
      ],
      ...llmOptions,
    });
    return { repos: repos.repos };
  };

  const matchProjectsNode = async (state: typeof GraphAnnotation.State) => {
    // If we have no resume projects, we can't match anything.
    if (state.resumeProjects.length === 0) return { mappings: [] };

    const mappings = await structuredExtract({
      schema: ProjectRepoMappingSchema,
      input: [
        {
          role: "system",
          content:
            "You are a code auditor. Match Resume Projects to GitHub Repositories. \n- Use fuzzy matching on names/topics.\n- If a match is weak, set status to NOT_FOUND.\n- Reasoning must be concise.",
        },
        {
          role: "user",
          content: `Repos:\n${JSON.stringify(
            state.repos.map((r) => ({ name: r.name, desc: r.description })),
            null,
            2
          )}\n\nProjects:\n${JSON.stringify(
            state.resumeProjects.map((p) => ({
              title: p.title,
              desc: p.description,
            })),
            null,
            2
          )}`,
        },
      ],
      ...llmOptions,
    });
    return { mappings: mappings.projectMappings };
  };

  const verifyProjectsNode = async (state: typeof GraphAnnotation.State) => {
    // PERFORMANCE UPGRADE: Process all matches in Parallel (Promise.all)
    const verificationPromises = state.mappings.map(async (mapping) => {
      const repoUrl = buildRepoUrl(username, mapping.repoName, mapping.repoUrl);

      const baseResult: GithubProjectVerification = {
        projectTitle: mapping.projectTitle,
        repoName: mapping.repoName,
        repoUrl,
        status:
          mapping.status === "MATCHED" && repoUrl ? "MATCHED" : "NOT_FOUND",
        matchConfidence: mapping.matchConfidence,
        matchReasoning: mapping.reasoning,
        repoSummary: "",
        supportedClaims: [],
        missingClaims: [],
        riskFlags: [],
        alignmentScore: 0,
      };

      // If not matched, return early
      if (baseResult.status !== "MATCHED") return baseResult;

      try {
        const repoScrape = await scrapeMarkdown(firecrawl, repoUrl);

        // If scrape fails (empty), mark as risk
        if (!repoScrape.markdown) {
          return {
            ...baseResult,
            riskFlags: ["Repository could not be scraped (Empty or Private)"],
          };
        }

        const verification = await structuredExtract({
          schema: ProjectVerificationSchema,
          input: [
            {
              role: "system",
              content:
                "Verify resume claims against code. \n- `alignmentScore` (0-100): Does the code prove the project exists and uses the claimed tech?\n- `riskFlags`: detect empty repos, forks without changes, or ancient timestamps.",
            },
            {
              role: "user",
              content: `Project Claim:\n${JSON.stringify(
                state.resumeProjects.find(
                  (p) => p.title === mapping.projectTitle
                ),
                null,
                2
              )}\n\nRepo Readme/Code:\n${truncate(repoScrape.markdown, 10000)}`,
            },
          ],
          ...llmOptions,
        });

        return {
          ...baseResult,
          status: "MATCHED",
          repoSummary: verification.repoSummary,
          supportedClaims: verification.supportedClaims,
          missingClaims: verification.missingClaims,
          riskFlags: verification.riskFlags,
          alignmentScore: verification.alignmentScore,
          matchConfidence: Math.max(
            baseResult.matchConfidence,
            verification.confidence ?? 0.5
          ),
        };
      } catch (error) {
        return {
          ...baseResult,
          status: "FAILED",
          riskFlags: [`Verification Error: ${(error as Error).message}`],
        };
      }
    });

    const results = await Promise.all(verificationPromises);
    return { projectResults: results };
  };

  // --- Graph Construction ---

  const workflow = new StateGraph(GraphAnnotation)
    // 1. Add Nodes
    .addNode("extractProjects", extractProjectsNode)
    .addNode("scrapeProfile", scrapeProfileNode)
    .addNode("extractRepos", extractReposNode)
    .addNode("matchProjects", matchProjectsNode)
    .addNode("verifyProjects", verifyProjectsNode)
    .addEdge(START, "extractProjects")
    .addEdge("extractProjects", "scrapeProfile")
    .addEdge("scrapeProfile", "extractRepos")
    .addEdge("extractRepos", "matchProjects")
    .addEdge("matchProjects", "verifyProjects")
    .addEdge("verifyProjects", END)
    .compile({ checkpointer: new MemorySaver() });

  return workflow;
}

// --- Main Entry Point ---

export async function runResumeGithubVerification(params: {
  resume: ResumeExtraction | NormalizedResumeWithProjects;
  githubProfileUrl: string;
  firecrawlApiKey?: string;
  llmOptions?: LLMRuntimeOptions;
}): Promise<GithubVerificationAgentResult> {
  const apiKey = params.firecrawlApiKey ?? process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not configured");

  const normalizedResume = normalizeResumeForGithub(params.resume);
  const { profileUrl, username } = normalizeGithubProfileUrl(
    params.githubProfileUrl
  );

  const firecrawl = new FirecrawlApp({ apiKey });

  const graph = await buildGraph({
    firecrawl,
    profileUrl,
    username,
    llmOptions: params.llmOptions,
  });

  const state = await graph.invoke(
    {
      resume: normalizedResume,
      githubProfileUrl: profileUrl,
    },
    { configurable: { thread_id: randomUUID() } }
  );

  const overallScore = computeOverallScore(state.projectResults);

  return {
    githubProfileUrl: profileUrl,
    profileMarkdown: state.profileMarkdown,
    projectResults: state.projectResults,
    overallScore,
    runMetadata: {
      profileUsername: username,
      matchedProjects: state.projectResults.filter(
        (p) => p.status === "MATCHED"
      ).length,
      totalProjects: state.projectResults.length,
      reposConsidered: state.repos.length,
    },
  };
}

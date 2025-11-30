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
import { structuredExtract, type LLMRuntimeOptions } from "../langchian.config";
import { type ResumeExtraction } from "../schema";
import { type NormalizedResume } from "./verification.service";

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

type GraphState = {
  resume: NormalizedResumeWithProjects;
  githubProfileUrl: string;
  profileMarkdown: string;
  repos: z.infer<typeof RepoListSchema>["repos"];
  resumeProjects: z.infer<typeof ResumeProjectsSchema>["projects"];
  mappings: z.infer<typeof ProjectRepoMappingSchema>["projectMappings"];
  projectResults: GithubProjectVerification[];
};

function truncate(text: string, max = 12000): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function normalizeGithubProfileUrl(raw: string): { profileUrl: string; username: string } {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) throw new Error("GitHub profile URL is required");

  let url = trimmed;
  if (!/^https?:\/\//i.test(url)) {
    url = `https://github.com/${url.replace(/^@/, "")}`;
  }

  const parsed = new URL(url);
  const segments = parsed.pathname.split("/").filter(Boolean);
  const username = segments[0];

  if (!username) {
    throw new Error("Unable to derive GitHub username from profile URL");
  }

  return {
    profileUrl: `https://github.com/${username}`,
    username,
  };
}

function normalizeResumeForGithub(
  resume: ResumeExtraction | NormalizedResumeWithProjects
): NormalizedResumeWithProjects {
  const skills =
    (resume as ResumeExtraction).skills?.map((skill: any) => skill.name ?? skill) ??
    (resume as NormalizedResume).skills ??
    [];

  const projects =
    (resume as any).projects?.map((project: any) => ({
      title: project.title ?? "",
      description: project.description ?? "",
      achievements: (project.achievements ?? [])
        .map((a: any) => a?.text ?? a ?? "")
        .filter(Boolean),
      skills: (project.skills ?? [])
        .map((skill: any) => skill?.name ?? skill ?? "")
        .filter(Boolean),
    })) ?? [];

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
    skills,
    workExperiences: (resume as any).workExperiences ?? [],
    educations: (resume as any).educations ?? [],
    certifications: (resume as any).certifications ?? [],
    projects,
  };
}

async function scrapeMarkdown(client: FirecrawlApp, url: string): Promise<{
  markdown: string;
  raw?: unknown;
}> {
  try {
    const result = await client.scrapeUrl(url, {
      formats: ["markdown"],
      onlyMainContent: false,
    } as any);

    const markdown =
      (result as any)?.data?.markdown ??
      (result as any)?.data?.content ??
      (result as any)?.data?.text ??
      "";

    return { markdown, raw: result };
  } catch (error) {
    return { markdown: "", raw: { error: (error as Error)?.message ?? error } };
  }
}

function buildRepoUrl(username: string, repoName?: string, fallback?: string) {
  if (fallback) return fallback;
  if (!username || !repoName) return "";
  return `https://github.com/${username}/${repoName}`;
}

function computeOverallScore(results: GithubProjectVerification[]) {
  const scored = results.filter((p) => p.status === "MATCHED");
  if (scored.length === 0) return 0;
  const total = scored.reduce((sum, item) => sum + item.alignmentScore, 0);
  return Math.round(total / scored.length);
}

async function buildGraph(params: {
  firecrawl: FirecrawlApp;
  profileUrl: string;
  username: string;
  llmOptions?: LLMRuntimeOptions;
}) {
  const { firecrawl, profileUrl, username, llmOptions } = params;

  const GraphState = Annotation.Root({
    resume: Annotation<NormalizedResumeWithProjects>(),
    githubProfileUrl: Annotation<string>(),
    profileMarkdown: Annotation<string>({
      default: () => "",
      reducer: (_, b) => b ?? "",
    }),
    repos: Annotation<z.infer<typeof RepoListSchema>["repos"]>({
      default: () => [],
      reducer: (_, b) => b ?? [],
    }),
    resumeProjects: Annotation<z.infer<typeof ResumeProjectsSchema>["projects"]>(
      {
        default: () => [],
        reducer: (_, b) => b ?? [],
      }
    ),
    mappings: Annotation<z.infer<typeof ProjectRepoMappingSchema>["projectMappings"]>(
      {
        default: () => [],
        reducer: (_, b) => b ?? [],
      }
    ),
    projectResults: Annotation<GithubProjectVerification[]>({
      default: () => [],
      reducer: (_, b) => b ?? [],
    }),
  });

  const scrapeProfileNode = async () => {
    const profileScrape = await scrapeMarkdown(firecrawl, profileUrl);
    return { profileMarkdown: profileScrape.markdown };
  };

  const extractReposNode = async (state: typeof GraphState.State) => {
    const repos = await structuredExtract({
      schema: RepoListSchema,
      input: [
        {
          role: "system",
          content:
            "Extract the repositories from this GitHub profile page. Focus on repo names, URLs, descriptions, topics, stars, and forks. Only include repos that belong to this user.",
        },
        {
          role: "user",
          content: `GitHub profile URL: ${state.githubProfileUrl}\n\nProfile markdown:\n${truncate(
            state.profileMarkdown,
            12000
          )}`,
        },
      ],
      ...llmOptions,
    });
    return { repos: repos.repos };
  };

  const extractProjectsNode = async (state: typeof GraphState.State) => {
    const projects = await structuredExtract({
      schema: ResumeProjectsSchema,
      input: [
        {
          role: "system",
          content:
            "Extract all projects from the resume JSON. Keep titles exact, and capture descriptions, achievements, and skills. Use empty strings/arrays when missing.",
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

  const matchProjectsNode = async (state: typeof GraphState.State) => {
    const mappings = await structuredExtract({
      schema: ProjectRepoMappingSchema,
      input: [
        {
          role: "system",
          content:
            "Match each resume project to the most likely GitHub repository. Prefer repos owned by the profile. Use NOT_FOUND when no good match exists. Provide matchConfidence 0-1 and concise reasoning.",
        },
        {
          role: "user",
          content: `GitHub profile: ${state.githubProfileUrl}\n\nAvailable repos:\n${JSON.stringify(
            state.repos,
            null,
            2
          )}\n\nResume projects:\n${JSON.stringify(
            state.resumeProjects,
            null,
            2
          )}`,
        },
      ],
      ...llmOptions,
    });
    return { mappings: mappings.projectMappings };
  };

  const verifyProjectsNode = async (state: typeof GraphState.State) => {
    const projectResults: GithubProjectVerification[] = [];

    for (const mapping of state.mappings) {
      const repoUrl = buildRepoUrl(username, mapping.repoName, mapping.repoUrl);
      const baseResult: GithubProjectVerification = {
        projectTitle: mapping.projectTitle,
        repoName: mapping.repoName,
        repoUrl,
        status: mapping.status === "MATCHED" && repoUrl ? "MATCHED" : "NOT_FOUND",
        matchConfidence: mapping.matchConfidence,
        matchReasoning: mapping.reasoning,
        repoSummary: "",
        supportedClaims: [],
        missingClaims: [],
        riskFlags: [],
        alignmentScore: 0,
      };

      if (baseResult.status !== "MATCHED") {
        projectResults.push(baseResult);
        continue;
      }

      try {
        const repoScrape = await scrapeMarkdown(firecrawl, repoUrl);
        const verification = await structuredExtract({
          schema: ProjectVerificationSchema,
          input: [
            {
              role: "system",
              content:
                "Compare the resume project with the repository content. Identify supported claims, missing claims, and risks. Provide a concise repo summary. alignmentScore is 0-100 for how well the repo supports the project. confidence is 0-1 for your assessment reliability.",
            },
            {
              role: "user",
              content: `Repository URL: ${repoUrl}\n\nResume project:\n${JSON.stringify(
                state.resumeProjects.find(
                  (p) => p.title === mapping.projectTitle
                ) ?? {
                  title: mapping.projectTitle,
                  description: "",
                  achievements: [],
                  skills: [],
                },
                null,
                2
              )}\n\nRepository content (truncated):\n${truncate(
                repoScrape.markdown,
                9000
              )}`,
            },
          ],
          ...llmOptions,
        });

        projectResults.push({
          ...baseResult,
          status: "MATCHED",
          repoSummary: verification.repoSummary,
          supportedClaims: verification.supportedClaims,
          missingClaims: verification.missingClaims,
          riskFlags: verification.riskFlags,
          alignmentScore: verification.alignmentScore,
          matchConfidence: Math.max(
            baseResult.matchConfidence,
            verification.confidence ?? baseResult.matchConfidence
          ),
          matchReasoning: baseResult.matchReasoning || verification.reasoning,
        });
      } catch (error) {
        projectResults.push({
          ...baseResult,
          status: "FAILED",
          riskFlags: [(error as Error)?.message ?? "Verification failed"],
        });
      }
    }

    return { projectResults };
  };

  const workflow = new StateGraph(GraphState)
    .addNode("scrapeProfile", scrapeProfileNode)
    .addNode("extractRepos", extractReposNode)
    .addNode("extractProjects", extractProjectsNode)
    .addNode("matchProjects", matchProjectsNode)
    .addNode("verifyProjects", verifyProjectsNode)
    .addEdge(START, "scrapeProfile")
    .addEdge("scrapeProfile", "extractRepos")
    .addEdge("extractRepos", "extractProjects")
    .addEdge("extractProjects", "matchProjects")
    .addEdge("matchProjects", "verifyProjects")
    .addEdge("verifyProjects", END)
    .compile({ checkpointer: new MemorySaver() });

  return workflow;
}

export async function runResumeGithubVerification(params: {
  resume: ResumeExtraction | NormalizedResumeWithProjects;
  githubProfileUrl: string;
  firecrawlApiKey?: string;
  llmOptions?: LLMRuntimeOptions;
}): Promise<GithubVerificationAgentResult> {
  const apiKey = params.firecrawlApiKey ?? process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured");
  }

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
      profileMarkdown: "",
      repos: [],
      resumeProjects: [],
      mappings: [],
      projectResults: [],
    },
    {
      configurable: {
        thread_id: randomUUID(),
      },
    }
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

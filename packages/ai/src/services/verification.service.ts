import { randomUUID } from "crypto";
import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import {
  createLLM,
  structuredExtract,
  type LLMRuntimeOptions,
} from "../langchian.config";
import {
  LinkedInProfileSchema,
  type LinkedInProfile,
  type ResumeExtraction,
} from "../schema";

type ExperienceLike = {
  jobTitle: string;
  employerName: string;
  location?: string;
  startedAt?: string | Date | null;
  endedAt?: string | Date | null;
  isCurrentPosition?: boolean;
  role?: string;
  achievements?: Array<{ text: string }>;
  skills?: string[];
};

type EducationLike = {
  institutionName: string;
  degreeTypeName?: string;
  fieldOfStudyName?: string;
  graduationAt?: string | Date | null;
  description?: string;
};

type CertificationLike = {
  title: string;
  issuer?: string;
  startDate?: string | Date | null;
  expiryDate?: string | Date | null;
  link?: string;
};

export type NormalizedResume = {
  firstName: string;
  lastName: string;
  resumeName: string;
  targetJobTitle?: string;
  email?: string;
  phoneNumber?: string;
  location?: string;
  summary?: string;
  profiles?: { linkedin?: string; github?: string };
  links?: string[];
  skills: string[];
  workExperiences: ExperienceLike[];
  educations: EducationLike[];
  certifications: CertificationLike[];
};

type VerificationState = {
  resume: NormalizedResume;
  linkedinText: string;
  linkedinProfile: LinkedInProfile | null;
  resumeAssertions: string[];
  crossCheckFindings: string[];
};

export type VerificationSectionScore = {
  section: string;
  score: number; // 0 - 100
  weight: number; // 0 - 1
  rationale: string;
  coverage: number; // 0 - 1 coverage of section content
};

export type VerificationAgentResult = {
  linkedinProfile: LinkedInProfile;
  resumeAssertions: string[];
  findings: string[];
  sectionScores: VerificationSectionScore[];
  overallScore: number;
  scoringMethod: string;
};

const DEFAULT_SCORING_METHOD = "weighted_similarity_v2";
const SECTION_WEIGHTS = {
  identity: 0.18,
  contact: 0.12,
  experience: 0.32,
  education: 0.12,
  skills: 0.16,
  summary: 0.1,
} as const;

function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function safeWeightedAverage(
  values: Array<{ value: number; weight: number }>
): number {
  const numerator = values.reduce(
    (acc, { value, weight }) => acc + value * Math.max(weight, 0),
    0
  );
  const denominator = values.reduce(
    (acc, { weight }) => acc + Math.max(weight, 0),
    0
  );
  if (denominator === 0) return 0;
  return numerator / denominator;
}

function normalizePhone(value?: string): string {
  return value ? value.replace(/\D/g, "") : "";
}

function emailParts(email?: string): { local: string; domain: string } {
  const clean = (email ?? "").trim().toLowerCase();
  const [local = "", domain = ""] = clean.split("@");
  return { local, domain };
}

function recencyWeight(
  end?: string | Date | null,
  isCurrent?: boolean
): number {
  const now = new Date();
  const normalizedEnd =
    !end || isCurrent
      ? now
      : new Date(normalizeDate(end) ?? now.toISOString());
  if (Number.isNaN(normalizedEnd.getTime())) return 0.6;
  const monthsAgo = Math.abs(monthDiff(normalizedEnd, now));
  return clamp01(1 / (1 + monthsAgo / 36)); // decays after ~3 years
}

function durationInMonths(
  start?: string | Date | null,
  end?: string | Date | null
): number | null {
  const normalizedStart = normalizeDate(start ?? null);
  const normalizedEnd = normalizeDate(end ?? null);
  if (!normalizedStart || !normalizedEnd) return null;
  const startDate = new Date(normalizedStart);
  const endDate = new Date(normalizedEnd);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  return Math.max(0, monthDiff(startDate, endDate));
}

function durationCloseness(
  aStart: string | Date | null,
  aEnd: string | Date | null,
  bStart: string | Date | null,
  bEnd: string | Date | null
): number {
  const durA = durationInMonths(aStart, aEnd);
  const durB = durationInMonths(bStart, bEnd);
  if (durA === null || durB === null) return 0.35;
  const diff = Math.abs(durA - durB);
  const tolerance = Math.max(6, Math.min(durA, durB, 60));
  return clamp01(1 - diff / tolerance);
}

function normalizeSkills(skills?: string[]): string[] {
  return (skills ?? [])
    .map((skill) => skill.toLowerCase().trim())
    .filter(Boolean);
}

function achievementsText(
  achievements?: Array<{ text?: string }> | string[]
): string {
  if (!achievements) return "";
  return achievements
    .map((item) => (typeof item === "string" ? item : item.text ?? ""))
    .filter(Boolean)
    .join(" ");
}

function nameSimilarity(
  resume: NormalizedResume,
  linkedinProfile: LinkedInProfile
): number {
  const fullResume = `${resume.firstName} ${resume.lastName}`.trim();
  const fullLinkedIn = `${linkedinProfile.firstName} ${linkedinProfile.lastName}`.trim();
  const fullMatch = stringSimilarity(fullResume, fullLinkedIn);
  const firstMatch = stringSimilarity(resume.firstName, linkedinProfile.firstName);
  const lastMatch = stringSimilarity(resume.lastName, linkedinProfile.lastName);
  return clamp01(Math.max(fullMatch, 0.4 * fullMatch + 0.3 * firstMatch + 0.3 * lastMatch));
}

function normalizeDate(value?: string | Date | null): string | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString().slice(0, 10);
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (/^\d{4}(-\d{2})?$/.test(trimmed)) return trimmed;
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function tokenize(text?: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9\+]+/i)
    .map((t) => t.trim())
    .filter(Boolean);
}

function jaccardSimilarity(
  a: string[] | Set<string>,
  b: string[] | Set<string>
): number {
  const setA = a instanceof Set ? a : new Set(a);
  const setB = b instanceof Set ? b : new Set(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function stringSimilarity(a?: string, b?: string): number {
  return jaccardSimilarity(tokenize(a), tokenize(b));
}

function monthDiff(a: Date, b: Date): number {
  const years = b.getFullYear() - a.getFullYear();
  const months = b.getMonth() - a.getMonth();
  return years * 12 + months;
}

function dateClosenessScore(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null
): number {
  const startA = aStart ? new Date(aStart) : null;
  const startB = bStart ? new Date(bStart) : null;
  const endA = aEnd ? new Date(aEnd) : null;
  const endB = bEnd ? new Date(bEnd) : null;

  let accumulator = 0;
  let parts = 0;

  if (startA && startB) {
    const diff = Math.abs(monthDiff(startA, startB));
    accumulator += Math.max(0, 1 - diff / 24); // decay after 2 years
    parts += 1;
  }

  if (endA && endB) {
    const diff = Math.abs(monthDiff(endA, endB));
    accumulator += Math.max(0, 1 - diff / 24);
    parts += 1;
  }

  return parts === 0 ? 0.25 : accumulator / parts;
}

function normalizeResumeInput(
  resume: ResumeExtraction | NormalizedResume
): NormalizedResume {
  const normalizedSkills =
    (resume as ResumeExtraction).skills?.map(
      (s: any) => (s as any).name || s
    ) ??
    (resume as NormalizedResume).skills ??
    [];

  const workExperiences =
    (resume as any).workExperiences?.map((exp: any) => ({
      jobTitle: exp.jobTitle ?? "",
      employerName: exp.employerName ?? "",
      location: exp.location ?? "",
      startedAt: normalizeDate(exp.startedAt ?? null),
      endedAt: normalizeDate(exp.endedAt ?? null),
      isCurrentPosition: Boolean(exp.isCurrentPosition),
      role: exp.role ?? "",
      achievements: (exp.achievements ?? []).map((a: any) => ({
        text: a.text ?? a ?? "",
      })),
      skills: exp.skills ?? [],
    })) ?? [];

  const educations =
    (resume as any).educations?.map((edu: any) => ({
      institutionName: edu.institutionName ?? "",
      degreeTypeName: edu.degreeTypeName ?? "",
      fieldOfStudyName: edu.fieldOfStudyName ?? "",
      graduationAt: normalizeDate(edu.graduationAt ?? null),
      description: edu.description ?? "",
    })) ?? [];

  const certifications =
    (resume as any).certifications?.map((cert: any) => ({
      title: cert.title ?? "",
      issuer: cert.issuer ?? "",
      startDate: normalizeDate(cert.startDate ?? null),
      expiryDate: normalizeDate(cert.expiryDate ?? null),
      link: cert.link ?? "",
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
    skills: normalizedSkills,
    workExperiences,
    educations,
    certifications,
  };
}

function normalizeLinkedInProfile(profile: LinkedInProfile): LinkedInProfile {
  return {
    ...profile,
    experiences: profile.experiences.map((exp) => ({
      ...exp,
      startedAt: normalizeDate(exp.startedAt) ?? null,
      endedAt: normalizeDate(exp.endedAt) ?? null,
      achievements: exp.achievements ?? [],
      skills: exp.skills ?? [],
    })),
    educations: profile.educations.map((edu) => ({
      ...edu,
      graduationAt: normalizeDate(edu.graduationAt) ?? null,
    })),
    certifications: profile.certifications.map((cert) => ({
      ...cert,
      startDate: normalizeDate(cert.startDate) ?? null,
      expiryDate: normalizeDate(cert.expiryDate) ?? null,
    })),
    skills: profile.skills ?? [],
    languages: profile.languages ?? [],
    accomplishments: profile.accomplishments ?? [],
    websites: profile.websites ?? [],
  };
}

function parseBulletList(message?: string): string[] {
  if (!message) return [];
  return message
    .split(/\n+/)
    .map((line) => line.replace(/^[\s\-*\d.]+\s*/, "").trim())
    .filter(Boolean);
}

function toText(content: AIMessage["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) =>
        typeof part === "string" ? part : ((part as any).text ?? "")
      )
      .join("");
  }
  return "";
}

function bestExperienceScore(
  exp: ExperienceLike,
  linkedinExperiences: LinkedInProfile["experiences"]
): { score: number; weight: number } {
  if (linkedinExperiences.length === 0) return { score: 0, weight: 0 };

  let bestScore = 0;
  let bestWeight = 0.5;

  for (const liExp of linkedinExperiences) {
    const titleSim = stringSimilarity(exp.jobTitle, liExp.title);
    const companySim = stringSimilarity(exp.employerName, liExp.companyName);
    const locationSim = stringSimilarity(
      exp.location ?? "",
      (liExp as any).location ?? ""
    );
    const datesSim = dateClosenessScore(
      normalizeDate(exp.startedAt ?? null),
      normalizeDate(exp.endedAt ?? null),
      liExp.startedAt ?? null,
      liExp.endedAt ?? null
    );
    const durationSim = durationCloseness(
      normalizeDate(exp.startedAt ?? null),
      normalizeDate(exp.endedAt ?? null),
      liExp.startedAt ?? null,
      liExp.endedAt ?? null
    );
    const skillsSim = jaccardSimilarity(
      normalizeSkills(exp.skills),
      normalizeSkills(liExp.skills)
    );
    const achievementsSim = stringSimilarity(
      achievementsText(exp.achievements),
      achievementsText(liExp.achievements)
    );

    const composite = clamp01(
      0.34 * titleSim +
        0.24 * companySim +
        0.14 * datesSim +
        0.1 * skillsSim +
        0.08 * durationSim +
        0.05 * achievementsSim +
        0.05 * locationSim
    );

    if (composite > bestScore) {
      bestScore = composite;
      bestWeight = recencyWeight(liExp.endedAt ?? null, (liExp as any).isCurrentPosition);
    }
  }

  return { score: bestScore, weight: bestWeight };
}

function bestEducationScore(
  edu: EducationLike,
  linkedinEducations: LinkedInProfile["educations"]
): { score: number; weight: number } {
  if (linkedinEducations.length === 0) return { score: 0, weight: 0 };
  let bestScore = 0;
  let bestWeight = 0.5;

  for (const liEdu of linkedinEducations) {
    const schoolSim = stringSimilarity(
      edu.institutionName,
      liEdu.institutionName
    );
    const degreeSim = stringSimilarity(
      `${edu.degreeTypeName ?? ""}`.trim(),
      `${liEdu.degreeTypeName ?? ""}`.trim()
    );
    const fieldSim = stringSimilarity(
      `${edu.fieldOfStudyName ?? ""}`,
      `${liEdu.fieldOfStudyName ?? ""}`
    );
    const dateSim = dateClosenessScore(
      normalizeDate(edu.graduationAt ?? null),
      normalizeDate(edu.graduationAt ?? null),
      liEdu.graduationAt ?? null,
      liEdu.graduationAt ?? null
    );
    const locationSim = stringSimilarity(
      (edu as any).location ?? "",
      (liEdu as any).location ?? ""
    );

    const score = clamp01(
      0.42 * schoolSim +
        0.28 * degreeSim +
        0.15 * fieldSim +
        0.1 * dateSim +
        0.05 * locationSim
    );

    if (score > bestScore) {
      bestScore = score;
      bestWeight = recencyWeight(liEdu.graduationAt ?? null, false);
    }
  }

  return { score: bestScore, weight: bestWeight };
}

function computeSectionScores(
  resume: NormalizedResume,
  linkedinProfile: LinkedInProfile
): { sectionScores: VerificationSectionScore[]; overallScore: number } {
  const identityNameScore = nameSimilarity(resume, linkedinProfile);
  const identityHeadlineScore = stringSimilarity(
    resume.targetJobTitle ?? resume.resumeName,
    linkedinProfile.headline
  );
  const identityScore = clamp01(
    0.7 * identityNameScore + 0.3 * identityHeadlineScore
  );

  const emailMatch =
    resume.email && linkedinProfile.email
      ? (() => {
          const resumeEmail = resume.email.toLowerCase();
          const profileEmail = linkedinProfile.email.toLowerCase();
          if (resumeEmail === profileEmail) return 1;
          const resumeParts = emailParts(resumeEmail);
          const profileParts = emailParts(profileEmail);
          const domainScore =
            resumeParts.domain && profileParts.domain
              ? Number(resumeParts.domain === profileParts.domain)
              : 0;
          const localScore = stringSimilarity(
            resumeParts.local,
            profileParts.local
          );
          return clamp01(0.6 * localScore + 0.4 * domainScore);
        })()
      : 0;

  const phoneMatch =
    resume.phoneNumber && linkedinProfile.phone
      ? (() => {
          const resumePhone = normalizePhone(resume.phoneNumber);
          const profilePhone = normalizePhone(linkedinProfile.phone);
          if (!resumePhone || !profilePhone) return 0;
          if (resumePhone === profilePhone) return 1;
          if (
            resumePhone.length >= 4 &&
            profilePhone.length >= 4 &&
            resumePhone.slice(-4) === profilePhone.slice(-4)
          ) {
            return 0.7;
          }
          if (
            resumePhone.length >= 3 &&
            profilePhone.length >= 3 &&
            resumePhone.slice(-3) === profilePhone.slice(-3)
          ) {
            return 0.45;
          }
          return 0;
        })()
      : 0;

  const contactSignals: Array<{ value: number; weight: number }> = [];
  if (resume.email) contactSignals.push({ value: emailMatch, weight: 0.6 });
  if (resume.phoneNumber)
    contactSignals.push({ value: phoneMatch, weight: 0.4 });

  const contactScore =
    contactSignals.length === 0
      ? 0.35
      : clamp01(safeWeightedAverage(contactSignals));

  const expMatches = resume.workExperiences.map((exp) =>
    bestExperienceScore(exp, linkedinProfile.experiences)
  );
  const expCoverage =
    expMatches.length === 0
      ? 0
      : expMatches.filter(({ score }) => score >= 0.55).length /
        Math.max(1, expMatches.length);
  const experienceScore =
    expMatches.length === 0
      ? 0
      : clamp01(
          0.7 *
            safeWeightedAverage(
              expMatches.map(({ score, weight }) => ({
                value: score,
                weight: Math.max(weight, 0.25),
              }))
            ) +
            0.3 * expCoverage
        );

  const eduMatches = resume.educations.map((edu) =>
    bestEducationScore(edu, linkedinProfile.educations)
  );
  const eduCoverage =
    eduMatches.length === 0
      ? 0
      : eduMatches.filter(({ score }) => score >= 0.55).length /
        Math.max(1, eduMatches.length);
  const educationScore =
    eduMatches.length === 0
      ? 0
      : clamp01(
          0.7 *
            safeWeightedAverage(
              eduMatches.map(({ score, weight }) => ({
                value: score,
                weight: Math.max(weight, 0.3),
              }))
            ) +
            0.3 * eduCoverage
        );

  const resumeSkillSet = new Set(normalizeSkills(resume.skills));
  const linkedinSkillSet = new Set(normalizeSkills(linkedinProfile.skills));
  const skillsOverlap = jaccardSimilarity(resumeSkillSet, linkedinSkillSet);
  const skillIntersection = [...resumeSkillSet].filter((skill) =>
    linkedinSkillSet.has(skill)
  ).length;
  const resumeSkillCoverage =
    resumeSkillSet.size === 0
      ? 0
      : skillIntersection / Math.max(1, resumeSkillSet.size);
  const skillsScore = clamp01(
    0.65 * skillsOverlap + 0.35 * resumeSkillCoverage
  );

  const summaryAgainstAbout = stringSimilarity(
    resume.summary ?? "",
    linkedinProfile.about
  );
  const headlineAlignment = stringSimilarity(
    resume.targetJobTitle ?? resume.resumeName,
    linkedinProfile.headline
  );
  const summaryScore = clamp01(
    0.6 * summaryAgainstAbout + 0.4 * headlineAlignment
  );

  const sectionScores: VerificationSectionScore[] = [
    {
      section: "identity",
      score: Math.round(identityScore * 100),
      weight: SECTION_WEIGHTS.identity,
      rationale:
        "Name/headline consistency between resume and LinkedIn header.",
      coverage: identityNameScore,
    },
    {
      section: "contact",
      score: Math.round(contactScore * 100),
      weight: SECTION_WEIGHTS.contact,
      rationale:
        "Email/phone consistency across resume and LinkedIn contact block.",
      coverage: contactSignals.length > 0 ? 1 : 0,
    },
    {
      section: "experience",
      score: Math.round(experienceScore * 100),
      weight: SECTION_WEIGHTS.experience,
      rationale:
        "Role/company/date alignment between resume and LinkedIn experiences.",
      coverage: expCoverage,
    },
    {
      section: "education",
      score: Math.round(educationScore * 100),
      weight: SECTION_WEIGHTS.education,
      rationale:
        "School/degree/date alignment between resume and LinkedIn education.",
      coverage: eduCoverage,
    },
    {
      section: "skills",
      score: Math.round(skillsScore * 100),
      weight: SECTION_WEIGHTS.skills,
      rationale:
        "Skill overlap between resume skills and LinkedIn skills section.",
      coverage: skillsScore,
    },
    {
      section: "summary",
      score: Math.round(summaryScore * 100),
      weight: SECTION_WEIGHTS.summary,
      rationale:
        "Consistency between resume summary and LinkedIn about/headline messaging.",
      coverage: summaryScore,
    },
  ];

  const weightedSum = sectionScores.reduce(
    (acc, item) => acc + item.score * item.weight,
    0
  );
  const weightTotal = Object.values(SECTION_WEIGHTS).reduce(
    (acc, val) => acc + val,
    0
  );
  const overallScore = Math.round(weightedSum / Math.max(weightTotal, 1));

  return { sectionScores, overallScore };
}

async function buildGraph(llmOptions?: LLMRuntimeOptions) {
  const GraphState = Annotation.Root({
    resume: Annotation<NormalizedResume>(),
    linkedinText: Annotation<string>(),
    linkedinProfile: Annotation<LinkedInProfile | null>({
      default: () => null,
      reducer: (a, b) => b ?? a,
    }),
    resumeAssertions: Annotation<string[]>({
      default: () => [],
      reducer: (a, b) => [...a, ...b],
    }),
    crossCheckFindings: Annotation<string[]>({
      default: () => [],
      reducer: (a, b) => [...a, ...b],
    }),
  });

  const extractLinkedInNode = async (state: typeof GraphState.State) => {
    const linkedinProfile = await structuredExtract({
      schema: LinkedInProfileSchema,
      input: [
        {
          role: "system",
          content:
            "Extract the LinkedIn PDF exhaustively. Do not infer missing data. Use empty strings/arrays for absent values.",
        },
        {
          role: "user",
          content: `LinkedIn PDF text:\n${state.linkedinText}`,
        },
      ],
      ...llmOptions,
    });
    return { linkedinProfile: normalizeLinkedInProfile(linkedinProfile) };
  };

  const summarizeResumeNode = async (state: typeof GraphState.State) => {
    const llm = createLLM(llmOptions);
    const message = await llm.invoke([
      {
        role: "system",
        content:
          "Convert the resume JSON into precise factual assertions that can be cross-checked. List every field and data point explicitly.",
      },
      {
        role: "user",
        content: `Resume JSON:\n${JSON.stringify(state.resume, null, 2)}`,
      },
    ]);
    const assertions = parseBulletList(toText(message.content));
    return { resumeAssertions: assertions };
  };

  const crossCheckNode = async (state: typeof GraphState.State) => {
    const llm = createLLM({ ...llmOptions, temperature: 0 });
    const message = await llm.invoke([
      {
        role: "system",
        content:
          "Compare resume assertions against LinkedIn data. Return concise discrepancies or confirmations covering identity, contact, experience, education, skills, and summary.",
      },
      {
        role: "user",
        content: `Resume assertions:\n${state.resumeAssertions
          .map((a, idx) => `${idx + 1}. ${a}`)
          .join(
            "\n"
          )}\n\nLinkedIn profile:\n${JSON.stringify(state.linkedinProfile, null, 2)}`,
      },
    ]);
    const findings = parseBulletList(toText(message.content));
    return { crossCheckFindings: findings };
  };

  const workflow = new StateGraph(GraphState)
    .addNode("extractLinkedIn", extractLinkedInNode)
    .addNode("summarizeResume", summarizeResumeNode)
    .addNode("crossCheck", crossCheckNode)
    .addEdge(START, "extractLinkedIn")
    .addEdge("extractLinkedIn", "summarizeResume")
    .addEdge("summarizeResume", "crossCheck")
    .addEdge("crossCheck", END)
    .compile({
      checkpointer: new MemorySaver(),
    });

  return workflow;
}

export async function runResumeLinkedInVerification(params: {
  resume: ResumeExtraction | NormalizedResume;
  linkedinPdfText: string;
  llmOptions?: LLMRuntimeOptions;
}): Promise<VerificationAgentResult> {
  const normalizedResume = normalizeResumeInput(params.resume);
  const graph = await buildGraph(params.llmOptions);
  const state = await graph.invoke(
    {
      resume: normalizedResume,
      linkedinText: params.linkedinPdfText,
      linkedinProfile: null,
      resumeAssertions: [],
      crossCheckFindings: [],
    },
    {
      configurable: {
        thread_id: randomUUID(),
      },
    }
  );

  if (!state.linkedinProfile) {
    throw new Error("LinkedIn profile extraction failed");
  }

  const normalizedLinkedIn = normalizeLinkedInProfile(state.linkedinProfile);
  const { sectionScores, overallScore } = computeSectionScores(
    normalizedResume,
    normalizedLinkedIn
  );

  return {
    linkedinProfile: normalizedLinkedIn,
    resumeAssertions: state.resumeAssertions,
    findings: state.crossCheckFindings,
    sectionScores,
    overallScore,
    scoringMethod: DEFAULT_SCORING_METHOD,
  };
}

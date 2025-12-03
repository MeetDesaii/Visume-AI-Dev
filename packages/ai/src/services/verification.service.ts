import { randomUUID } from "crypto";
import {
  Annotation,
  END,
  MemorySaver,
  START,
  StateGraph,
} from "@langchain/langgraph";
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

// ---------------------------------------------------------------------------
// 1. TYPES & CONFIGURATION
// ---------------------------------------------------------------------------

type ExperienceLike = {
  jobTitle: string;
  employerName: string;
  startedAt?: string | null;
  endedAt?: string | null;
  isCurrentPosition?: boolean;
};

type EducationLike = {
  institutionName: string;
  degreeTypeName?: string;
  fieldOfStudyName?: string;
  graduationAt?: string | null;
};

export type NormalizedResume = {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  workExperiences: ExperienceLike[];
  educations: EducationLike[];
};

export type VerificationSectionScore = {
  section: "identity" | "experience" | "education" | "contact";
  score: number;
  weight: number;
  rationale: string;
  coverage: number;
};

export type VerificationResult = {
  linkedinProfile: LinkedInProfile;
  findings: string;
  sectionScores: VerificationSectionScore[];
  overallScore: number;
  scoringMethod: string;
};

const SECTION_WEIGHTS = {
  experience: 0.4,
  education: 0.4,
  identity: 0.15,
  contact: 0.05,
} as const;

// ---------------------------------------------------------------------------
// 2. HELPERS
// ---------------------------------------------------------------------------

function normalizeString(str?: string): string {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "");
}

function tokenize(text: string): Set<string> {
  return new Set(text.split(/\s+/).filter((t) => t.length > 2));
}

function jaccardIndex(a: string, b: string): number {
  const setA = tokenize(normalizeString(a));
  const setB = tokenize(normalizeString(b));
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const token of setA) if (setB.has(token)) intersection++;
  return intersection / (setA.size + setB.size - intersection);
}

function normalizeDate(value?: string | Date | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function dateScore(d1: string | null, d2: string | null): number {
  if (!d1 && !d2) return 1;
  if (!d1 || !d2) return 0.2;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const months = Math.abs(
    (date2.getFullYear() - date1.getFullYear()) * 12 +
      (date2.getMonth() - date1.getMonth())
  );
  if (months === 0) return 1.0;
  if (months <= 1) return 0.95;
  if (months <= 3) return 0.8;
  if (months <= 6) return 0.5;
  return 0.1;
}

// ---------------------------------------------------------------------------
// 3. GRAPH STATE
// ---------------------------------------------------------------------------

const GraphState = Annotation.Root({
  resume: Annotation<NormalizedResume>(),
  linkedinText: Annotation<string>(),
  linkedinProfile: Annotation<LinkedInProfile>(),

  experienceReport: Annotation<string>({
    default: () => "",
    reducer: (curr, next) => next,
  }),
  educationReport: Annotation<string>({
    default: () => "",
    reducer: (curr, next) => next,
  }),
  mathScores: Annotation<{
    sectionScores: VerificationSectionScore[];
    overallScore: number;
  }>({
    reducer: (curr, next) => next,
  }),
});

// ---------------------------------------------------------------------------
// 4. NODES (With Updated Formatting Prompts)
// ---------------------------------------------------------------------------

const extractNode = async (state: typeof GraphState.State, config: any) => {
  const profile = await structuredExtract({
    schema: LinkedInProfileSchema,
    input: [
      { role: "system", content: "Extract LinkedIn profile data strictly." },
      { role: "user", content: state.linkedinText },
    ],
    ...config.configurable?.llmOptions,
  });

  const normalizedProfile: LinkedInProfile = {
    ...profile,
    experiences: profile.experiences.map((e: any) => ({
      ...e,
      startedAt: normalizeDate(e.startedAt) ?? undefined,
      endedAt: normalizeDate(e.endedAt) ?? undefined,
    })),
    educations: profile.educations.map((e: any) => ({
      ...e,
      graduationAt: normalizeDate(e.graduationAt) ?? undefined,
    })),
  };

  return { linkedinProfile: normalizedProfile };
};

const experienceVerifierNode = async (
  state: typeof GraphState.State,
  config: any
) => {
  const llm = createLLM({ ...config.configurable?.llmOptions, temperature: 0 });

  const prompt = `
  You are a **Senior Background Check Analyst**.

Your goal is to compare the Work Experience sections from a candidate’s **Resume** and **LinkedIn profile** and produce a **clean, spacious Markdown report**.

---

### INPUT DATA

RESUME_EXPERIENCES (JSON):

${JSON.stringify(state.resume.workExperiences)}

LINKEDIN_EXPERIENCES (JSON):

${JSON.stringify(state.linkedinProfile.experiences)}

Both inputs are arrays of work experience objects. Use only the data provided; do **not** invent or assume missing values.

---

### OVERALL OUTPUT REQUIREMENTS (VERY STRICT)

- Output **valid Markdown only**.
- Do **not** wrap the entire answer in code fences.
- Do **not** include any explanations about what you are doing.
- The response must contain **only**:
  1. The heading ### 💼 Experience Verification
  2. The Markdown table
  3. The analysis section (heading + bulleted list)
- Other then the three parts heading, table and analysis you can add **one** or **two** parts of your own if needed but those parts are **needed**

---

### 1. STRUCTURE

1. First line must be:

   ### 💼 Experience Verification

2. Immediately after the heading, output a **Markdown table**.

3. After the table, output an **"Analysis" section** as a bulleted list of observations.

---

### 2. TABLE FORMAT

**Table header (fixed, exactly this):**

| Company | Role | Resume Timeline | LinkedIn Timeline | Status |
| --- | --- | --- | --- | --- |

**Columns:**

1. **Company**
   - Use the company/employer name from the respective record(s).
   - If the company name is very long (over ~40–50 characters), insert a <br> at a sensible word boundary to improve readability.
   - Example: Very Long Company Name Pvt Ltd <br> International Division.

2. **Role**
   - Use the job title (e.g., “Software Engineer”, “Senior Data Analyst”).
   - If missing, use —.

3. **Resume Timeline**
   - Combine **start date** and **end date** from the resume entry into a single string:
     - Format: START_DATE - END_DATE.
   - **DATE FORMAT (preferred)**:
     - Use D MMM YYYY when day, month, and year are available.  
       Example: 1 Jan 2022.
   - **Fallback rules (if parts of the date are missing)**:
     - If only month and year are available: MMM YYYY (e.g., Jan 2022).
     - If only year is available: YYYY (e.g., 2022).
   - If the end date is missing but the role is marked as current (or equivalent):
     - Use START_DATE - Present.
   - If a date cannot be parsed at all, use — for that side of the range.
   - Examples:
     - 1 Jan 2022 - 1 Dec 2022
     - Jan 2022 - Present
     - 2020 - 2022

4. **LinkedIn Timeline**
   - Same formatting and combination rules as “Resume Timeline”:
     - START_DATE - END_DATE or START_DATE - Present.
     - Use D MMM YYYY when possible, otherwise fall back to MMM YYYY or YYYY.
     - Use — if a date is missing or not parseable.
   - Examples:
     - 1 Jan 2022 - 1 Dec 2022
     - Mar 2020 - Present
     - 2018 - 2020

5. **Status**
   - Use **only** one of these icons:
     - ✅ — Experience entry matches reasonably well between Resume and LinkedIn.
     - ⚠️ — Partial or minor discrepancies (e.g., slightly different job title, small date differences, differing employment type).
     - ❌ — Clear conflict or major discrepancy (e.g., different company, very different timelines, appears only on one source).
   - The cell must contain **only** the icon, no text.

---

### 3. MATCHING LOGIC (IMPORTANT)

- Try to **match work experience entries** between Resume and LinkedIn using:
  - **Company name** (case-insensitive, ignoring punctuation and common variations like “Ltd”, “LLC”, “Inc.” when possible).
  - **Role title similarity** (e.g., “Software Engineer” ~ “Software Engineer I”, “Senior Analyst” ~ “Sr. Analyst”).
  - **Timeline overlap** (similar or overlapping date ranges).
  - Optionally, **location** if available and helpful (but don’t require it).

- For each matched pair (Resume + LinkedIn):
  - Show them in a **single row**.
  - Fill both "Resume Timeline" and "LinkedIn Timeline".
  - Set the **Status** based on how closely they match.

- For entries that exist **only in Resume** (no reasonable match found in LinkedIn):
  - Create a row where:
    - Resume fields are filled.
    - LinkedIn timeline is —.
    - Status is usually ❌ (or ⚠️ if it could plausibly be an omission or incomplete LinkedIn profile).

- For entries that exist **only in LinkedIn**:
  - Create a row where:
    - LinkedIn fields are filled.
    - Resume timeline is —.
    - Status is usually ❌ (or ⚠️ if it could plausibly be an omission or incomplete resume).

- If LinkedIn has a **single aggregated role** (e.g., “Company X – 3 positions”) but the resume has separate roles, or vice versa:
  - Match them **as best as possible** based on titles and dates.
  - If the mapping is unclear, prefer separate rows with ⚠️ or ❌ rather than forcing an incorrect match.

- If you cannot confidently match entries, treat

  `;

  const response = await llm.invoke([{ role: "user", content: prompt }]);
  return { experienceReport: response.content as string };
};

const educationVerifierNode = async (
  state: typeof GraphState.State,
  config: any
) => {
  const llm = createLLM({ ...config.configurable?.llmOptions, temperature: 0 });

  const prompt = `You are an **Education Verification Specialist**.

Your goal is to compare the Education sections from a candidate’s **Resume** and **LinkedIn profile** and produce a **clean, spacious Markdown report**.

---

### INPUT DATA

RESUME_EDUCATIONS (JSON):

${JSON.stringify(state.resume.educations)}

LINKEDIN_EDUCATIONS (JSON):

${JSON.stringify(state.linkedinProfile.educations)}

Both inputs are arrays of education objects. Use only the data provided; do **not** invent or assume missing values.

---

### OVERALL OUTPUT REQUIREMENTS (VERY STRICT)

- Output **valid Markdown only**.
- Do **not** wrap the entire answer in code fences.
- Do **not** include any explanations about what you are doing.
- The response must contain **only**:
  1. The heading ### 🎓 Education Verification
  2. The Markdown table
  3. The analysis section (bulleted list)
- Other then the three parts heading, table and analysis you can add **one** or **two** parts of your own if needed but those parts are **needed**

---

### 1. STRUCTURE

1. First line must be:

   ### 🎓 Education Verification

2. Immediately after the heading, output a **Markdown table**.

3. After the table, output an **"Analysis" section** as a bulleted list of observations.

---

### 2. TABLE FORMAT

**Table header (fixed, exactly this):**

| Institution | Degree | Grad Year in Resume | Grad Year in LinkedIn | Status |
| --- | --- | --- | --- | --- |

**Columns:**

1. **Institution**
   - Use the institution name from the respective record(s).
   - If the institution name is very long (over ~40–50 characters), insert a <br> at a sensible word boundary to improve readability.
   - Example: University of Really Long Name <br> Department of Computer Science.

2. **Degree**
   - Use the degree or qualification name (e.g., “BSc Computer Science”, “Master of Business Administration”).
   - If missing, use —.

3. **Grad Year in Resume**
   - Extract the **end/completion date** from the resume entry.
   - Format as:
     - D MMM YYYY if day and month are available (e.g., 1 May 2023).
     - MMM YYYY if only month and year are available (e.g., May 2023).
     - YYYY if only year is available (e.g., 2023).
   - If there is no end date or it cannot be parsed, use —.

4. **Grad Year in LinkedIn**
   - Same formatting rules as “Grad Year in Resume”.
   - If missing or not parseable, use —.

5. **Status**
   - Use **only** one of these icons:
     - ✅  — Education entry matches reasonably well between Resume and LinkedIn.
     - ⚠️  — Partial or minor discrepancies (e.g., slightly different degree name, minor date differences).
     - ❌  — Clear conflict or major discrepancy (e.g., different institution, very different dates, appears only on one source).
   - The cell must contain **only** the icon, no text.

---

### 3. MATCHING LOGIC (IMPORTANT)

- Try to **match education entries** between Resume and LinkedIn using:
  - Institution name (case-insensitive, ignoring punctuation and common stopwords like “University of”, “College of”, etc., when possible).
  - Degree/qualification similarity (e.g., “BSc Computer Science” ~ “Bachelor of Science in Computer Science”).
  - Overlapping or similar graduation years.

- For each matched pair (Resume + LinkedIn):
  - Show them in a **single row**.
  - Fill both "Grad Year in Resume" and "Grad Year in LinkedIn".
  - Set the **Status** based on how closely they match.

- For entries that exist **only in Resume** (no reasonable match found in LinkedIn):
  - Create a row where:
    - Resume fields are filled.
    - LinkedIn grad year is —.
    - Status is usually ❌ (or ⚠️ if it could plausibly be an incomplete profile).

- For entries that exist **only in LinkedIn**:
  - Create a row where:
    - LinkedIn fields are filled.
    - Resume grad year is —.
    - Status is usually ❌ (or ⚠️ if it could plausibly be an omission).

- If you cannot confidently match entries, treat them as separate rows instead of forcing a match.

---

### 4. ANALYSIS SECTION

After the table, add a blank line and then:

#### Analysis

Then provide a bulleted list with your key findings.

Formatting rules:

- Use - for bullets.
- Add **one empty line** between each bullet for readability.
- **Bold** key discrepancies and important phrases.

Content guidelines:

- Highlight:
  - **Institution name mismatches** (e.g., abbreviations vs. full names, completely different institutions).
  - **Different graduation dates or years**.
  - Entries **present only in Resume** or **only in LinkedIn**.
  - Any **suspicious patterns** (e.g., overlapping degrees that seem unlikely, inconsistent degree levels).

- Example bullet style:

  - **Graduation year mismatch** for ABC University: Resume shows **2019**, LinkedIn shows **2020**.

  
  - Degree title differs for XYZ College: Resume lists **"BSc Computer Science"**, LinkedIn lists **"Bachelor of Science in Computer Science"** (likely the same degree, minor wording difference).

  
  - **Education entry present only in LinkedIn**: Master’s degree at **DEF University** is not mentioned in the resume.

- If everything aligns well, explicitly state that there are no major discrepancies.

---

### 5. GENERAL BEHAVIOR

- Do **not** invent institutions, degrees, or dates.
- If a date cannot be parsed, show — in the table and explain it in the Analysis if relevant.
- Keep the tone neutral and factual.
- The response must be complete in a **single pass** and fully compliant with the structure and formatting above.
`;

  const response = await llm.invoke([{ role: "user", content: prompt }]);
  return { educationReport: response.content as string };
};

const scoringNode = async (state: typeof GraphState.State) => {
  const resume = state.resume;
  const li = state.linkedinProfile;

  // 1. Experience Score
  const expScores = resume.workExperiences.map((rExp) => {
    let best = 0;
    for (const lExp of li.experiences) {
      const companyScore = jaccardIndex(rExp.employerName, lExp.companyName);
      const titleScore = jaccardIndex(rExp.jobTitle, lExp.title);
      const startScore = dateScore(
        rExp.startedAt || null,
        lExp.startedAt || null
      );

      let endScore = 0;
      if (rExp.isCurrentPosition) {
        // If resume says Current, LinkedIn must have no end date or be marked current
        endScore = !lExp.endedAt ? 1 : 0;
      } else {
        endScore = dateScore(rExp.endedAt || null, lExp.endedAt || null);
      }

      const combined =
        companyScore * 0.4 +
        titleScore * 0.3 +
        startScore * 0.15 +
        endScore * 0.15;
      if (combined > best) best = combined;
    }
    return best;
  });
  const expFinal = expScores.length
    ? expScores.reduce((a, b) => a + b, 0) / expScores.length
    : 0;

  // 2. Education Score
  const eduScores = resume.educations.map((rEdu) => {
    let best = 0;
    for (const lEdu of li.educations) {
      const school = jaccardIndex(rEdu.institutionName, lEdu.institutionName);
      const degree = jaccardIndex(
        rEdu.degreeTypeName || "",
        lEdu.degreeTypeName || ""
      );
      const val = school * 0.6 + degree * 0.4;
      if (val > best) best = val;
    }
    return best;
  });
  const eduFinal = eduScores.length
    ? eduScores.reduce((a, b) => a + b, 0) / eduScores.length
    : 0;

  // 3. Identity
  const nameScore = jaccardIndex(
    `${resume.firstName} ${resume.lastName}`,
    `${li.firstName} ${li.lastName}`
  );

  // 4. Contact
  const contactScore =
    resume.email && li.email && resume.email === li.email ? 1 : 0.5;

  const sections: VerificationSectionScore[] = [
    {
      section: "identity",
      score: Math.round(nameScore * 100),
      weight: SECTION_WEIGHTS.identity,
      rationale: "Name alignment",
      coverage: nameScore,
    },
    {
      section: "experience",
      score: Math.round(expFinal * 100),
      weight: SECTION_WEIGHTS.experience,
      rationale: "History alignment",
      coverage: expFinal,
    },
    {
      section: "education",
      score: Math.round(eduFinal * 100),
      weight: SECTION_WEIGHTS.education,
      rationale: "Degree alignment",
      coverage: eduFinal,
    },
    {
      section: "contact",
      score: Math.round(contactScore * 100),
      weight: SECTION_WEIGHTS.contact,
      rationale: "Contact check",
      coverage: contactScore,
    },
  ];

  const overall = sections.reduce(
    (acc, curr) => acc + curr.score * curr.weight,
    0
  );

  return {
    mathScores: {
      sectionScores: sections,
      overallScore: Math.round(overall),
    },
  };
};

// ---------------------------------------------------------------------------
// 5. GRAPH CONSTRUCTION
// ---------------------------------------------------------------------------

function buildVerificationGraph() {
  const workflow = new StateGraph(GraphState)
    .addNode("extractor", extractNode)
    .addNode("exp_agent", experienceVerifierNode)
    .addNode("edu_agent", educationVerifierNode)
    .addNode("scorer", scoringNode)
    .addEdge(START, "extractor")
    .addEdge("extractor", "exp_agent")
    .addEdge("extractor", "edu_agent")
    .addEdge("extractor", "scorer")
    .addEdge("exp_agent", END)
    .addEdge("edu_agent", END)
    .addEdge("scorer", END);

  return workflow.compile({ checkpointer: new MemorySaver() });
}

// ---------------------------------------------------------------------------
// 6. MAIN EXPORT
// ---------------------------------------------------------------------------

function normalizeResumeInput(
  resume: ResumeExtraction | NormalizedResume
): NormalizedResume {
  const src = resume as any;
  return {
    firstName: src.firstName ?? "",
    lastName: src.lastName ?? "",
    email: src.email ?? "",
    phoneNumber: src.phoneNumber ?? "",
    workExperiences: (src.workExperiences ?? []).map((exp: any) => ({
      jobTitle: exp.jobTitle ?? "",
      employerName: exp.employerName ?? "",
      startedAt: normalizeDate(exp.startedAt),
      endedAt: normalizeDate(exp.endedAt),
      isCurrentPosition: Boolean(exp.isCurrentPosition),
    })),
    educations: (src.educations ?? []).map((edu: any) => ({
      institutionName: edu.institutionName ?? "",
      degreeTypeName: edu.degreeTypeName ?? "",
      fieldOfStudyName: edu.fieldOfStudyName ?? "",
      graduationAt: normalizeDate(edu.graduationAt),
    })),
  };
}

export async function runResumeLinkedInVerification(params: {
  resume: ResumeExtraction | NormalizedResume;
  linkedinPdfText: string;
  llmOptions?: LLMRuntimeOptions;
}): Promise<VerificationResult> {
  const graph = buildVerificationGraph();
  const normalizedResume = normalizeResumeInput(params.resume);

  const result = await graph.invoke(
    {
      resume: normalizedResume,
      linkedinText: params.linkedinPdfText,
    },
    {
      configurable: {
        thread_id: randomUUID(),
        llmOptions: params.llmOptions,
      },
    }
  );

  // Combine the reports into one beautiful Markdown string
  const fullReport = `
# Verification Report 📋
**Overall Match Score:** ${result.mathScores.overallScore}/100

<br>

${result.experienceReport}

<br>

${result.educationReport}
  `;

  return {
    linkedinProfile: result.linkedinProfile,
    findings: fullReport.trim(),
    sectionScores: result.mathScores.sectionScores,
    overallScore: result.mathScores.overallScore,
    scoringMethod: "parallel_formatted_report_v6",
  };
}

"use client";

import { useMemo } from "react";
import { cn } from "@visume/ui/lib/utils";

interface ResumeTextPreviewProps {
  text?: string;
  className?: string;
}

// Resume sections definition
const RESUME_SECTIONS = [
  {
    id: "header",
    displayName: "Header",
    keywords: [], // Special section for name, contact info
    order: 0,
  },
  {
    id: "summary",
    displayName: "Professional Summary",
    keywords: [
      "professional summary",
      "summary",
      "profile",
      "about me",
      "objective",
      "career objective",
    ],
    order: 1,
  },
  {
    id: "personalInfo",
    displayName: "Personal Information",
    keywords: ["personal information", "personal info", "personal details"],
    order: 2,
  },
  {
    id: "workExperience",
    displayName: "Work Experience",
    keywords: [
      "work experience",
      "experience",
      "professional experience",
      "employment history",
      "work history",
    ],
    order: 3,
  },
  {
    id: "volunteerExperience",
    displayName: "Volunteer Experience",
    keywords: ["volunteer experience", "volunteer work", "volunteering"],
    order: 4,
  },
  {
    id: "education",
    displayName: "Education",
    keywords: ["education", "academic background", "qualifications"],
    order: 5,
  },
  {
    id: "certifications",
    displayName: "Certifications",
    keywords: [
      "certifications",
      "certificates",
      "licenses",
      "credentials",
      "professional certifications",
    ],
    order: 6,
  },
  {
    id: "skills",
    displayName: "Skills",
    keywords: [
      "skills",
      "technical skills",
      "core competencies",
      "competencies",
      "expertise",
    ],
    order: 7,
  },
  {
    id: "projects",
    displayName: "Projects",
    keywords: ["projects", "portfolio", "key projects"],
    order: 8,
  },
  {
    id: "links",
    displayName: "Links",
    keywords: ["links", "online profiles", "social media", "portfolio links"],
    order: 9,
  },
] as const;

// Regex patterns for text parsing
const REGEX_PATTERNS = {
  pageMarkers: /^\d+\s*\/\s*\d+\s*--.*?--\s*$/gm,
  datePattern: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/,
  location: /^[A-Z][a-z]+,\s*[A-Z]/,
  emailOrUrl: /@|\.com|\.io|\.net|\.org|\.edu|https?:\/\//i,
  phoneNumber: /\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/,
  allCaps: /^[A-Z\s&'-]+$/,
} as const;

interface ResumeSection {
  id: string;
  displayName: string;
  content: string[];
  startIndex: number;
}

interface ParsedResume {
  header: string[];
  sections: ResumeSection[];
}

/**
 * Normalizes text for section matching (lowercase, remove special chars)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .trim();
}

/**
 * Checks if a line matches any section keywords
 */
function matchSection(line: string): string | null {
  const normalized = normalizeText(line);

  for (const section of RESUME_SECTIONS) {
    if (section.id === "header") continue; // Skip header section

    for (const keyword of section.keywords) {
      if (normalized === normalizeText(keyword)) {
        return section.id;
      }
    }
  }

  return null;
}

/**
 * Checks if a line is a section header
 */
function isSectionHeader(line: string): boolean {
  const trimmed = line.trim();

  // Must be all caps or match a known section
  const isAllCaps = REGEX_PATTERNS.allCaps.test(trimmed) && trimmed.length > 2;
  const matchesKnownSection = matchSection(trimmed) !== null;

  return isAllCaps || matchesKnownSection;
}

/**
 * Parses resume text into structured sections
 */
function parseResumeText(text: string): ParsedResume {
  const cleanText = text.replace(REGEX_PATTERNS.pageMarkers, "");
  const lines = cleanText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const parsed: ParsedResume = {
    header: [],
    sections: [],
  };

  let currentSection: ResumeSection | null = null;
  let headerEnded = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Type guard: ensure line exists
    if (!line) continue;

    // Check if this is a section header
    const sectionId = matchSection(line);

    if (sectionId) {
      // Save previous section if exists
      if (currentSection && currentSection.content.length > 0) {
        parsed.sections.push(currentSection);
      }

      // Start new section
      const sectionDef = RESUME_SECTIONS.find((s) => s.id === sectionId);
      currentSection = {
        id: sectionId,
        displayName: sectionDef?.displayName ?? line,
        content: [],
        startIndex: i,
      };
      headerEnded = true;
      continue;
    }

    // If we haven't found any sections yet, it's part of the header
    if (!headerEnded) {
      // Check if this looks like a section header (even if not matched)
      if (isSectionHeader(line)) {
        headerEnded = true;
        // Treat as unknown section
        currentSection = {
          id: normalizeText(line),
          displayName: line,
          content: [],
          startIndex: i,
        };
        continue;
      }

      // Add to header (name, contact, title, etc.)
      if (i < 10) {
        // Only first 10 lines can be header
        parsed.header.push(line);
      }
      continue;
    }

    // Check if this is an unrecognized section header
    if (isSectionHeader(line) && currentSection) {
      // Save previous section
      if (currentSection.content.length > 0) {
        parsed.sections.push(currentSection);
      }

      // Start new unknown section
      currentSection = {
        id: normalizeText(line),
        displayName: line,
        content: [],
        startIndex: i,
      };
      continue;
    }

    // Add content to current section
    if (currentSection) {
      currentSection.content.push(line);
    }
  }

  // Add last section
  if (currentSection && currentSection.content.length > 0) {
    parsed.sections.push(currentSection);
  }

  return parsed;
}

/**
 * Renders header section (name, contact info, title)
 */
function renderHeader(lines: string[]): React.ReactNode {
  if (lines.length === 0) return null;

  return (
    <div className="mb-8 pb-6 border-b border-border">
      {lines.map((line, index) => {
        const hasContact =
          REGEX_PATTERNS.emailOrUrl.test(line) ||
          REGEX_PATTERNS.phoneNumber.test(line);
        const hasLocation = REGEX_PATTERNS.location.test(line);

        // First line is likely the name
        if (index === 0) {
          return (
            <h1
              key={`header-${index}`}
              className="text-3xl font-bold mb-2 text-foreground"
            >
              {line}
            </h1>
          );
        }

        // Contact information
        if (hasContact || hasLocation) {
          return (
            <p
              key={`header-${index}`}
              className="text-sm text-muted-foreground"
            >
              {line}
            </p>
          );
        }

        // Job title or subtitle
        if (index === 1) {
          return (
            <p
              key={`header-${index}`}
              className="text-lg text-muted-foreground mb-2"
            >
              {line}
            </p>
          );
        }

        // Other header content
        return (
          <p key={`header-${index}`} className="text-sm text-muted-foreground">
            {line}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Renders a single content line with appropriate styling
 */
function renderContentLine(line: string, index: number): React.ReactNode {
  const hasDate = REGEX_PATTERNS.datePattern.test(line);

  // Job title or education entry with dates
  if (hasDate) {
    return (
      <p
        key={`content-${index}`}
        className="text-sm font-medium text-foreground mt-3 mb-1"
      >
        {line}
      </p>
    );
  }

  // Bullet points
  if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
    return (
      <p
        key={`content-${index}`}
        className="text-sm leading-relaxed text-foreground ml-4 mb-1"
      >
        {line}
      </p>
    );
  }

  // Regular paragraph
  return (
    <p
      key={`content-${index}`}
      className="text-sm leading-relaxed text-foreground mb-2"
    >
      {line}
    </p>
  );
}

/**
 * Renders a resume section
 */
function renderSection(section: ResumeSection): React.ReactNode {
  if (section.content.length === 0) return null;

  return (
    <section key={section.id} className="mb-6">
      <h2 className="text-base font-bold uppercase tracking-wide mb-3 text-foreground border-b border-border pb-1">
        {section.displayName}
      </h2>
      <div className="space-y-1">
        {section.content.map((line, index) => renderContentLine(line, index))}
      </div>
    </section>
  );
}

export function ResumeTextPreview({ text, className }: ResumeTextPreviewProps) {
  // Memoize the parsed resume structure
  const parsedResume = useMemo(() => {
    if (!text?.trim()) return null;
    return parseResumeText(text);
  }, [text]);

  // Empty state
  if (
    !parsedResume ||
    (parsedResume.header.length === 0 && parsedResume.sections.length === 0)
  ) {
    return (
      <div
        className={cn(
          "flex items-center justify-center h-full text-muted-foreground",
          className,
        )}
      >
        <p className="text-sm">No resume content available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-full", className)}>
      <div className="w-full h-full  ">
        <div className="h-full overflow-y-auto  ">
          <article aria-label="Resume preview">
            {/* Render header */}
            {renderHeader(parsedResume.header)}

            {/* Render sections that have content */}
            {parsedResume.sections.map(renderSection)}
          </article>
        </div>
      </div>
    </div>
  );
}

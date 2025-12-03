import { Section } from "@/components/dashboard/resumes/details/resume-content";
import { Suggestions } from "@visume/types/models/suggestions";

import {
  ScrollText,
  User,
  Briefcase,
  GraduationCap,
  BookMarked,
  Box,
  FolderOpenDot,
  LinkIcon,
} from "lucide-react";

export const sections: Section[] = [
  { name: "Professional Summary", id: "summary", icon: ScrollText },
  { name: "Personal Info", id: "personalInfo", icon: User },
  { name: "Work Experience", id: "workExperience", icon: Briefcase },
  { name: "Volunteer Experience", id: "volunteerExperience", icon: Briefcase },
  { name: "Education", id: "education", icon: GraduationCap },
  { name: "Certifications", id: "certifications", icon: BookMarked },
  { name: "Skills", id: "skills", icon: Box },
  { name: "Projects", id: "projects", icon: FolderOpenDot },
  { name: "Links", id: "links", icon: LinkIcon },
];

// map incoming labels to canonical ids
export const sectionAliasToId: Record<string, string> = {
  // Summary
  "professional summary": "summary",
  summary: "summary",
  // Personal Info
  "personal info": "personalInfo",
  "contact info": "personalInfo",
  contact: "personalInfo",
  // Work Experience
  "work experience": "workExperience",
  experience: "workExperience",
  // Volunteer
  "volunteer experience": "volunteerExperience",
  volunteer: "volunteerExperience",
  // Education
  education: "education",
  // Certifications
  certifications: "certifications",
  certification: "certifications",
  // Skills
  skills: "skills",
  // Projects
  projects: "projects",
  project: "projects",
  // Links
  links: "links",
  link: "links",
};

function normalizeToSectionId(raw?: string): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  return sectionAliasToId[key] ?? null;
}

const sectionIndex: Record<string, number> = sections.reduce(
  (acc, s, i) => ((acc[s.id] = i), acc),
  {} as Record<string, number>,
);

const priorityRank: Record<string, number> = { CRITICAL: 0, RECOMMENDED: 1 };

export function sortSuggestions(
  suggestions: Suggestions[],
  opts?: { sortItems?: boolean; includeEmpty?: boolean },
) {
  const { sortItems = true, includeEmpty = false } = opts ?? {};

  // init buckets while preserving your section order
  const buckets = new Map<string, Suggestions[]>();
  for (const s of sections) buckets.set(s.id, []);

  // drop each suggestion into the canonical bucket
  for (const s of suggestions) {
    const canonicalId = normalizeToSectionId(s.sectionName);
    if (!canonicalId || !buckets.has(canonicalId)) continue;
    buckets.get(canonicalId)!.push(s);
  }

  // build result in your defined order and attach icons
  const grouped = [];
  for (const sec of sections) {
    const items = buckets.get(sec.id)!;

    if (sortItems && items.length > 0) {
      items.sort((a, b) => {
        const pr =
          (priorityRank[a.priority] ?? 99) - (priorityRank[b.priority] ?? 99);
        if (pr !== 0) return pr;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
    }

    if (includeEmpty || items.length > 0) {
      grouped.push({
        sectionId: sec.id,
        sectionName: sec.name,
        icon: sec.icon, // <— pass the icon through
        items,
      });
    }
  }

  return grouped;
}

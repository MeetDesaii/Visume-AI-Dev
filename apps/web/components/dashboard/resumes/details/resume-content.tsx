"use client";

import React from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@visume/ui/components/tabs";
import { ResumeReview, ResumeWithOutJob } from "@visume/types";
import { Sparkles, Text } from "lucide-react";
import ResumeInfoList from "./resume-info-list";
import ResumeSuggestionsList from "./resume-suggestion-list";
import {
  Icon,
  IconBlocks,
  IconBooks,
  IconBriefcase,
  IconBriefcase2,
  IconBubbleText,
  IconCertificate,
  IconFolder,
  IconLink,
  IconProps,
  IconUser,
} from "@tabler/icons-react";

export type Section = {
  name: string;
  id: string;
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<Icon>>;
};

export const sections: Section[] = [
  {
    name: "Summary",
    id: "summary",
    icon: IconBubbleText,
  },
  {
    name: "Personal Info",
    id: "personalInfo",
    icon: IconUser,
  },
  {
    name: "Work Experience",
    id: "workExperience",
    icon: IconBriefcase2,
  },
  {
    name: "Volunteer Experience",
    id: "volunteerExperience",
    icon: IconBriefcase,
  },
  {
    name: "Education",
    id: "education",
    icon: IconBooks,
  },
  {
    name: "Certifications",
    id: "certifications",
    icon: IconCertificate,
  },
  {
    name: "Skills",
    id: "skills",
    icon: IconBlocks,
  },
  {
    name: "Projects",
    id: "projects",
    icon: IconFolder,
  },
  {
    name: "Links",
    id: "links",
    icon: IconLink,
  },
];

export default function ResumeContent({
  resume,
}: {
  resume: ResumeWithOutJob;
}) {
  return (
    <div>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg text-muted-foreground">Information</h2>
      </div>
      <div className="p-4">
        <ResumeInfoList resume={resume} />
      </div>
    </div>
  );
}

"use client";

import { ResumeDTO, ResumeWithOutJob } from "@visume/types";
import React from "react";
import { ResumeTextPreview } from "./resume-text-preview";
import { ScrollArea } from "@visume/ui/components/scroll-area";

export default function ResumeView({ resume }: { resume: ResumeWithOutJob }) {
  return (
    <div className="h-full flex flex-col">
      <div className="border-b px-4 py-3">
        <h2 className="text-lg text-muted-foreground">
          {resume.job.company.name} - {resume.job.title}
        </h2>
      </div>

      <ScrollArea className=" h-[calc(100vh_-_90px)]">
        <div className="flex-1 overflow-y-auto p-6">
          <ResumeTextPreview text={resume.sourceInfo.rawText} />
        </div>
      </ScrollArea>
    </div>
  );
}

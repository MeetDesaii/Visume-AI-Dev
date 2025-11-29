"use client";

import {
  IconFile,
  IconFileTypeDocx,
  IconFileTypePdf,
} from "@tabler/icons-react";
import { ResumeDTO } from "@visume/types";
import { Card, CardContent, CardHeader } from "@visume/ui/components/card";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@visume/ui/lib/utils";

export default function ResumeCard({
  resume,
  isLink = true,
  selected = false,
  onSelect,
}: {
  resume: ResumeDTO;
  isLink?: boolean;
  selected?: boolean;
  onSelect?: (resume: ResumeDTO) => void;
}) {
  if (isLink) {
    return (
      <Link
        href={`/dashboard/resumes/${resume._id}/editor`}
        rel="noopener noreferrer"
        target="_blank"
        className="block"
      >
        <Card className="bg-primary/10 p-5 rounded-2xl min-h-40 flex border-0 flex-col justify-between cursor-pointer hover:bg-primary/20">
          <CardHeader className="overflow-hidden p-0">
            {resume.sourceInfo.resumeName?.includes(".pdf") ? (
              <IconFileTypePdf
                className="text-destructive"
                size={45}
                stroke={1.25}
              />
            ) : resume.sourceInfo.resumeName?.includes(".docx") ? (
              <IconFileTypeDocx
                className="text-primary"
                size={45}
                stroke={1.25}
              />
            ) : (
              <IconFile className="text-primary" size={45} stroke={1.25} />
            )}
          </CardHeader>

          <CardContent className="p-0">
            <div className="space-y-1">
              <h3 className="text-xl">{resume.resumeName}</h3>
              <p className="text-sm text-muted-foreground">
                {format(resume.createdAt, "do MMM yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onSelect?.(resume)}
      className="text-left"
    >
      <Card
        className={cn(
          "bg-primary/10 p-5 rounded-2xl min-h-40 flex border-0 flex-col justify-between cursor-pointer hover:bg-primary/20 transition-all",
          selected && "ring-2 ring-primary shadow-lg bg-primary/20"
        )}
      >
        <CardHeader className="overflow-hidden p-0">
          {resume.sourceInfo.resumeName?.includes(".pdf") ? (
            <IconFileTypePdf className="text-primary" size={45} stroke={1.25} />
          ) : resume.sourceInfo.resumeName?.includes(".docx") ? (
            <IconFileTypeDocx
              className="text-primary"
              size={45}
              stroke={1.25}
            />
          ) : (
            <IconFile className="text-primary" size={45} stroke={1.25} />
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="space-y-1">
            <h3 className="text-xl">{resume.resumeName}</h3>
            <p className="text-sm text-muted-foreground">
              {format(resume.createdAt, "do MMM yyyy")}
            </p>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

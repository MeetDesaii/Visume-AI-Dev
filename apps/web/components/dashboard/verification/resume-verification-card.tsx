import {
  IconBrandLinkedin,
  IconBrandLinkedinFilled,
  IconFile,
  IconFileTypeDocx,
  IconFileTypePdf,
} from "@tabler/icons-react";
import {
  LinkedInProfileDTO,
  LinkedInProfileSummaryDTO,
  ResumeDTO,
  ResumeSummaryDTO,
} from "@visume/types";
import { Separator } from "@visume/ui/components/separator";
import { format } from "date-fns";
import Link from "next/link";

export default function ResumeVerificationCard({
  resume,
  linkdinProfile,
}: {
  resume: ResumeSummaryDTO | string;
  linkdinProfile: LinkedInProfileSummaryDTO | string;
}) {
  if (typeof resume === "string" || typeof linkdinProfile === "string") {
    return <div>Loading (string)...</div>;
  }
  return (
    <Link
      href={`/dashboard/verified-resumes/${resume._id}/report`}
      rel="noopener noreferrer"
      target="_blank"
      className="block"
    >
      <div className="bg-primary/10  p-5 rounded-2xl min-h-40  border-0 h-full flex flex-col gap-4 cursor-pointer hover:bg-primary/20">
        <div className="flex flex-col gap-3">
          <div className="overflow-hidden p-0">
            {resume.sourceInfo.resumeName?.includes(".pdf") ? (
              <IconFileTypePdf
                className="text-destructive"
                size={45}
                stroke={1.25}
              />
            ) : resume.sourceInfo.resumeName?.includes(".docx") ? (
              <IconFileTypeDocx
                className="text-blue-500"
                size={45}
                stroke={1.25}
              />
            ) : (
              <IconFile className="text-primary" size={45} stroke={1.25} />
            )}
          </div>

          <div className="p-0">
            <div className="space-y-1">
              <h3 className="text-xl">{resume.resumeName}</h3>
            </div>
          </div>
        </div>
        <Separator orientation="horizontal" className="bg-primary/40" />
        {linkdinProfile.headline && (
          <div className="grid grid-cols-[0.1fr_1fr] items-center  gap-3">
            <IconBrandLinkedinFilled
              className="text-[#0A66C2]"
              size={35}
              stroke={1.25}
            />
            <h3 className="text-sm ">
              {linkdinProfile.headline?.length > 75
                ? linkdinProfile.headline?.slice(0, 75) + "..."
                : linkdinProfile.headline}
            </h3>
          </div>
        )}
      </div>
    </Link>
  );
}

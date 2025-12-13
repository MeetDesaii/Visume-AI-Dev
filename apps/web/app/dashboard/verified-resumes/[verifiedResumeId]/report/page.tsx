import { getServerApiClient } from "@/lib/axios/server";
import {
  IconAlertTriangle,
  IconBriefcase,
  IconCircleCheckFilled,
  IconCode,
  IconMail,
  IconMapPin,
  IconPhone,
  IconUser,
} from "@tabler/icons-react";
import { ResumeDTO, ResumeVerificationsResponse } from "@visume/types";
import { Badge } from "@visume/ui/components/badge";
import { Progress } from "@visume/ui/components/progress";
import { ScrollArea } from "@visume/ui/components/scroll-area";
import { format } from "date-fns";
import { GraduationCap } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeReact from "rehype-react";

type Props = {
  params: Promise<{
    verifiedResumeId: string;
  }>;
};

export default async function ResumeDetails({ params }: Props) {
  const api = getServerApiClient();
  const { verifiedResumeId } = await params;

  const res = await api.get<ResumeVerificationsResponse>(
    `/verify/resume/${verifiedResumeId}`
  );
  const verification = res.data.data;

  if (!verification) {
    return <div className="p-6">Verification not found.</div>;
  }
  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const resume = verification.resume as ResumeDTO;

  return (
    <div className="grid grid-cols-[1fr_0.9fr] gap-3">
      <ScrollArea className="h-[calc(100vh_-_90px)] ">
        <div className="bg-white dark:bg-accent rounded-xl  p-4 mb-3 flex flex-col md:flex-row justify-between items-start md:items-center ">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold ">
                {resume.firstName} {resume.lastName}
              </h1>
              <span className="px-3 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                {verification.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">Profile Verification Report</p>
          </div>

          <div className="flex items-center gap-3 mt-3 md:mt-0">
            <div className="text-right">
              <div className="text-sm text-gray-500">Overall Match</div>
<<<<<<< Updated upstream
              <div className="text-3xl font-bold text-gray-900">
=======
              <div className="text-3xl font-bold ">
>>>>>>> Stashed changes
                {verification.overallScore}/100
              </div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center bg-white dark:bg-accent shadow-inner">
              <div
                className={`w-3 h-3 rounded-full ${getScoreColor(verification.overallScore)}`}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* LEFT COLUMN: SCORES & FINDINGS */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section Scores */}
            <div className="bg-white dark:bg-accent rounded-xl  p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IconCircleCheckFilled className="w-5 h-5 text-primary" />
                Match Breakdown
              </h2>
              <div className="space-y-4">
                {verification.sectionScores.map((item, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-medium text-gray-700 dark:text-neutral-200 ">
                        {item.section}
                      </span>
                      <span className="font-bold">{item.score}%</span>
                    </div>

                    <Progress
                      value={item.score}
                      className={`h-2.5 rounded-full `}
                      progressColor={getScoreColor(item.score)}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {item.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Findings Log */}
          </div>

          {/* RIGHT COLUMN: RESUME CONTENT */}
          <div className="lg:col-span-1 space-y-3">
            {/* Candidate Info Card */}
            <div className="bg-white dark:bg-accent rounded-xl  p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IconUser className="w-5 h-5 text-primary" />
                Resume Contact Info
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-background rounded-lg">
                  <IconMail className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">{resume.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-background rounded-lg">
                  <IconPhone className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">
                    {resume.phoneNumber}
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-background rounded-lg md:col-span-2">
                  <IconMapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium">{resume.location}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-accent rounded-2xl   p-4 lg:col-span-1">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IconCode className="w-5 h-5 text-primary" />
                Top Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {resume.skills.splice(0, 13).map((skill, idx) => (
                  <Badge key={idx} variant="outline">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Work Experience */}
          <div className="bg-white dark:bg-accent rounded-xl lg:col-span-3  p-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <IconBriefcase className="w-5 h-5 text-primary" />
              Work Experience
            </h2>
            <div className="space-y-6 relative border-l-2  ml-3 pl-6 pb-2">
              {resume.workExperiences.map((job, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[33px] top-1 w-4 h-4 rounded-full bg-primary border-2 "></div>
                  <h3 className="font-bold ">{job.jobTitle}</h3>
                  <div className="text-sm text-gray-600 dark:text-neutral-500 font-medium">
                    {job.employerName} | {job.location}
                  </div>
                  <div className="text-xs text-gray-400  mb-2">
                    {job.startedAt && format(job.startedAt, "MMM yy")} -
                    {job.endedAt ? format(job.endedAt, "MMM yy") : "Now"}
                  </div>
                  <ul className="list-disc list-inside text-sm text-gray-600 dark:text-neutral-500 space-y-1">
                    {job.achievements.slice(0, 2).map((ach, i) => (
                      <li key={i} className="truncate">
                        {ach.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Skills & Education Grid */}
          {/* Skills */}

          {/* Education */}
          <div className="bg-white dark:bg-accent rounded-xl  p-4 lg:col-span-3">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Education
            </h2>
            <div className="space-y-4">
              {resume.educations.map((edu, idx) => (
                <div
                  key={idx}
                  className="pb-3 border-b border-gray-100 dark:border-gray-600 last:border-0"
                >
                  <div className="font-bold text-sm ">
                    {edu.institutionName}
                  </div>
                  <div className="text-xs text-gray-600">
                    {edu.degreeTypeName} in {edu.fieldOfStudyName}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Grad:{" "}
                    {edu.graduationAt && format(edu.graduationAt, "MMM yy")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <ScrollArea className="h-[calc(100vh_-_90px)] bg-white dark:bg-accent rounded-2xl">
        <div className="border-b px-4 py-3">
          <h2 className="text-lg font-semibold  flex items-center gap-2">
            <IconAlertTriangle className="w-5 h-5 text-orange-500" />
            Analysis Findings
          </h2>
        </div>
<<<<<<< Updated upstream
        <div className="bg-white rounded-xl  p-4 markdown-content">
=======
        <div className="bg-white dark:bg-accent rounded-xl  p-4 markdown-content">
>>>>>>> Stashed changes
          {verification.findings && (
            <Markdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              rehypePlugins={[rehypeReact]}
            >
              {verification.findings.replaceAll("<br>", "")}
            </Markdown>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

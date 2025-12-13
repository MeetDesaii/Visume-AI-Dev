"use client";
import { useState } from "react";
import { Section, sections } from "./resume-content";
import { ScrollArea } from "@visume/ui/components/scroll-area";
import { PlusSquare, Sparkles, XSquare } from "lucide-react";
import { Label } from "@visume/ui/components/label";
import { Input } from "@visume/ui/components/input";
import { Badge } from "@visume/ui/components/badge";
import { format } from "date-fns";
import { Textarea } from "@visume/ui/components/textarea";
import { Button } from "@visume/ui/components/button";
import Link from "next/link";
import { ResumeWithOutJob } from "@visume/types";
import { Separator } from "@visume/ui/components/separator";

export default function ResumeInfoList({
  resume,
}: {
  resume: ResumeWithOutJob;
}) {
  const [isSectionViewOpen, setIsSectionViewOpen] = useState(false);
  const [currentOpenedSection, setCurrentOpenedSection] =
    useState<Section | null>(null);

  return (
    <ScrollArea className="h-screen pb-30">
      {!isSectionViewOpen || !currentOpenedSection ? (
        <div className="space-y-5">
          {sections.map((section) => (
            <div
              key={section.id}
              className="p-3 rounded-2xl   border flex justify-between items-center cursor-pointer hover:bg-primary/5 border-neutral-300 dark:border-neutral-700 hover:border-primary/40 transition-all"
              onClick={() => {
                setCurrentOpenedSection(section);
                setIsSectionViewOpen(true);
              }}
            >
              <div className="flex gap-3 justify-center items-center ">
                <section.icon className="text-secondary-foreground group-hover:text-black dark:group-hover:text-white  size-6" />
                <h5 className="text-secondary-foreground dark:group-hover:text-white text-lg  group-hover:text-black">
                  {section.name}
                </h5>
              </div>

              <PlusSquare className="text-black opacity-0 group-hover:opacity-100 size-4 dark:group-hover:text-white" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <div
            className="px-4 py-4 border-b cursor-pointer flex justify-between items-center"
            onClick={() => {
              setIsSectionViewOpen(false);
            }}
          >
            <div className="flex gap-4">
              <currentOpenedSection.icon />
              <p className="">{currentOpenedSection.name}</p>
            </div>

            <XSquare className="text-neutral-500  " />
          </div>
          <div className="mx-4">
            {currentOpenedSection.id === "summary" && (
              <div>
                <Textarea defaultValue={resume.summary} />
              </div>
            )}
            {currentOpenedSection.id === "personalInfo" && (
              <div className="space-y-8">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input defaultValue={resume.firstName} />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input defaultValue={resume.lastName} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={resume.email ? resume.email : ""} />
                </div>
                {resume.phoneNumber && resume.phoneNumber.length !== 0 ? (
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={resume.phoneNumber} />
                  </div>
                ) : null}
              </div>
            )}
            {currentOpenedSection.id.includes("Experience") ? (
              <div className="space-y-6">
                {(currentOpenedSection.id === "volunteerExperience"
                  ? resume.volunteerExperiences
                  : resume.workExperiences
                ).map((work) => (
                  <div
                    key={work._id}
                    className="border bg-card  rounded-md p-3  space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <h5 className="font-medium ">{work.jobTitle}</h5>
                        {work.isCurrentPosition && (
                          <Badge className="h-5">Current job</Badge>
                        )}
                      </div>

                      {work.location}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        {work.employerName}
                      </p>

                      <p className="text-sm text-muted-foreground">
                        {work.startedAt && format(work.startedAt, "MMM yy")} to{" "}
                        {work.endedAt ? format(work.endedAt, "MMM yy") : "Now"}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3">
                      {work.achievements.map((achive, i) => (
                        <Textarea key={i}>{achive.text}</Textarea>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {currentOpenedSection.id === "education" && (
              <div className="space-y-6">
                {resume.educations.map((edu) => (
                  <div
                    key={edu._id}
                    className="border bg-card  rounded-md p-3  space-y-2"
                  >
                    <h4 className="font-medium">{edu.institutionName}</h4>
                    <p className="text-sm text-muted-foreground">
                      {edu.degreeTypeName} - {edu.fieldOfStudyName}
                    </p>
                    {edu.graduationAt && (
                      <p className="italic  text-sm text-muted-foreground">
                        {format(edu.graduationAt, "MMM yy")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
            {currentOpenedSection.id === "skills" && (
              <div className="space-y-7">
                <div className="space-y-5">
                  {resume.skillsCategories.map((skill) => (
                    <div
                      key={skill._id}
                      className="space-y-4 bg-card py-4 px-3 rounded-md  border"
                    >
                      <Label>{skill.categoryName}</Label>
                      <div className="flex flex-wrap gap-3">
                        {skill.skills.map((s) => (
                          <Badge
                            variant="outline"
                            className="border-primary/40 bg-primary/10"
                            key={s._id}
                          >
                            {s.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />

                <div className="space-y-4 ">
                  <h3 className="flex items-center gap-2 text-sm text-primary">
                    <Sparkles className="size-5" />
                    <span className="font-semibold">
                      Skills found in job description
                    </span>
                  </h3>

                  <div className="space-y-4 bg-card py-4 px-3 rounded-md  border">
                    <Label>Must Have</Label>
                    <div className="flex flex-wrap gap-3">
                      {resume.job.keywords
                        .filter((kw) => kw.priority === "MUST_HAVE")
                        .map((keyword) => (
                          <Badge
                            variant="outline"
                            className="border-primary/60 text-primary"
                            key={keyword.text}
                          >
                            {keyword.text}
                          </Badge>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-4 bg-card py-4 px-3 rounded-md  border">
                    <Label>Nice to Have</Label>
                    <div className="flex flex-wrap gap-3">
                      {resume.job.keywords
                        .filter((kw) => kw.priority === "NICE_TO_HAVE")
                        .map((keyword) => (
                          <Badge
                            variant="outline"
                            className="border-primary/60 text-primary"
                            key={keyword.text}
                          >
                            {keyword.text}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {currentOpenedSection.id === "projects" && (
              <div className="space-y-6">
                {resume.projects.map((project) => (
                  <div
                    key={project._id}
                    className="border bg-card  rounded-md p-3  space-y-2"
                  >
                    <h4 className="font-medium">{project.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {project.description}
                    </p>

                    <div className="mt-5 space-y-3">
                      {project.achievements.map((achive, i) => (
                        <Textarea key={i}>{achive.text}</Textarea>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {currentOpenedSection.id === "links" && (
              <div className="space-y-6">
                {resume.links.map((link) => (
                  <div
                    key={link}
                    className="border bg-white dark:bg-accent  rounded-md p-3  space-y-2"
                  >
                    <Link href={link} rel="noopener noreferrer" target="_blank">
                      <Button variant="link" size="sm">
                        {link}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ScrollArea>
  );
}

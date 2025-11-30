"use client";

import VerifyResumeList from "@/components/dashboard/verification/verify-resume-list";
import { useApiClient } from "@/hooks/use-api-client";
import {
  GithubProjectVerificationDTO,
  GithubVerificationDTO,
  GithubVerificationResponse,
  ResumeDTO,
} from "@visume/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@visume/ui/components/badge";
import { Button } from "@visume/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@visume/ui/components/empty";
import { Input } from "@visume/ui/components/input";
import { Progress } from "@visume/ui/components/progress";
import { ScrollArea } from "@visume/ui/components/scroll-area";
import {
  IconBrandGithub,
  IconCheck,
  IconCircleCheck,
  IconExternalLink,
  IconRefresh,
  IconX,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export default function GithubVerifiedResumesPage() {
  const api = useApiClient();
  const [selectedResume, setSelectedResume] = useState<ResumeDTO | null>(null);
  const [githubUrl, setGithubUrl] = useState("");

  const verificationQuery = useQuery({
    queryKey: ["github-verification", selectedResume?._id],
    enabled: Boolean(selectedResume?._id),
    queryFn: async (): Promise<GithubVerificationResponse> => {
      const resumeId = selectedResume?._id;
      if (!resumeId) {
        throw new Error("Select a resume to view verification");
      }
      const res = await api.get(`/verify/github/${resumeId}`);
      return res.data;
    },
    staleTime: 1000 * 30,
  });

  const runVerification = useMutation({
    mutationFn: async () => {
      const resumeId = selectedResume?._id;
      if (!resumeId) throw new Error("Select a resume before verifying");
      const res = await api.post("/verify/github", {
        resumeId,
        githubProfileUrl: githubUrl,
      });
      return res.data as GithubVerificationResponse;
    },
    onSuccess: () => {
      toast.success("GitHub verification started/completed");
      verificationQuery.refetch();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "GitHub verification failed";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!selectedResume) {
      setGithubUrl("");
      return;
    }
    const resumeGithub =
      selectedResume.profiles?.github ||
      selectedResume.links?.find((l) =>
        typeof l === "string" ? l.toLowerCase().includes("github.com") : false
      ) ||
      "";
    setGithubUrl(resumeGithub);
  }, [selectedResume]);

  const verification = useMemo(
    () => verificationQuery.data?.data as GithubVerificationDTO | undefined,
    [verificationQuery.data]
  );

  const projectResults = useMemo(
    () =>
      (verification?.projectResults as GithubProjectVerificationDTO[]) ?? [],
    [verification?.projectResults]
  );

  const overallScore = verification?.overallScore ?? 0;

  const statusBadge = (
    <Badge
      variant={verification?.status === "COMPLETED" ? "default" : "secondary"}
    >
      {verification?.status ?? "PENDING"}
    </Badge>
  );

  return (
    <div className="h-[calc(100vh_-_90px)]">
      <div className="grid grid-cols-1 lg:grid-cols-[0.4fr_0.6fr] gap-4 h-full">
        <section className="bg-white border rounded-2xl h-full overflow-hidden">
          <VerifyResumeList
            selectedResumeId={selectedResume?._id}
            onSelect={(resume) => setSelectedResume(resume)}
          />
        </section>

        <section className="bg-white border rounded-2xl p-6 h-full flex flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">GitHub Verification</h2>
              <p className="text-sm text-muted-foreground">
                Verify resume projects against your GitHub repositories.
              </p>
            </div>
            {verification ? statusBadge : null}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <IconBrandGithub size={16} />
              GitHub Profile URL
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="https://github.com/username"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={runVerification.isPending}
              />
              <Button
                onClick={() => runVerification.mutate()}
                disabled={
                  runVerification.isPending ||
                  !selectedResume ||
                  !githubUrl.trim()
                }
              >
                {runVerification.isPending ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <IconCircleCheck size={16} />
                    Verify
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              We will crawl the profile, pick matching repos for your resume
              projects, and compare descriptions and code signals.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-xs uppercase text-muted-foreground">
                Overall score
              </span>
              <span className="text-3xl font-semibold">{overallScore}/100</span>
            </div>
            {verification ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconRefresh size={16} />
                Repos analyzed: {projectResults.length}
              </div>
            ) : null}
          </div>

          <ScrollArea className="flex-1 rounded-xl border bg-muted/30 p-4">
            {!selectedResume ? (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>Select a resume</EmptyTitle>
                  <EmptyDescription>
                    Pick a resume on the left to view or run GitHub
                    verification.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : verificationQuery.isFetching && !verification ? (
              <div className="text-sm text-muted-foreground">
                Loading verification...
              </div>
            ) : verification ? (
              <div className="space-y-4">
                {projectResults.length === 0 ? (
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No projects matched</EmptyTitle>
                      <EmptyDescription>
                        We couldn&apos;t find matching repos for the resume
                        projects. Run verification again if you have new repos.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  projectResults.map((project) => (
                    <ProjectCard key={project.projectTitle} project={project} />
                  ))
                )}
              </div>
            ) : (
              <Empty>
                <EmptyHeader>
                  <EmptyTitle>No verification yet</EmptyTitle>
                  <EmptyDescription>
                    Run a GitHub verification to see matches and scores.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </ScrollArea>
        </section>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: GithubProjectVerificationDTO }) {
  const statusVariant =
    project.status === "MATCHED"
      ? "default"
      : project.status === "FAILED"
        ? "destructive"
        : "secondary";

  const statusLabel =
    project.status === "MATCHED"
      ? "Matched"
      : project.status === "FAILED"
        ? "Failed"
        : "Not found";

  return (
    <div className="bg-white border rounded-xl p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{project.projectTitle}</h3>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          {project.repoName ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconBrandGithub size={16} />
              <span>{project.repoName}</span>
              {project.repoUrl ? (
                <Link
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  View <IconExternalLink size={14} />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="text-right space-y-1">
          <div className="text-xs text-muted-foreground">Alignment</div>
          <div className="text-2xl font-semibold">
            {project.alignmentScore ?? 0}%
          </div>
          <Progress value={project.alignmentScore ?? 0} className="h-2" />
        </div>
      </div>

      {project.matchReasoning ? (
        <p className="text-sm text-muted-foreground">
          {project.matchReasoning}
        </p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ClaimList
          title="Supported claims"
          icon={<IconCheck size={14} className="text-green-600" />}
          items={project.supportedClaims}
          emptyText="No supported claims captured."
        />
        <ClaimList
          title="Missing claims"
          icon={<IconX size={14} className="text-destructive" />}
          items={project.missingClaims}
          emptyText="No mismatches captured."
        />
      </div>

      {project.riskFlags?.length ? (
        <ClaimList
          title="Risk flags"
          icon={<IconX size={14} className="text-destructive" />}
          items={project.riskFlags}
          emptyText="No risks reported."
        />
      ) : null}
    </div>
  );
}

function ClaimList({
  title,
  items,
  emptyText,
  icon,
}: {
  title: string;
  items: string[];
  emptyText: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 rounded-lg p-3 space-y-2">
      <div className="text-sm font-medium flex items-center gap-2">{title}</div>
      {items?.length ? (
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-0.5">{icon}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

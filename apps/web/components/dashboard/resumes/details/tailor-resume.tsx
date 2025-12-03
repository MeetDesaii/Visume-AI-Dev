"use client";
import { Button } from "@visume/ui/components/button";
import { Loader2, Sparkles } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@visume/ui/components/dialog";
import { ResumeReview } from "@visume/types/models/resume-review";
import { ResumeTailorResponse, ResumeWithOutJob } from "@visume/types";
import { Label } from "@visume/ui/components/label";
import { useMutation } from "@tanstack/react-query";
import { useApiClient } from "@/hooks/use-api-client";
import { useTimer } from "@/hooks/use-timer";
import { fmtRef } from "@/lib/inedx";

export default function TailorResume({
  review,
  resume,
}: {
  review: ResumeReview;
  resume: ResumeWithOutJob;
}) {
  const { elapsedMs, isRunning, start, pause, reset } = useTimer();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const api = useApiClient();
  const { isPending, mutate } = useMutation<
    ResumeTailorResponse,
    unknown,
    string
  >({
    mutationFn: async (id: string) => {
      const res = await api.post<ResumeTailorResponse>(`/resumes/${id}/tailor`);
      return res.data;
    },
    onSuccess() {
      pause();
      setIsDialogOpen(!isDialogOpen);
      window.location.reload();
    },
  });

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Sparkles />
          Tailor Resume
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {!isPending ? (
          <>
            <DialogHeader>
              <DialogTitle>AI-Tailor Resume</DialogTitle>
              <DialogDescription>
                AI Resume Tailor your resume with deep expertise in recruitment,
                ATS (Applicant Tracking Systems) optimization, and professional
                writing.
              </DialogDescription>
            </DialogHeader>
            <div className="my-3 space-y-5">
              <div className="space-y-2">
                <Label>Resume Name</Label>
                <h3>{resume.resumeName}</h3>
              </div>
              <div className="space-y-2">
                <Label>Job Name</Label>
                <h3>
                  {resume.job.company.name} - {resume.job.title}
                </h3>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  start();
                  mutate(resume._id);
                }}
              >
                <Sparkles /> Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="text-center grid placonce my-5 space-y-5">
            <div className="text-center flex justify-center">
              <Loader2 className="animate-spin size-11 text-primary" />
            </div>
            <h3 className="text-2xl">
              Your AI Tailored Resume Review is{" "}
              <span className="text-primary">In Progress</span>
            </h3>
            <p>
              This can take up to 5 minutes. Please do not close this video we
              will be done in some time.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

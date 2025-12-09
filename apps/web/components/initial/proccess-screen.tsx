"use client";
import { useApiClient } from "@/hooks/use-api-client";
import { useMutation } from "@tanstack/react-query";
import { Loader2, CheckCircle2 } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { InitialSetupDetails } from "@/app/initial/page";
import {
  CreateJobPayload,
  CreateJobResponse,
  ResumeExtractionResponse,
} from "@visume/types";

export default function ProccessScreen({
  resumeAndJobDetails,
}: {
  resumeAndJobDetails: InitialSetupDetails;
}) {
  const [currentStep, setCurrentStep] = useState<
    "analyze-job" | "parse-resume" | "complete"
  >("analyze-job");
  const hasStarted = useRef(false);
  const api = useApiClient();
  const router = useRouter();

  const analyzeJobDescription = useMutation<
    CreateJobResponse,
    Error,
    CreateJobPayload
  >({
    mutationKey: ["analyze-job"],
    mutationFn: async (info: CreateJobPayload) => {
      const { title, description, company } = info;
      const res = await api.post<CreateJobResponse>("/jobs", {
        job: { title, description, company },
      });
      return res.data;
    },
    onSuccess(data) {
      const jobId = data.data.job._id;
      if (jobId) {
        uploadAndParse.mutate(jobId);
        setCurrentStep("parse-resume");
      } else {
        toast.error("No Job ID found in ", data);
      }
    },
  });

  const uploadAndParse = useMutation<ResumeExtractionResponse, any, string>({
    mutationKey: ["upload-and-parse"],
    mutationFn: async (jobId: string) => {
      const formData = new FormData();
      if (!resumeAndJobDetails.resume?.file) {
        toast.error("Resume file not found");
        throw new Error("No resume file provided");
      }
      if (!jobId) {
        toast.error("Job ID not found");
        throw new Error("No Job ID provided");
      }

      formData.append("resume", resumeAndJobDetails.resume.file);
      formData.append("jobId", jobId);

      const res = await api.post<ResumeExtractionResponse>(
        "/resumes/extract",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Upload response:", res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log("Upload success:", data);
      const resumeId = data.data.resume?._id;
      if (resumeId) {
        setCurrentStep("complete");
        router.push(`/dashboard/resumes/${resumeId}/editor`);
        // console.log(first)
      } else {
        toast.error("Failed to extract resume ID from response");
        console.error("Missing resume.id in response:", data);
      }
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(
        `Failed to upload resume: ${error.response?.data?.error || error.message}`,
      );
    },
  });

  useEffect(() => {
    if (hasStarted.current) {
      console.log("Upload already started, skipping...");
      return;
    }
    hasStarted.current = true;

    console.log("Initiating upload process...");
    console.log("Resume file:", resumeAndJobDetails.resume?.file);
    console.log("Job description:", resumeAndJobDetails.job?.description);

    if (resumeAndJobDetails.job) {
      const { title, company, description } = resumeAndJobDetails.job;

      analyzeJobDescription.mutate({
        company: company.name,
        description,
        title,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-10">
      <div className="space-y-2 text-center">
        <h1 className="text-primary text-3xl">Setting up your dashboard...</h1>
        <p className="text-base text-neutral-500">
          This could take upto 2 minutes, please stay on this page...
        </p>
      </div>

      <div className="space-y-5">
        <div className={`flex gap-3 text-lg items-center`}>
          {currentStep === "analyze-job" ? (
            <Loader2 className="animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="text-green-500" />
          )}
          <p
            className={
              currentStep === "analyze-job"
                ? "font-semibold"
                : "text-muted-foreground"
            }
          >
            {currentStep === "analyze-job"
              ? "Analyzing your job description..."
              : "Analyzed Job description"}
          </p>
        </div>

        <div className={`flex gap-3 text-lg items-center`}>
          {currentStep === "analyze-job" ? (
            <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
          ) : currentStep === "parse-resume" ? (
            <Loader2 className="animate-spin text-primary" />
          ) : (
            <CheckCircle2 className="text-green-500" />
          )}
          <p
            className={
              currentStep === "parse-resume"
                ? "font-semibold"
                : "text-muted-foreground"
            }
          >
            {currentStep === "parse-resume"
              ? "Parsing your resume"
              : currentStep === "complete"
                ? "Parsing complete"
                : "Parsing your resume"}
          </p>
        </div>
      </div>
    </div>
  );
}

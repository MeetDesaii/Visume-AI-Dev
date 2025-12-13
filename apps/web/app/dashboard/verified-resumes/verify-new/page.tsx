"use client";

import { useState } from "react";
import VerifyLinkdinProfilePDFList from "@/components/dashboard/verification/verify-linkdin-profile-pdf-list";
import VerifyResumeList from "@/components/dashboard/verification/verify-resume-list";
import { IconCircleDashedCheck } from "@tabler/icons-react";
import { Button } from "@visume/ui/components/button";
import { Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useApiClient } from "@/hooks/use-api-client";
import { ResumeDTO, ResumeVerificationResponse } from "@visume/types";
import { toast } from "sonner";
import { Separator } from "@visume/ui/components/separator";
import { useRouter } from "next/navigation";
import { LoaderFive } from "@visume/ui/components/loader";
export default function VerifyNewPage() {
  const api = useApiClient();
  const router = useRouter();
  const [selectedResume, setSelectedResume] = useState<ResumeDTO | null>(null);
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [isLinkedinUploading, setIsLinkedinUploading] = useState(false);

  const { mutate, isPending } = useMutation<
    ResumeVerificationResponse,
    any,
    { resumeId: string; file: File }
  >({
    mutationFn: async (payload: { resumeId: string; file: File }) => {
      const formData = new FormData();
      formData.append("resumeId", payload.resumeId);
      formData.append("linkedinProfile", payload.file);

      const res = await api.post<ResumeVerificationResponse>(
        "/verify/linkedin",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
<<<<<<< Updated upstream
        },
=======
        }
>>>>>>> Stashed changes
      );

      return res.data;
    },
    onSuccess: (data) => {
      const id = data.data.verification.resume;
      toast.success("Verification completed successfully");
      router.push(`/dashboard/verified-resumes/${id}/report`);
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.error?.message ??
        error?.response?.data?.error ??
        error?.message ??
        "Verification failed";
      toast.error(message);
    },
  });

  const handleVerify = () => {
    if (!selectedResume || !linkedinFile || isLinkedinUploading) return;
    mutate({ resumeId: selectedResume._id, file: linkedinFile });
  };

  const isVerifyDisabled =
    !selectedResume || !linkedinFile || isLinkedinUploading || isPending;

  return (
    <div className="relative ">
      <div
        className={`absolute top-0  size-full grid place-content-center text-2xl font-semibold transition-all duration-500 ease-in  ${isPending ? "opacity-100 z-50 " : "opacity-0 -z-50"}`}
      >
        <LoaderFive text="Verifying Resume..." />
      </div>

      <div
        className={` ${isPending ? "blur-lg pointer-events-none" : ""} transition-all duration-700 ease-in `}
      >
        <div className="grid grid-cols-2 gap-3">
          <section className="bg-white dark:bg-accent rounded-2xl h-[calc(100vh_-_90px)]">
            <VerifyResumeList
              selectedResumeId={selectedResume?._id}
              onSelect={(resume) => setSelectedResume(resume)}
            />
          </section>
          <section className="bg-white dark:bg-accent rounded-2xl h-[calc(100vh_-_90px)]">
            <VerifyLinkdinProfilePDFList
              selectedFile={linkedinFile}
              onFileSelected={(file, uploading) => {
                setLinkedinFile(file);
                setIsLinkedinUploading(uploading);
              }}
            />
          </section>
        </div>

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-4 h-23 min-w-[400px] transition-all rounded-2xl flex items-center justify-between gap-5 p-6 bg-white dark:bg-accent drop-shadow-2xl border">
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              Resume:{" "}
              <span className="font-medium text-foreground">
                {selectedResume?.resumeName || "Select a resume"}
              </span>
            </p>
            <p>
              LinkedIn PDF:{" "}
              <span className="font-medium text-foreground">
                {linkedinFile?.name || "Upload profile PDF"}
                {isLinkedinUploading ? " (uploading...)" : ""}
              </span>
            </p>
          </div>
          <Separator orientation="vertical" />
          <Button size="lg" onClick={handleVerify} disabled={isVerifyDisabled}>
            {isPending ? (
              <>
                <Loader2 className=" animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <IconCircleDashedCheck size={16} />
                Verify Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

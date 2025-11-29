"use client";

import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowLeft, ArrowRight, Upload } from "lucide-react";
import { Download } from "lucide-react";
import { File } from "lucide-react";
import { Button } from "@visume/ui/components/button";
import { useApiClient } from "@/hooks/use-api-client";
import { InitialSetupDetails, SetupProgress } from "@/app/initial/page";
import { FileUpload } from "@visume/ui/components/file-upload";
// import extractText from "@/actions/extractText";

export default function ResumeUpload({
  handleProgress,
  handleResumeAndJobDetails,
}: {
  handleProgress: (step: number, form: SetupProgress["form"]) => void;
  handleResumeAndJobDetails: ({ resume, job }: InitialSetupDetails) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const [file, setFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      setFile(acceptedFiles[0]!);
    },
  });

  async function handleContinueClick() {
    if (!file) return;

    handleResumeAndJobDetails({
      resume: {
        file,
        text: "",
      },
    });

    handleProgress(3, "COMPLETED");
  }

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold">Upload your resume</h1>
      <p className="text-muted-foreground text-sm max-w-sm">
        Upload a resume to get started with AI-powered analysis and tailoring.
      </p>
      <div className="my-10">
        <FileUpload
          onFileChange={({ file, uploading }) => {
            if (!file) return;
            setFile(file);
            setIsUploading(uploading);
          }}
        />
      </div>

      <div className="flex justify-between mt-8">
        <Button
          variant="secondary"
          disabled={isUploading}
          onClick={() => {
            handleProgress(1, "JOB_FORM");
          }}
        >
          <ArrowLeft />
          Back
        </Button>
        <Button onClick={handleContinueClick} disabled={!file || isUploading}>
          Continue <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

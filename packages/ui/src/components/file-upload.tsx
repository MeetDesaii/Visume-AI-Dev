"use client";

import { File, FileSpreadsheet, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Button } from "@visume/ui/components/button";
import { Card } from "@visume/ui/components/card";
import { Progress } from "@visume/ui/components/progress";
import { cn } from "@visume/ui/lib/utils";

interface FileUploadState {
  file: File | null;
  progress: number;
  uploading: boolean;
}

interface FileUploadProps {
  onFileChange?: (state: FileUploadState) => void;
  maxSize?: number; // in bytes
}

const VALID_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/msword": [".doc"],
  "text/plain": [".txt"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function FileUpload({
  onFileChange,
  maxSize = MAX_FILE_SIZE,
}: FileUploadProps) {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    progress: 0,
    uploading: false,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate file upload progress
  const simulateUpload = useCallback(
    (file: File) => {
      const newState = { file, progress: 0, uploading: true };
      setUploadState(newState);
      onFileChange?.(newState);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        setUploadState((prev) => {
          const newProgress = Math.min(prev.progress + 20, 100);
          const isComplete = newProgress >= 100;

          if (isComplete && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          const updatedState = {
            ...prev,
            progress: newProgress,
            uploading: !isComplete,
          };
          onFileChange?.(updatedState);
          return updatedState;
        });
      }, 150);
    },
    [onFileChange],
  );

  // Handle accepted files
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        simulateUpload(file);
      }
    },
    [simulateUpload],
  );

  // Handle rejected files
  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const rejection = rejections[0];
    if (!rejection) return;

    const { errors } = rejection;
    const errorCode = errors[0]?.code;

    let errorMessage = "File upload failed. Please try again.";

    switch (errorCode) {
      case "file-invalid-type":
        errorMessage = "Please upload a PDF, DOCX, DOC, or TXT file.";
        break;
      case "file-too-large":
        errorMessage = `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`;
        break;
      case "too-many-files":
        errorMessage = "Please upload only one file at a time.";
        break;
    }

    toast.error(errorMessage, {
      position: "bottom-right",
      duration: 3000,
    });
  }, []);

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: VALID_FILE_TYPES,
      maxSize,
      maxFiles: 1,
      multiple: false,
    });

  // Reset file
  const resetFile = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const resetState = { file: null, progress: 0, uploading: false };
    setUploadState(resetState);
    onFileChange?.(resetState);
  }, [onFileChange]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get file icon based on file type
  const getFileIcon = () => {
    if (!uploadState.file) return <File />;

    const fileExt = uploadState.file.name.split(".").pop()?.toLowerCase() || "";
    return ["pdf", "docx", "doc"].includes(fileExt) ? (
      <FileSpreadsheet className="h-5 w-5 text-foreground" />
    ) : (
      <File className="h-5 w-5 text-foreground" />
    );
  };

  const { file, progress, uploading } = uploadState;

  return (
    <div className="flex items-center justify-center  w-full">
      <div className="w-full">
        <div
          {...getRootProps()}
          className={cn(
            "flex justify-center rounded-xl bg-white dark:bg-accent  border-2 mt-2 border-dashed px-6 py-12 transition-colors cursor-pointer",
            isDragActive && !isDragReject && "border-primary bg-primary/5",
            isDragReject && "border-destructive bg-destructive/5",
            !isDragActive && "border-input hover:border-primary/50",
          )}
        >
          <input {...getInputProps()} aria-label="File upload" />
          <div className="text-center">
            <File
              className={cn(
                "mx-auto size-10 mb-3 transition-colors",
                isDragActive && !isDragReject && "text-primary",
                isDragReject && "text-destructive",
                !isDragActive && "text-muted-foreground",
              )}
              aria-hidden={true}
            />
            <div className="text-sm leading-6">
              {isDragActive ? (
                <p
                  className={cn(
                    "font-medium",
                    isDragReject ? "text-destructive" : "text-primary",
                  )}
                >
                  {isDragReject ? "Invalid file type" : "Drop file here"}
                </p>
              ) : (
                <div className="flex text-muted-foreground">
                  <p>Drag and drop or</p>
                  <span className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4">
                    choose file
                  </span>
                  <p className="pl-1">to upload</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2 text-xs leading-5 text-muted-foreground sm:flex sm:items-center sm:justify-between">
          <span>Accepted file types: PDF, DOCX, DOC or TXT files.</span>
          <span className="pl-1 sm:pl-0">
            Max. size: {formatFileSize(maxSize)}
          </span>
        </p>

        {file && (
          <Card className="relative mt-8 bg-white dark:bg-accent p-4 gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Remove file"
              onClick={resetFile}
              disabled={uploading}
            >
              <X className="h-5 w-5 shrink-0" aria-hidden={true} />
            </Button>

            <div className="flex items-center space-x-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-background  ring-1 ring-inset ring-border">
                {getFileIcon()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {file.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                  {uploading && " • Uploading..."}
                  {!uploading && progress === 100 && " • Complete"}
                </p>
              </div>
            </div>

            {(uploading || progress > 0) && (
              <div className="flex items-center space-x-3">
                <Progress value={progress} className="h-1.5" />
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {progress}%
                </span>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export { FileUpload };
export type { FileUploadState };

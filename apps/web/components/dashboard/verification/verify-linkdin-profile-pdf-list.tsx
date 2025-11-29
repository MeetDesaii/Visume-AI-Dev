"use client";
import { FileUpload } from "@visume/ui/components/file-upload";
import React, { useState } from "react";

export default function VerifyLinkdinProfilePDFList({
  onFileSelected,
  selectedFile,
}: {
  onFileSelected?: (file: File | null, uploading: boolean) => void;
  selectedFile?: File | null;
}) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg text-muted-foreground">Linkdin Profile</h2>
      </div>
      <div className="p-4 h-full">
        <div className="grid place-content-center gap-9 h-full">
          <FileUpload
            onFileChange={({ file, uploading }) => {
              setIsUploading(uploading);
              onFileSelected?.(file ?? null, uploading);
            }}
          />
          <p className="text-sm text-neutral-400 text-center">
            Upload Your linkdin profile PDF here
          </p>
          {selectedFile && (
            <p className="text-sm text-center text-muted-foreground">
              Selected: <span className="font-medium">{selectedFile.name}</span>
              {isUploading ? " (uploading...)" : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

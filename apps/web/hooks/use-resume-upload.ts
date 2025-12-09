import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { UploadResumeResponse } from "@visume/types";

interface UploadResumeVariables {
  file: File;
  onProgress?: (progress: number) => void;
}

export const useResumeUpload = () => {
  return useMutation<UploadResumeResponse, Error, UploadResumeVariables>({
    mutationFn: async ({ file, onProgress }) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<UploadResumeResponse>(
        "/api/resumes/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              onProgress(progress);
            }
          },
        },
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`${variables.file.name} uploaded successfully!`);
    },
    onError: (error, variables) => {
      console.error("Upload error:", error);
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : "Upload failed";
      toast.error(`Failed to process ${variables.file.name}: ${errorMessage}`);
    },
  });
};

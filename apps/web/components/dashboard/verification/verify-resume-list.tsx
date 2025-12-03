"use client";

import React from "react";
import ResumeCard from "../resumes/resume-card";
import { ResumeDTO, ResumeListResponse } from "@visume/types";
import { useQuery } from "@tanstack/react-query";
import { useApiClient } from "@/hooks/use-api-client";
import { IconPlus } from "@tabler/icons-react";

export default function VerifyResumeList({
  selectedResumeId,
  onSelect,
}: {
  selectedResumeId?: string | null;
  onSelect?: (resume: ResumeDTO) => void;
}) {
  const api = useApiClient();

  const { data, isLoading } = useQuery<ResumeListResponse>({
    queryKey: ["resumes-list"],
    queryFn: async () => {
      const res = await api.get<ResumeListResponse>(`/resumes`);
      return res.data;
    },
  });
  return (
    <div>
      <div className="border-b px-4 py-3">
        <h2 className="text-lg text-muted-foreground">Resumes</h2>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div className="p-4 grid grid-cols-2 gap-3">
          {data?.data?.resumes.map((resume: ResumeDTO) => (
            <ResumeCard
              resume={resume}
              key={resume._id}
              isLink={false}
              selected={selectedResumeId === resume._id}
              onSelect={onSelect}
            />
          ))}

          <div className="bg-white border p-4 rounded-2xl min-h-40 flex flex-col justify-center items-center cursor-pointer hover:border-neutral-400">
            <div className="bg-primary/10 rounded-full size-15 grid place-content-center">
              <IconPlus className="text-primary" />
            </div>
            <h2 className="mt-2 text-lg">Upload new resume</h2>
          </div>
        </div>
      )}
    </div>
  );
}

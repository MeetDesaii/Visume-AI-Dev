"use client";

import { Button } from "@visume/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@visume/ui/components/empty";
import Link from "next/link";
import { File, Plus } from "lucide-react";
import ResumeCard from "@/components/dashboard/resumes/resume-card";

import { ResumeDTO, ResumeListResponse } from "@visume/types";
import { useRouter } from "next/navigation";
import { useApiClient } from "@/hooks/use-api-client";
import { useQuery } from "@tanstack/react-query";
import { IconPlus } from "@tabler/icons-react";

export default function ResumesPage() {
  const api = useApiClient();
  const router = useRouter();

  const { data, isLoading, isError, error } = useQuery<ResumeListResponse>({
    queryKey: ["resumes-list"],
    queryFn: async () => {
      const res = await api.get<ResumeListResponse>(`/resumes`);
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto w-full max-w-7xl mt-10">Loading...</div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto w-full max-w-7xl mt-10">
        Error: {error.message}
      </div>
    );
  }

  const resumes: ResumeDTO[] = data?.data?.resumes || [];

  if (resumes.length === 0) {
    router.push("/initial");
  }

  return (
    <section className="bg-white dark:bg-accent h-[calc(100vh_-_90px)] rounded-2xl p-4 pt-10">
      <div className="container mx-auto w-full max-w-7xl">
        <div className="flex justify-between items-center ">
          <h2 className="text-2xl">Recent Resumes</h2>
          {/* <ResumeUploadDialog /> */}

          {resumes.length !== 0 && (
            <Link href="/initial">
              <Button size="lg">
                <Plus />
                Create new resume
              </Button>
            </Link>
          )}
        </div>

        {resumes.length !== 0 ? (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-accent border p-4 rounded-2xl min-h-40 flex flex-col justify-center items-center cursor-pointer hover:border-neutral-400">
              <div className="bg-primary/10 rounded-full size-15 grid place-content-center">
                <IconPlus className="text-primary" />
              </div>
              <h2 className="mt-2 text-lg">Upload new resume</h2>
            </div>
            {resumes.map((resume) => (
              <ResumeCard resume={resume} key={resume._id} />
            ))}
          </div>
        ) : (
          <Empty className="mt-10">
            <EmptyHeader>
              <EmptyMedia variant="icon" className="bg-secondary ">
                <File />
              </EmptyMedia>
              <EmptyTitle>No Resumes</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t added any resumes yet. Get started by uploading
                your first resume.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button>
                <Plus />
                Add Resume
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </div>
    </section>
  );
}

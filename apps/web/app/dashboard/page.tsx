"use client";
import ResumeCard from "@/components/dashboard/resumes/resume-card";
import ResumeVerificationCard from "@/components/dashboard/verification/resume-verification-card";
import { useApiClient } from "@/hooks/use-api-client";
import { useUser } from "@clerk/nextjs";
import { IconPlus } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  ResumeDTO,
  ResumeListResponse,
  VerifiedResumesResponse,
} from "@visume/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@visume/ui/components/avatar";
import { ScrollArea } from "@visume/ui/components/scroll-area";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const api = useApiClient();

  const { user } = useUser();
  const router = useRouter();

  const resumesQuery = useQuery<ResumeListResponse>({
    queryKey: ["resumes-list"],
    queryFn: async () => {
      const res = await api.get<ResumeListResponse>(`/resumes`);
      return res.data;
    },
  });

  const verifiedResumesQuery = useQuery<VerifiedResumesResponse>({
    queryKey: ["verified-resumes-list"],
    queryFn: async () => {
      const res = await api.get<VerifiedResumesResponse>("/verify/resumes");
      return res.data;
    },
  });

  if (!user) {
    router.push("/login");
    return;
  }
  return (
    <ScrollArea className="h-[calc(100vh_-_90px)]">
      <div className="py-12 bg-white dark:bg-accent dark:bg-accent  rounded-2xl ">
        <div className="container mx-auto max-w-7xl">
          <h3 className="text-2xl">Recent Resumes</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/initial">
              <div className="bg-white dark:bg-accent dark:bg-accent  border p-4 rounded-2xl min-h-40 flex flex-col justify-center items-center cursor-pointer hover:border-neutral-400">
                <div className="bg-primary/10 rounded-full size-15 grid place-content-center">
                  <IconPlus className="text-primary" />
                </div>
                <h2 className="mt-2 text-lg">Upload new resume</h2>
              </div>
            </Link>
            {resumesQuery.data?.data?.resumes.map((resume: ResumeDTO) => (
              <ResumeCard resume={resume} key={resume._id} />
            ))}
          </div>
        </div>
      </div>
      <div className="py-12 bg-white dark:bg-accent  rounded-2xl mt-3">
        <div className="container mx-auto max-w-7xl">
          <h3 className="text-2xl">Recent verifications</h3>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/verified-resumes/verify-new">
              <div className="bg-white dark:bg-accent border p-4 rounded-2xl h-full flex flex-col justify-center items-center cursor-pointer hover:border-neutral-400">
                <div className="bg-primary/10 rounded-full size-15 grid place-content-center">
                  <IconPlus className="text-primary" />
                </div>
                <h2 className="mt-2 text-lg">Upload new resume</h2>
              </div>
            </Link>
            {verifiedResumesQuery.data?.data.map((verification: any) => (
              <ResumeVerificationCard
                resume={verification.resume}
                linkdinProfile={verification.linkedinProfile}
                key={verification._id}
              />
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

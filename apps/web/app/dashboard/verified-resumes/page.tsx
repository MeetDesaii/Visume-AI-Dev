"use client";
import ResumeCard from "@/components/dashboard/resumes/resume-card";
import ResumeVerificationCard from "@/components/dashboard/verification/resume-verification-card";
import { useApiClient } from "@/hooks/use-api-client";
import {
  IconBrandLinkedinFilled,
  IconCircleCheck,
  IconPlus,
} from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import {
  ResumeDTO,
  ResumeVerificationsResponse,
  VerifiedResumesResponse,
} from "@visume/types";
import { Button } from "@visume/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@visume/ui/components/empty";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function VerfiedResumes() {
  const api = useApiClient();
  const { data } = useQuery({
    queryKey: ["verified-resumes-list"],
    queryFn: async (): Promise<VerifiedResumesResponse> => {
      const res = await api.get("/verify/resumes");
      return res.data;
    },
  });

  return (
    <div className="bg-white p-4 rounded-2xl h-[calc(100vh_-_90px)] pt-10">
      <div className="container mx-auto w-full max-w-7xl">
        <div className="flex justify-between items-center ">
          <h2 className="text-2xl">Verified Resumes</h2>

          {data?.data.length !== 0 && (
            <Link href="/dashboard/verified-resumes/verify-new">
              <Button size="lg">
                <IconCircleCheck />
                Verify new
              </Button>
            </Link>
          )}
        </div>

        {data?.data.length === 0 ? (
          <Empty className="mt-10">
            <EmptyHeader>
              <EmptyMedia>
                <IconBrandLinkedinFilled size={50} className="text-[#0A66C2]" />
              </EmptyMedia>
              <EmptyTitle className="text-2xl">No Verified Resumes</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t verified any resumes yet. Get started by
                verofying your first resume.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/dashboard/verified-resumes/verify-new">
                <Button size="lg">
                  <IconCircleCheck />
                  Verify resume
                </Button>
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/dashboard/verified-resumes/verify-new">
                <div className="bg-white border p-4 rounded-2xl h-full flex flex-col justify-center items-center cursor-pointer hover:border-neutral-400">
                  <div className="bg-primary/10 rounded-full size-15 grid place-content-center">
                    <IconPlus className="text-primary" />
                  </div>
                  <h2 className="mt-2 text-lg">Upload new resume</h2>
                </div>
              </Link>
              {data?.data.map((verification) => (
                <ResumeVerificationCard
                  resume={verification.resume}
                  linkdinProfile={verification.linkedinProfile}
                  key={verification._id}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

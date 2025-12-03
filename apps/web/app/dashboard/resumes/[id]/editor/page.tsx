import ResumeDetailsPage from "@/components/dashboard/resumes/details/resume-details-page";
import { getServerApiClient } from "@/lib/axios/server";
import { ResumeDetailResponse } from "@visume/types";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResumeDetails({ params }: Props) {
  const { id } = await params;
  const api = getServerApiClient();

  const res = await api.get<ResumeDetailResponse>(`/resumes/${id}`);

  return (
    <div>
      <ResumeDetailsPage id={id} />
    </div>
  );
}

import ResumeDetailsPage from "@/components/dashboard/resumes/details/resume-details-page";
<<<<<<< Updated upstream
import { getServerApiClient } from "@/lib/axios/server";
import { ResumeDetailResponse } from "@visume/types";
=======
>>>>>>> Stashed changes

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResumeDetails({ params }: Props) {
  const { id } = await params;

<<<<<<< Updated upstream
  const res = await api.get<ResumeDetailResponse>(`/resumes/${id}`);

  return (
    <div>
      <ResumeDetailsPage id={id} />
    </div>
  );
=======
  return <ResumeDetailsPage id={id} />;
>>>>>>> Stashed changes
}

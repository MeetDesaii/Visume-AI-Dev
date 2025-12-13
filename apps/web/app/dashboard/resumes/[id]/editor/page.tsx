import ResumeDetailsPage from "@/components/dashboard/resumes/details/resume-details-page";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResumeDetails({ params }: Props) {
  const { id } = await params;

  return <ResumeDetailsPage id={id} />;
}

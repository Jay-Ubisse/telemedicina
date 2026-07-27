import { ConsultationDetail } from "./consultation-detail";

export default async function ConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ConsultationDetail id={id} />;
}

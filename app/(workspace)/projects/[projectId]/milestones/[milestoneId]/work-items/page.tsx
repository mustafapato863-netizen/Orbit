import { redirect } from "next/navigation";

export default async function WorkItemsRedirectPage({
  params,
}: {
  params: Promise<{ projectId: string; milestoneId: string }>;
}) {
  const { projectId, milestoneId } = await params;
  redirect(`/projects/${projectId}/milestones/${milestoneId}`);
}

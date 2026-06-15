import { redirect } from "next/navigation";
import { canAccessPhase } from "@/lib/workshopAccess";
import { PostSurvey } from "./PostSurvey";

export default async function PostPage() {
  const { ok } = await canAccessPhase("post");
  if (!ok) redirect("/workshop");

  return <PostSurvey />;
}

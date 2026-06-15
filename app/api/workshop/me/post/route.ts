import { patchPhaseData } from "@/lib/workshopData";

export async function PATCH(request: Request) {
  return patchPhaseData("post", request);
}

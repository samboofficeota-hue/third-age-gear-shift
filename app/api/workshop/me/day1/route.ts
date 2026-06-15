import { patchPhaseData } from "@/lib/workshopData";

export async function PATCH(request: Request) {
  return patchPhaseData("day1", request);
}

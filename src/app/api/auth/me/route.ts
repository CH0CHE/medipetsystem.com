import { apiErrorResponse } from "@/lib/http/api-error";
import { handleMeRequest } from "@/modules/auth/application/handle-me";

export async function GET() {
  try {
    return await handleMeRequest("tenant");
  } catch (error) {
    return apiErrorResponse(error);
  }
}

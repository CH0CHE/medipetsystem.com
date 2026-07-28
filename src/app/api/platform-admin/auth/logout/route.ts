import { apiErrorResponse } from "@/lib/http/api-error";
import { handleLogoutRequest } from "@/modules/auth/application/handle-logout";

export async function POST() {
  try {
    return await handleLogoutRequest("platform-admin");
  } catch (error) {
    return apiErrorResponse(error);
  }
}

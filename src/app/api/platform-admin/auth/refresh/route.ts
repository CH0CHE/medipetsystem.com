import { apiErrorResponse } from "@/lib/http/api-error";
import { clearSessionCookies } from "@/lib/auth/cookies";
import { mapAuthErrorToApiError } from "@/modules/auth/application/map-auth-error";
import { handleRefreshRequest } from "@/modules/auth/application/handle-refresh";

export async function POST(request: Request) {
  try {
    return await handleRefreshRequest(request, "platform-admin");
  } catch (error) {
    const response = apiErrorResponse(mapAuthErrorToApiError(error) ?? error);
    clearSessionCookies(response, "platform-admin");
    return response;
  }
}

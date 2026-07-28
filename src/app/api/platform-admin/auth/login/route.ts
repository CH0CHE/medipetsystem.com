import { apiErrorResponse } from "@/lib/http/api-error";
import { mapAuthErrorToApiError } from "@/modules/auth/application/map-auth-error";
import { handleLoginRequest } from "@/modules/auth/application/handle-login";

export async function POST(request: Request) {
  try {
    return await handleLoginRequest(request, "platform-admin", "platform-admin");
  } catch (error) {
    return apiErrorResponse(mapAuthErrorToApiError(error) ?? error);
  }
}

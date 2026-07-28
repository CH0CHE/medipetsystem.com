import { AuthService } from "./application/auth.service";
import { authRepository } from "./infrastructure/auth.repository";
import { refreshTokenRepository } from "./infrastructure/refresh-token.repository";

export const authService = new AuthService(authRepository, refreshTokenRepository);

export * from "./domain/errors";
export * from "./domain/entities";
export { loginSchema, type LoginInput } from "./application/dto/login.schema";
export { changePasswordSchema, type ChangePasswordInput } from "./application/dto/change-password.schema";

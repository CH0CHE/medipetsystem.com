import { SettingsService } from "./application/settings.service";
import { settingsRepository } from "./infrastructure/settings.repository";

export const settingsService = new SettingsService(settingsRepository);

export * from "./domain/entities";
export * from "./domain/permissions";
export { updatePasswordPolicySchema, type UpdatePasswordPolicyInput } from "./application/dto/update-password-policy.schema";

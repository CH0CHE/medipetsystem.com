import { z } from "zod";

export const addAttachmentSchema = z.object({
  fileUrl: z.string().trim().url("URL inválida.").max(500),
  fileType: z.enum(["PDF", "IMAGEN", "LABORATORIO"]),
  label: z.string().trim().max(150).optional().or(z.literal("")),
});

export type AddAttachmentInput = z.infer<typeof addAttachmentSchema>;

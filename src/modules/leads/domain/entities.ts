export type LeadSource = "CONTACTO" | "DEMO";
export type LeadStatus = "NUEVO" | "CONTACTADO" | "CONVERTIDO" | "DESCARTADO";

export interface LeadListItem {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  clinicName: string | null;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  createdAt: Date;
}

export interface LeadListResult {
  items: LeadListItem[];
  totalCount: number;
}

export type FinancialStatus = "SOLVENTE" | "MOROSO" | "SUSPENDIDO";

export interface OwnerListItem {
  ownerId: string;
  fullName: string;
  documentId: string | null;
  phone: string | null;
  email: string | null;
  financialStatus: FinancialStatus;
  petCount: number;
  createdAt: Date;
}

export interface OwnerListResult {
  items: OwnerListItem[];
  totalCount: number;
}

export interface OwnerDetail {
  ownerId: string;
  fullName: string;
  documentId: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  financialStatus: FinancialStatus;
  notes: string | null;
  petCount: number;
  createdAt: Date;
  updatedAt: Date;
}

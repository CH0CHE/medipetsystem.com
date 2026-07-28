export interface SalesReportRow {
  invoiceNumber: string;
  ownerName: string;
  issueDate: Date;
  total: number;
}

export interface SalesReportResult {
  items: SalesReportRow[];
  totalSales: number;
}

export interface InventoryReportRow {
  sku: string;
  name: string;
  totalStock: number;
  costPrice: number;
  salePrice: number;
  stockValue: number;
}

export interface OverdueClientRow {
  ownerName: string;
  phone: string | null;
  invoiceCount: number;
  totalPending: number;
}

export interface ConsultationRow {
  entryDate: Date;
  petName: string;
  ownerName: string;
  veterinarianName: string;
  diagnosis: string | null;
}

export interface ProfitabilityRow {
  productName: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export interface ActiveVeterinarianRow {
  veterinarianName: string;
  entryCount: number;
}

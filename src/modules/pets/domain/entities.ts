export type PetSex = "MACHO" | "HEMBRA";
export type PetStatus = "ACTIVO" | "EN_OBSERVACION" | "HOSPITALIZADO" | "RECUPERADO" | "FALLECIDO";

export interface PetListItem {
  petId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex | null;
  status: PetStatus;
  ownerId: string;
  ownerName: string;
  branchId: string;
  branchName: string;
  createdAt: Date;
}

export interface PetListResult {
  items: PetListItem[];
  totalCount: number;
}

export interface PetDetail {
  petId: string;
  branchId: string;
  branchName: string;
  ownerId: string;
  ownerName: string;
  name: string;
  species: string;
  breed: string | null;
  sex: PetSex | null;
  birthDate: Date | null;
  weightKg: number | null;
  color: string | null;
  photoUrl: string | null;
  microchipNumber: string | null;
  status: PetStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

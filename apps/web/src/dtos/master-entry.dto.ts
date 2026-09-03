import { StatusValues } from '@/enums/status-values.enum';

export interface MasterAttributeDto {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  unit?: string | null;
  storeCode: string;
  status: StatusValues | string;
  displayOrder?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  entryCount?: number;
}

export interface MasterEntryAttributeDto {
  id: number;
  name: string;
  code: string;
  unit?: string | null;
}

export interface MasterEntryDto {
  id: number;
  attributeId: number;
  /** Label shown in a dropdown: "Large". */
  name: string;
  /** Stored/compared value: "L". */
  value: string;
  colorHex?: string | null;
  metadata?: unknown;
  storeCode: string;
  status: StatusValues | string;
  displayOrder?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  attribute?: MasterEntryAttributeDto | null;
}

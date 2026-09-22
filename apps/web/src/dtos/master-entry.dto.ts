import { StatusValues } from '@/enums/status-values.enum';

/** Just enough of the linked row to label it in a listing without a second request. */
export interface MasterAttributeRelationDto {
  id: number;
  name: string;
}

export interface MasterAttributeDto {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  unit?: string | null;
  /** Optional scoping - null means the attribute applies to every category. */
  categoryId?: number | null;
  /** Optional scoping - null means the attribute applies to every brand. */
  brandNameId?: number | null;
  storeCode: string;
  status: StatusValues | string;
  displayOrder?: number | null;
  createdAt: string;
  updatedAt?: string | null;
  entryCount?: number;
  category?: MasterAttributeRelationDto | null;
  brandName?: MasterAttributeRelationDto | null;
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

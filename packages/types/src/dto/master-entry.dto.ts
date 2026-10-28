import { Status } from '../enum/status.enum';
import { JsonValue } from './product-variant.dto';

/** Just enough of the linked row to label it in a listing without a second request. */
export interface MasterAttributeRelationDto {
  id: number;
  name: string;
}

export interface MasterAttributeDto {
  id: number;
  name: string;
  code: string;
  /** Optional scoping - null means the attribute applies to every category. */
  categoryId?: number | null;
  /** Optional scoping - null means the attribute applies to every brand. */
  brandNameId?: number | null;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  /** Lets a listing show "Size (4 values)" without a second request. */
  entryCount?: number;
  category?: MasterAttributeRelationDto | null;
  brandName?: MasterAttributeRelationDto | null;
}

export interface MasterEntryAttributeDto {
  id: number;
  name: string;
  code: string;
}

export interface MasterEntryDto {
  id: number;
  attributeId: number;
  /** Label shown in a dropdown: "Large". */
  name: string;
  /** Stored/compared value: "L". */
  value: string;
  colorHex?: string | null;
  metadata?: JsonValue;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
  attribute?: MasterEntryAttributeDto | null;
}

export interface CreateMasterAttributeDto {
  name: string;
  code: string;
  categoryId?: number | null;
  brandNameId?: number | null;
  status?: Status;
  displayOrder?: number | null;
}

export interface CreateMasterEntryDto {
  attributeId: number;
  name: string;
  value: string;
  colorHex?: string | null;
  metadata?: JsonValue;
  status?: Status;
  displayOrder?: number | null;
}

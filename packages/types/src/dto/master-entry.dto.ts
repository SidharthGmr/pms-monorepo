import { Status } from "../enum/status.enum";
import { JsonValue } from "./product-variant.dto";

/** Just enough of the linked row to label it in a listing without a second request. */
export interface MasterAttributeRelationDto {
  id: number;
  name: string;
}

export interface MasterAttributeDto {
  id: number;
  name: string;
  code: string;
  categoryId?: number | null;
  brandNameId?: number | null;
  storeCode: string;
  status: Status;
  displayOrder?: number | null;
  createdAt: Date | string;
  updatedAt?: Date | string | null;
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
  name: string;
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
  values: string[];
  /** Falls back to the value itself when the caller does not send a separate label. */
  name?: string;
  colorHex?: string | null;
  metadata?: JsonValue;
  status?: Status;
  displayOrder?: number | null;
}

/** Update edits one existing row, so it carries a single value rather than a list. */
export interface UpdateMasterEntryDto {
  attributeId?: number;
  name?: string;
  value?: string;
  colorHex?: string | null;
  metadata?: JsonValue;
  status?: Status;
  displayOrder?: number | null;
}

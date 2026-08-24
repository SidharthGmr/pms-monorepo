
export interface CreateBrandNameModel {
  name: string;
  /** Optional logo. Same array shape as the product uploader produces. */
  images?: string[];
  status: string;
  displayOrder?: number | null;
}


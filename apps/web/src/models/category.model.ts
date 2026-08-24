export interface CreateCategoryModel {
  name: string;
  description?: string;
  /** Optional tile art. Same array shape as the product uploader produces. */
  images?: string[];
  parentId?: number;
  status: string;
  displayOrder?: number;
}

export interface UpdateCategoryModel extends Partial<CreateCategoryModel> { }

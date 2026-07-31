export interface CreateCategoryModel {
  name: string;
  description?: string;
  parentId?: number;
  status: string;
  displayOrder?: number;
}

export interface UpdateCategoryModel extends Partial<CreateCategoryModel> { }

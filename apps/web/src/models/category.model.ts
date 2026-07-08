export interface CreateCategoryModel {
  name: string;
  description?: string;
  parentId?: number;
  status: string;
}

export interface UpdateCategoryModel extends Partial<CreateCategoryModel> { }

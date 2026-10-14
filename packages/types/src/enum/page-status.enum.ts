export type PageStatus = 'Draft' | 'Published' | 'Unpublished' | 'Archived';

export enum PageStatusEnum {
  Draft = 'Draft',
  Published = 'Published',
  Unpublished = 'Unpublished',
  Archived = 'Archived',
}

export type CmsPageUrlOption = 'default' | 'custom';

export type CmsPageConditionForm = 'contact' | 'subscribe';

export type CmsPageLockReason = 'password' | 'condition';

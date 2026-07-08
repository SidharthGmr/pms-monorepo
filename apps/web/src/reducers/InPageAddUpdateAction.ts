export enum InPageAddUpdateActionType {
  SET_ID = 'SET_ID',
  SET_GUID = 'SET_GUID',
  SET_DATA = 'SET_DATA',
  SHOW_LOADER = 'SHOW_LOADER',
  IS_REFRESH_REQUIRED = 'IS_REFRESH_REQUIRED',
  IS_UPDATING = 'IS_UPDATING',
}

export interface InPageAddUpdateState<T> {
  id?: number;
  guid?: string;
  data?: T;
  refreshRequired: boolean;
  showLoader: boolean;
  isUpdating?: boolean;
}

type InPageAddUpdateAction<T> =
  | {
      type: InPageAddUpdateActionType.SET_DATA;
      payload: T;
    }
  | {
      type: InPageAddUpdateActionType.SET_GUID;
      payload: string;
    }
  | {
      type: InPageAddUpdateActionType.SET_ID;
      payload: number;
    }
  | {
      type: InPageAddUpdateActionType.SHOW_LOADER | InPageAddUpdateActionType.IS_REFRESH_REQUIRED | InPageAddUpdateActionType.IS_UPDATING;
      payload: boolean;
    };

export const reducer = <T extends object>(state: InPageAddUpdateState<T>, action: InPageAddUpdateAction<T>) => {
  const { type, payload } = action;
  switch (type) {
    case InPageAddUpdateActionType.SET_DATA:
      return { ...state, data: payload };
    case InPageAddUpdateActionType.SHOW_LOADER:
      return { ...state, showLoader: payload };
    case InPageAddUpdateActionType.IS_REFRESH_REQUIRED:
      return { ...state, refreshRequired: payload };
    case InPageAddUpdateActionType.SET_ID:
      return { ...state, id: payload };
    case InPageAddUpdateActionType.SET_GUID:
      return { ...state, guid: payload };
    case InPageAddUpdateActionType.IS_UPDATING:
      return { ...state, isUpdating: payload };
    default:
      return state;
  }
};

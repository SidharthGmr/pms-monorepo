export enum InPageActionType {
  SET_ID = 'SET_ID',
  SET_GUID = 'SET_GUID',
  SET_DATA = 'SET_DATA',
  SET_CURRENT_PAGE = 'SET_CURRENT_PAGE',
  SHOW_LOADER = 'SHOW_LOADER',
  SHOW_DELETE_MODAL = 'SHOW_DELETE_MODAL',
  SHOW_ADD_UPDATE_MODAL = 'SHOW_ADD_UPDATE_MODAL',
  IS_REFRESH_REQUIRED = 'IS_REFRESH_REQUIRED',
}

export interface InPageState<T> {
  id?: number;
  guid?: string;
  data?: T;
  currentPage: number;
  refreshRequired: boolean;
  showLoader: boolean;
  showAddUpdateModal: boolean;
  showDeleteModal: boolean;
}

type InPageAction<T> =
  | {
      type: InPageActionType.SET_DATA;
      payload: T;
    }
  | {
      type: InPageActionType.SET_GUID;
      payload: string;
    }
  | {
      type: InPageActionType.SET_CURRENT_PAGE | InPageActionType.SET_ID;
      payload: number;
    }
  | {
      type:
        | InPageActionType.SHOW_LOADER
        | InPageActionType.IS_REFRESH_REQUIRED
        | InPageActionType.SHOW_ADD_UPDATE_MODAL
        | InPageActionType.SHOW_DELETE_MODAL
      payload: boolean;
    };

export const reducer = <T extends object>(state: InPageState<T>, action: InPageAction<T>) => {
  const { type, payload } = action;
  switch (type) {
    case InPageActionType.SET_DATA:
      return { ...state, data: payload };
    case InPageActionType.SET_CURRENT_PAGE:
      return { ...state, currentPage: payload };
    case InPageActionType.SHOW_LOADER:
      return { ...state, showLoader: payload };
    case InPageActionType.IS_REFRESH_REQUIRED:
      return { ...state, refreshRequired: payload };
    case InPageActionType.SET_ID:
      return { ...state, id: payload };
    case InPageActionType.SET_GUID:
      return { ...state, guid: payload };
    case InPageActionType.SHOW_ADD_UPDATE_MODAL:
      return { ...state, showAddUpdateModal: payload };
    case InPageActionType.SHOW_DELETE_MODAL:
      return { ...state, showDeleteModal: payload };
    default:
      return state;
  }
};

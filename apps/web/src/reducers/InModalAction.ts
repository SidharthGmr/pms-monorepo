export enum InModalActionType {
  SET_MODAL_HEADING = 'SET_MODAL_HEADING',
  IS_UPDATE = 'IS_UPDATE',
  SHOW_LOADER = 'SHOW_LOADER',
  IS_REFRESH_REQUIRED = 'IS_REFRESH_REQUIRED',
  IS_ACTIVATE = 'IS_ACTIVATE',
}

export interface InModalState {
  modalHeading: string;
  isUpdate?: boolean;
  refreshRequired: boolean;
  showLoader: boolean;
  isActivate?: boolean;
}

type InModalAction =
  | {
      type: InModalActionType.SET_MODAL_HEADING;
      payload: string;
    }
  | {
      type: InModalActionType.SHOW_LOADER | InModalActionType.IS_REFRESH_REQUIRED | InModalActionType.IS_UPDATE | InModalActionType.IS_ACTIVATE;
      payload: boolean;
    };

export const modalReducer = (state: InModalState, action: InModalAction) => {
  const { type, payload } = action;
  switch (type) {
    case InModalActionType.SET_MODAL_HEADING:
      return { ...state, modalHeading: payload };
    case InModalActionType.IS_UPDATE:
      return { ...state, isUpdate: payload };
    case InModalActionType.SHOW_LOADER:
      return { ...state, showLoader: payload };
    case InModalActionType.IS_REFRESH_REQUIRED:
      return { ...state, refreshRequired: payload };
    case InModalActionType.IS_ACTIVATE:
      return { ...state, isActivate: payload };
    default:
      return state;
  }
};

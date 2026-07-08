import { useState, useCallback } from 'react';

const useModalShowHide = () => {
  const [modalState, setModalState] = useState<{
    showAddUpdateModal: boolean;
    refreshRequired: boolean;
    uniqueId?: string | number;
  }>({
    showAddUpdateModal: false,
    refreshRequired: false,
    uniqueId: undefined,
  });

  const openAddUpdateModal = useCallback((id: string | number) => {
    setModalState((prevState) => ({
      ...prevState,
      uniqueId: id,
      showAddUpdateModal: true,
    }));
  }, []);

  const closeAddUpdateModal = useCallback((isRefresh: boolean) => {
    setModalState((prevState) => ({
      ...prevState,
      refreshRequired: isRefresh,
      uniqueId: undefined,
      showAddUpdateModal: false,
    }));
  }, []);

  return {
    showModal: modalState.showAddUpdateModal,
    uniqueId: modalState.uniqueId,
    openModal: openAddUpdateModal,
    closeModal: closeAddUpdateModal,
    refreshRequired: modalState.refreshRequired,
  };
};

export default useModalShowHide;

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useModalShowHide from '@/hooks/use-modal-show-hide';
import { UserStatusDto } from '@/dtos/UserDto';
import IUnitOfService from '@/services/interfaces/IUnitOfService';
import { container } from '@/config/ioc';
import { TYPES } from '@/config/types';
import { useSession } from 'next-auth/react';
import AlterBox from '../common/alert-box';

interface CheckUserStatusProps {
  logout: () => Promise<void>;
}

export default function CheckUserStatus({ logout }: CheckUserStatusProps) {
  const unitOfService = container.get<IUnitOfService>(TYPES.IUnitOfService);
  const { data: session } = useSession();
  const router = useRouter();
  const { showModal, openModal, closeModal } = useModalShowHide();
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const [userStatus, setUserStatus] = useState<UserStatusDto | null>(null);
  const fetchUserStatus = useCallback(async () => {
    if (!session?.user?.usersId) return;
    try {
      const response = await unitOfService.UserListService.getById(session.user.usersId);
      if (response && response.status === 200 && response.data.data) {
        setUserStatus(response.data.data);
      }
    } catch (e) {
      // ignore network errors — don't treat a failed request as inactive
    }
  }, [session?.user?.usersId, unitOfService.UserListService]);

  useEffect(() => {
    const interval = setInterval(fetchUserStatus, process.env.NODE_ENV === 'development' ? 50000 : 4000);
    return () => clearInterval(interval);
  }, [fetchUserStatus]);

  // Removed unused effect for roles

  const logoutRef = async () => {
    setShowLoader(true);
    await logout();
  };

  useEffect(() => {
    if (userStatus) {
      if (!userStatus.isActive) {
        if (!showModal) openModal(0);
      } else {
        if (showModal) closeModal(true);
        if (!userStatus.isEmailVerified) {
          router.push('/verify-email');
        }
      }
    }
  }, [userStatus, showModal, openModal, closeModal, router]);

  return (
    <>
      <AlterBox
        isOpen={showModal}
        heading="Session expired"
        onClose={() => closeModal(true)}
        onSubmit={async () => {
          await logoutRef();
        }}
        loading={showLoader}
        buttonText="Login"
      />
    </>
  );
}

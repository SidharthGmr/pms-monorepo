'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { useGetUserById } from '@/hooks/service-hooks/useUserList.service.hook';

export default function ActiveUserSwitch() {
  const { currentUser } = useGetCurrentUser();

  // The NextAuth session only holds the profile image captured at login, so it can
  // go stale after the user updates their picture. Fetch the current value from the API.
  const userId = ((currentUser as any)?.userId ?? currentUser?.usersId ?? '') as string;
  const { data: userResponse } = useGetUserById(userId, !!userId);
  const apiUser = userResponse?.data?.data;
  console.log('userResponse', userResponse);
  if (!currentUser) return null;

  const name = currentUser.name || '';
  const profileImageUrl = apiUser?.profileImageUrl || '';

  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={profileImageUrl} alt={name} />
        <AvatarFallback className="rounded-lg">{name}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{currentUser.name}</span>
        <span className="truncate text-xs">{currentUser.email}</span>
      </div>
    </>
  );
}

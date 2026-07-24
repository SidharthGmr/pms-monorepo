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
  if (!currentUser) return null;

  const name = currentUser.name || '';
  const profileImageUrl = apiUser?.profileImageUrl || '';

  return (
    <>
      <Avatar className="h-8 w-8 shrink-0 ring-1 ring-primary ring-offset-[2px] ring-offset-background">
        <AvatarImage src={profileImageUrl} alt={name} />
        <AvatarFallback className="uppercase bg-primary text-primary-foreground">{name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <span className="truncate font-semibold">{currentUser.name}</span>
        <span className="truncate text-xs">{currentUser.email}</span>
      </div>
    </>
  );
}

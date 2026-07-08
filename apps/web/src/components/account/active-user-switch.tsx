'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';

export default function ActiveUserSwitch() {
  const { currentUser } = useGetCurrentUser();
  if (!currentUser) return null;

  return (
    <>
      <Avatar className="h-8 w-8 rounded-lg">
        <AvatarImage src={currentUser.profileImageUrl || ''} alt={currentUser.name || ''} />
        <AvatarFallback className="rounded-lg">{currentUser.name || ''}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{currentUser.name}</span>
        <span className="truncate text-xs">{currentUser.email}</span>
      </div>
    </>
  );
}

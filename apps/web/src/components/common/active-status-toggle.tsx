'use client';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { UserDto } from '@/dtos/UserDto';
import { Roles } from '@/enums/roles.enum';
import { useUpdateUserActiveStatus } from '@/hooks/service-hooks/useUserList.service.hook';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { Dot } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ActiveStatusToggle({ user }: { user: UserDto }) {
  const { currentUser } = useGetCurrentUser();
  const isSuperAdmin = currentUser?.role === Roles.SUPER_ADMIN;
  const isAdmin = currentUser?.role === Roles.ADMIN;
  // The session carries the JWT's `userId`; UserDto calls the same value `usersId`.
  const currentUserId = ((currentUser as any)?.userId ?? currentUser?.usersId ?? '') as string;

  // Mirrors the API guards on PUT /users/active-status/:userId — an admin may not
  // touch a super admin, and nobody may deactivate their own account.
  const canToggle = (isSuperAdmin || isAdmin) && !(isAdmin && user.role === Roles.SUPER_ADMIN) && currentUserId !== user.usersId;

  const [active, setActive] = useState<boolean>(!!user.isActive);
  const mutation = useUpdateUserActiveStatus();

  // Keep local state in sync when the list refetches.
  useEffect(() => {
    setActive(!!user.isActive);
  }, [user.isActive]);

  // Everyone else only sees the read-only badge.
  if (!canToggle) {
    return (
      <Badge variant={active ? 'cyan' : 'blue'}>
        <Dot className={active ? 'text-green-500' : 'text-gray-400'} />
        {active ? 'Active' : 'Inactive'}
      </Badge>
    );
  }

  const handleToggle = async (next: boolean) => {
    const previous = active;
    setActive(next); // optimistic
    try {
      const response = await mutation.mutateAsync({ userId: user.usersId, isActive: next });
      if (response && response.status === 200 && response.data?.success) {
        toast({
          variant: 'success',
          description: response.data.message || `User ${next ? 'activated' : 'deactivated'}.`,
        });
      } else {
        setActive(previous);
        toast({
          variant: 'destructive',
          description: response?.data?.message || 'Could not update status. Please try again.',
        });
      }
    } catch (error) {
      setActive(previous);
      toast({
        variant: 'destructive',
        description: 'Something went wrong while updating status.',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Switch checked={active} onCheckedChange={handleToggle} disabled={mutation.isPending} aria-label={active ? 'Deactivate user' : 'Activate user'} />
      <span className={`text-xs font-medium ${active ? 'text-green-600' : 'text-muted-foreground'}`}>{active ? 'Active' : 'Inactive'}</span>
    </div>
  );
}

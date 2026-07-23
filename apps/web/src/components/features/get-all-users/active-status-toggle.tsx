'use client';

import { useEffect, useState } from 'react';
import { Dot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/use-toast';
import { Roles } from '@/enums/roles.enum';
import useGetCurrentUser from '@/hooks/useGetCurrentUser';
import { useUpdateUserActiveStatus } from '@/hooks/service-hooks/useUserList.service.hook';
import { UserDto } from '@/dtos/UserDto';

export default function ActiveStatusToggle({ user }: { user: UserDto }) {
  const { currentUser } = useGetCurrentUser();
  const isSuperAdmin = currentUser?.role === Roles.SUPER_ADMIN;

  const [active, setActive] = useState<boolean>(!!user.isActive);
  const mutation = useUpdateUserActiveStatus();

  // Keep local state in sync when the list refetches.
  useEffect(() => {
    setActive(!!user.isActive);
  }, [user.isActive]);

  // Non–super-admins only see the read-only badge.
  if (!isSuperAdmin) {
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
      <Switch
        checked={active}
        onCheckedChange={handleToggle}
        disabled={mutation.isPending}
        aria-label={active ? 'Deactivate user' : 'Activate user'}
      />
      <span className={`text-xs font-medium ${active ? 'text-green-600' : 'text-muted-foreground'}`}>
        {active ? 'Active' : 'Inactive'}
      </span>
    </div>
  );
}

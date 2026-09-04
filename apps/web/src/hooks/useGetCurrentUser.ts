import { UserDto } from '@/dtos/UserDto';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useMemo } from 'react';

const useGetCurrentUser = () => {
  const { data: session, status } = useSession();
  const [currentUser, setCurrentUser] = useState<UserDto | undefined>(undefined);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setCurrentUser(session.user as unknown as UserDto);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [status, session]);

  // isAuthenticated belongs in the deps: without it the memo held the previous
  // flag for a render after login or logout, so consumers read a stale value.
  const memoizedCurrentUser = useMemo(() => {
    return { currentUser, status, isAuthenticated };
  }, [currentUser, status, isAuthenticated]);

  return memoizedCurrentUser;
};

export default useGetCurrentUser;

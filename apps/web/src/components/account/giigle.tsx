'use client';
import { useSession, signIn, signOut } from 'next-auth/react';
import Image from 'next/image';
export default function Component() {
  const { data: session } = useSession();
  if (session) {
    return (
      <>
        <div>
          <h2>User Details</h2>
          <p>
            {session.user.profileImageUrl && (
              <>
                <strong>Profile Image:</strong> <Image src={session.user.profileImageUrl} alt="Profile Image" width={50} height={50} />
              </>
            )}
          </p>
          <p>
            <strong>Username:</strong> {session.user.name}
          </p>
          <p>
            <strong>User ID:</strong> {session.user.id}
          </p>
          <p>
            <strong>Role:</strong> {session.user.role}
          </p>
          <button onClick={() => signOut()}>Sign out</button>
        </div>
      </>
    );
  }

  return (
    <>
      <div>
        <h2>Not Signed In</h2>
        <button onClick={() => signIn()}>Sign in</button>
      </div>
    </>
  );
}

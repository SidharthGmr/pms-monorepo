import config from '@/config';
import { UserDto } from '@pms/types';
import axios from 'axios';
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

/** Refresh this far before the access token actually expires. Must stay larger
 *  than the client-side pre-emptive refresh window in `utils/auth.ts`. */
const REFRESH_SKEW_MS = 120_000;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: {
          label: 'Email',
          type: 'email',
          placeholder: '',
        },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        const loginUrl: string = `${config.apiBaseUrl}/auth/login`;

        try {
          const response = await axios.post(
            loginUrl,
            {
              email: credentials?.email,
              password: credentials?.password,
            },
            {
              headers: {
                'content-type': 'application/json',
                clientId: config.clientId,
              },
              withCredentials: false,
            }
          );

          return response.data.data.user;

        } catch (error) {
          if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Invalid username or password');
          }
          return null;
        }
      },
    }),
  ],
  secret: `${process.env.NEXTAUTH_SECRET}`,
  // callbacks: {
  //   async jwt({ token, user }) {
  //     if (user) {
  //       (token as any).user = user;
  //       if ((user as any).token) {
  //         (token as any).token = (user as any).token;
  //       }
  //     }
  //     return token;
  //   },

  //   async session({ session, token }) {
  //     (session as any).user = (token as any).user ?? session.user;
  //     (session as any).token = (token as any).token ?? null;
  //     return session;
  //   },

  // },

  callbacks: {
    async jwt({ token, user }) {
      // 1. Initial Sign In
      if (user) {
        token = { ...token, ...user };

        // Decode the JWT to find out when it actually expires
        const parsedToken = JSON.parse(Buffer.from((user as any).token.split('.')[1], 'base64').toString());
        token.accessTokenExpires = parsedToken.exp * 1000;
        return token;
      }

      // 2. Return previous token while it is still comfortably valid.
      //    The skew keeps a caller that pre-empts expiry (see utils/auth.ts) from
      //    getting the old token back and immediately asking again.
      if (Date.now() < (token.accessTokenExpires as number) - REFRESH_SKEW_MS) {
        return token;
      }

      // 3. Access token is expiring, exchange the refresh token for a fresh pair.
      //    This callback is the ONLY place the refresh token is spent: the API
      //    rotates it on every use and revokes the session if an old one comes back,
      //    so a second refresher would sign the user out.
      try {
        const response = await axios.post(`${config.apiBaseUrl}/auth/refresh-token`, {
          token: token.refreshToken,
        }, {
          headers: { 'clientId': config.clientId, 'content-type': 'application/json' }
        });

        const refreshedTokens = response.data.data;
        const parsedNewToken = JSON.parse(Buffer.from(refreshedTokens.newToken.split('.')[1], 'base64').toString());

        return {
          ...token,
          token: refreshedTokens.newToken,
          refreshToken: refreshedTokens.refreshToken ?? token.refreshToken,
          accessTokenExpires: parsedNewToken.exp * 1000,
          error: undefined,
        };
      } catch (error) {
        return {
          ...token,
          error: "RefreshAccessTokenError",
        };
      }
    },

    async session({ session, token }) {
      // The refresh token stays in the encrypted NextAuth cookie — it must not be
      // handed to the browser, which only ever needs the short-lived access token.
      const { refreshToken, ...clientSafeToken } = token as Record<string, unknown>;
      session.user = clientSafeToken as unknown as UserDto;
      (session as any).error = token.error as string; // Pass any refresh errors to the client
      return session;
    },
  },
  session: { strategy: 'jwt' },
  events: {
    async signOut() { },
  },
  // Enable debug messages in the console if you are having problems
  debug: config.environment !== 'production',
  pages: {
    signIn: '/',
  },
};

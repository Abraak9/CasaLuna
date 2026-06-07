import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { queryOne } from './db';

interface Admin {
  id: string;
  email: string;
  name: string;
  valid: boolean;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Use PostgreSQL's crypt() for verification — matches gen_salt('bf') hashes
        const admin = await queryOne<Admin>(
          `SELECT id, email, name,
             (password_hash = crypt($2, password_hash)) AS valid
           FROM admins WHERE email = $1`,
          [credentials.email, credentials.password as string]
        );

        if (!admin || !admin.valid) return null;

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        };
      },
    }),
  ],
  pages: {
    signIn: '/admin/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone as string },
        });

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});

/**
 * Server-side RBAC guard — call at the top of every protected API route.
 * Client-side gating alone is never sufficient.
 */
export async function requireRole(allowedRoles: string[]) {
  const session = await auth();
  if (!session?.user || !allowedRoles.includes((session.user as any).role)) {
    return null;
  }
  return session;
}
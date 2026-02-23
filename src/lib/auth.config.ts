import type { NextAuthConfig } from "next-auth";

// Edge-совместимый конфиг — без Prisma и bcrypt
// Используется только в proxy.ts (middleware)
export const authConfig = {
  session: { strategy: "jwt" as const },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.companyId = (user as any).companyId;
        token.role = (user as any).role;
        token.canCreateCourses = (user as any).canCreateCourses;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.companyId = token.companyId as string;
      session.user.role = token.role as string;
      session.user.canCreateCourses = token.canCreateCourses as boolean;
      return session;
    },
  },
} satisfies NextAuthConfig;

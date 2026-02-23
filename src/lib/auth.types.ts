import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      companyId: string;
      role: string;
      canCreateCourses: boolean;
    } & DefaultSession["user"];
  }
}

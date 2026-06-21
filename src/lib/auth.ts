import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Derive the production URL: prefer explicit NEXTAUTH_URL, then VERCEL_URL, then localhost
const appUrl = process.env.NEXTAUTH_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
  || "http://localhost:3000";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
    newUser: "/auth/register",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            institute: {
              select: { id: true, slug: true, name: true, isApproved: true },
            },
          },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("Your account has been deactivated. Please contact support.");
        }

        if (!user.emailVerified) {
          throw new Error("Please verify your email address before logging in. Check your inbox.");
        }

        if (user.institute && !user.institute.isApproved) {
          throw new Error("Your institute is pending approval from the Super Admin.");
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.password);
        if (!isValidPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          instituteId: user.instituteId,
          instituteSlug: user.institute?.slug || null,
          instituteName: user.institute?.name || null,
          mustChangePassword: user.mustChangePassword,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.instituteId = (user as any).instituteId;
        token.instituteSlug = (user as any).instituteSlug;
        token.instituteName = (user as any).instituteName;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
      }
      if (trigger === "update" && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = session.mustChangePassword as boolean;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.instituteId = token.instituteId as string;
        session.user.instituteSlug = token.instituteSlug as string;
        session.user.instituteName = token.instituteName as string;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Could log sign-in events here
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-build-purposes-only",
  useSecureCookies: appUrl.startsWith("https://"),
};

export const getAuthSession = () => getServerSession(authOptions);

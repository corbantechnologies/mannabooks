import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_BASE_URL = (process.env.API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required.");
        }

        try {
          const res = await fetch(`${API_BASE_URL}/v1/auth/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "X-Internal-Key": process.env.INTERNAL_API_KEY || "",
            },
            body: new URLSearchParams({
              username: credentials.email.toLowerCase().trim(),
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.access_token) {
            throw new Error(data.detail || data.error || "Invalid credentials.");
          }

          // Fetch user profile using the token
          const userRes = await fetch(`${API_BASE_URL}/v1/auth/me`, {
            headers: {
              Authorization: `Bearer ${data.access_token}`,
              "X-Internal-Key": process.env.INTERNAL_API_KEY || "",
            },
          });

          const userData = await userRes.json();
          const user = userData.user || userData;

          return {
            id: user.id || "user",
            name: user.name || credentials.email,
            email: user.email || credentials.email,
            accessToken: data.access_token,
            isSuperAdmin: Boolean(user.is_super_admin || user.isSuperAdmin),
            plan: user.plan || "FREE",
          } as any;
        } catch (error: any) {
          throw new Error(error.message || "Authentication failed.");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.isSuperAdmin = (user as any).isSuperAdmin;
        token.plan = (user as any).plan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).accessToken = token.accessToken;
        (session.user as any).isSuperAdmin = token.isSuperAdmin;
        (session.user as any).plan = token.plan;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "manna_books_nextauth_secret_key_africa",
};

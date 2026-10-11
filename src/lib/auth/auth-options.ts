import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

function getApiBaseUrl(): string {
  const envUrl = (process.env.API_BASE_URL || "").replace(/\/$/, "");
  if (envUrl) return envUrl;
  if (process.env.NEXT_PUBLIC_API_URL?.startsWith("http")) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_APP_URL?.startsWith("http")) {
    return `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/v1`;
  }
  return "http://127.0.0.1:8000";
}

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
          const apiBase = getApiBaseUrl();
          const res = await fetch(`${apiBase}/v1/auth/token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Key": process.env.INTERNAL_API_KEY || "",
            },
            body: JSON.stringify({
              email: credentials.email.toLowerCase().trim(),
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.access_token) {
            throw new Error(data.detail || data.error || "Invalid credentials.");
          }

          const user = data.user || {};

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

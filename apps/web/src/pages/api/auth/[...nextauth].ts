import NextAuth, { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { SiweMessage } from "siwe";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Ethereum",
      credentials: { message: { label: "Message", type: "text" }, signature: { label: "Signature", type: "text" } },
      async authorize(creds) {
        try {
          const msg = new SiweMessage(JSON.parse(creds?.message || "{}"));
          const verifyResult = await msg.verify({ signature: creds?.signature || "" });
          const address = verifyResult?.data?.address;
          if (!address) return null;
          await prisma.user.upsert({ where: { address }, update: {}, create: { address } });
          return { id: address, name: address };
        } catch {
          return null;
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) { if (user?.id) token.sub = user.id; return token; },
    async session({ session, token }) { session.user = { name: token.sub || "" } as any; return session; }
  }
};

export default NextAuth(authOptions);

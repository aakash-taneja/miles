import { prisma } from "@/lib/prisma";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).end();
  
  // Get the user address from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "not authenticated" });
  }

  const address = authHeader.replace('Bearer ', '');
  if (!address) return res.status(401).json({ error: "not authenticated" });
  
  try {
    // Find user and get their transactions
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 50 // Limit to last 50 transactions
        }
      }
    });

    if (!user) {
      return res.json([]);
    }

    res.json(user.transactions);
  } catch (error: any) {
    console.error("Transactions API error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to get transactions" 
    });
  }
}


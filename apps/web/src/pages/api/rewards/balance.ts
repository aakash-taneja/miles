import { TokenRewardService } from "./mint";

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
    const tokenService = new TokenRewardService();
    const balance = await tokenService.getBalance(address);
    
    res.json({ 
      success: true, 
      balance: balance,
      address: address
    });
  } catch (error: any) {
    console.error("Balance API error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to get balance",
      details: error.stack
    });
  }
}

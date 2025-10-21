import { TokenRewardService } from "./mint";

export default async function handler(req: any, res: any) {
  console.log("=== REWARDS/BALANCE API CALLED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Query:", JSON.stringify(req.query, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
  if (req.method !== "GET") {
    console.log("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("✅ Method check passed");
  
  // Get the user address from the Authorization header
  const authHeader = req.headers.authorization;
  console.log("Auth header:", authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log("❌ No valid auth header");
    return res.status(401).json({ error: "not authenticated" });
  }

  const address = authHeader.replace('Bearer ', '');
  console.log("Extracted address:", address);
  
  if (!address) {
    console.log("❌ No address extracted");
    return res.status(401).json({ error: "not authenticated" });
  }

  console.log("✅ Authentication check passed");
  
  // Check for required environment variables
  console.log("Checking environment variables...");
  console.log("PRIVATE_KEY exists:", !!process.env.PRIVATE_KEY);
  console.log("PRIVATE_KEY value:", process.env.PRIVATE_KEY ? "SET" : "NOT SET");
  console.log("SEPOLIA_RPC_URL exists:", !!process.env.SEPOLIA_RPC_URL);
  console.log("SEPOLIA_RPC_URL value:", process.env.SEPOLIA_RPC_URL ? "SET" : "NOT SET");
  console.log("DATACOIN_CONTRACT_ADDRESS exists:", !!process.env.DATACOIN_CONTRACT_ADDRESS);
  console.log("DATACOIN_CONTRACT_ADDRESS value:", process.env.DATACOIN_CONTRACT_ADDRESS ? "SET" : "NOT SET");
  
  if (!process.env.PRIVATE_KEY) {
    console.log("❌ PRIVATE_KEY not set");
    return res.status(500).json({ 
      success: false, 
      error: "Server configuration error: PRIVATE_KEY not set" 
    });
  }

  console.log("✅ Environment variables check passed");
  
  try {
    console.log("🔍 Creating TokenRewardService...");
    const tokenService = new TokenRewardService();
    console.log("✅ TokenRewardService created successfully");
    
    console.log("🔍 Getting balance for address:", address);
    const balance = await tokenService.getBalance(address);
    console.log("✅ Balance retrieved:", balance);
    
    console.log("✅ Successfully returning balance");
    res.json({ 
      success: true, 
      balance: balance,
      address: address
    });
  } catch (error: any) {
    console.error("❌ REWARDS/BALANCE API ERROR:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to get balance",
      details: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

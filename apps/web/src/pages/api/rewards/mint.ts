import { ethers } from "ethers";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DataCoin ABI (you'll need to add the actual ABI)
const DataCoinABI = [
  "function mint(address to, uint256 amount) external",
  "function balanceOf(address account) external view returns (uint256)"
];

const getChainConfig = (chainName: string) => {
  const configs = {
    sepolia: {
      rpc: process.env.SEPOLIA_RPC_URL || "https://1rpc.io/sepolia",
      datacoinAddress: process.env.DATACOIN_CONTRACT_ADDRESS || "0x33da15fdcaa8e7ca38ffe2048421d5e193100747"
    },
  };
  return configs[chainName as keyof typeof configs] || configs.sepolia;
};

export class TokenRewardService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private datacoinContract: ethers.Contract;
  
  constructor() {
    console.log("🔍 TokenRewardService constructor called");
    const chainName = "sepolia";
    const { rpc, datacoinAddress } = getChainConfig(chainName);
    
    console.log("Chain config:");
    console.log("- chainName:", chainName);
    console.log("- rpc:", rpc);
    console.log("- datacoinAddress:", datacoinAddress);
    
    if (!process.env.PRIVATE_KEY) {
      console.log("❌ PRIVATE_KEY not found in environment");
      throw new Error("PRIVATE_KEY environment variable is required");
    }
    
    console.log("✅ PRIVATE_KEY found in environment");
    console.log("Creating ethers provider...");
    this.provider = new ethers.JsonRpcProvider(rpc);
    console.log("✅ Provider created");
    
    console.log("Creating wallet...");
    this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    console.log("✅ Wallet created, address:", this.wallet.address);
    
    console.log("Creating contract instance...");
    this.datacoinContract = new ethers.Contract(
      datacoinAddress,
      DataCoinABI,
      this.wallet
    );
    console.log("✅ Contract instance created");
    console.log("✅ TokenRewardService constructor completed");
  }

  async mintTokens(address: string, amount: number): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      console.log(`Minting ${amount} tokens to ${address}`);
      
      const mintTx = await this.datacoinContract.mint(
        address,
        ethers.parseUnits(amount.toString(), 18)
      );
      
      await mintTx.wait();
      
      console.log("Tx hash:", mintTx.hash);
      console.log("Tokens minted to", address);
      
      return {
        success: true,
        txHash: mintTx.hash
      };
    } catch (error: any) {
      console.error("Token minting failed:", error);
      return {
        success: false,
        error: error.message || "Token minting failed"
      };
    }
  }

  async getBalance(address: string): Promise<string> {
    try {
      console.log("🔍 getBalance called for address:", address);
      console.log("Calling contract.balanceOf...");
      const balance = await this.datacoinContract.balanceOf(address);
      console.log("✅ Raw balance from contract:", balance.toString());
      const formattedBalance = ethers.formatUnits(balance, 18);
      console.log("✅ Formatted balance:", formattedBalance);
      return formattedBalance;
    } catch (error:any) {
      console.error("❌ Failed to get balance:");
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("Full error:", JSON.stringify(error, null, 2));
      return "0";
    }
  }
}

// API endpoint for minting tokens
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  
  // Get the user address from the Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "not authenticated" });
  }

  const address = authHeader.replace('Bearer ', '');
  if (!address) return res.status(401).json({ error: "not authenticated" });
  
  const { amount = 1 } = req.body; // Default to 1 token per image
  
  // Find or create user
  const user = await prisma.user.upsert({
    where: { address },
    update: {},
    create: { address }
  });
  
  const tokenService = new TokenRewardService();
  const result = await tokenService.mintTokens(address, amount);
  
  if (result.success) {
    // Store transaction in database
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "mint",
        amount: amount.toString(),
        txHash: result.txHash!,
        status: "confirmed",
        description: `Earned ${amount} DataCoin for uploading image`
      }
    });
    
    res.json({ 
      success: true, 
      txHash: result.txHash,
      message: `Successfully minted ${amount} DataCoin tokens to ${address}`
    });
  } else {
    res.status(500).json({ 
      success: false, 
      error: result.error 
    });
  }
}

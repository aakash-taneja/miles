import { NextApiRequest, NextApiResponse } from 'next';
import lighthouse from "@lighthouse-web3/sdk";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file } = req.body;
    
    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Get API key from server-side environment variable (not NEXT_PUBLIC_)
    const apiKey = process.env.LIGHTHOUSE_API_KEY;
    const gateway = process.env.LIGHTHOUSE_GATEWAY || "https://gateway.lighthouse.storage/ipfs";
    
    if (!apiKey) {
      return res.status(500).json({ error: 'Lighthouse API key not configured' });
    }

    // Convert base64 back to file if needed
    const fileBuffer = Buffer.from(file, 'base64');
    
    // Upload to Lighthouse
    const output = await lighthouse.upload([fileBuffer], apiKey);
    const cid = output?.data?.Hash;
    
    if (!cid) {
      throw new Error("Lighthouse upload failed");
    }

    return res.json({ 
      cid, 
      url: `${gateway}/${cid}` 
    });

  } catch (error: any) {
    console.error("Lighthouse upload error:", error);
    return res.status(500).json({ 
      error: "Upload failed", 
      details: error.message 
    });
  }
}

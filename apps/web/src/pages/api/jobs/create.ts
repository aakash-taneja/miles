import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Body = { datasetId: string; sourceCid: string; sourceUrl: string; filename: string; recipe: string; count?: number; seed?: number; };


export default async function handler(req: any, res: any) {
  console.log("=== JOBS/CREATE API CALLED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Query:", JSON.stringify(req.query, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
  if (req.method !== "POST") {
    console.log("❌ Method not allowed:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("✅ Method check passed");

  // Get the user address from the Authorization header (sent by Privy)
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
  console.log("AUGMENTOR_URL exists:", !!process.env.AUGMENTOR_URL);
  console.log("AUGMENTOR_URL value:", process.env.AUGMENTOR_URL ? "SET" : "NOT SET");
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("DATABASE_URL value:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  
  if (!process.env.AUGMENTOR_URL) {
    console.log("❌ AUGMENTOR_URL not set");
    return res.status(500).json({ 
      error: "Server configuration error: AUGMENTOR_URL not set" 
    });
  }

  console.log("✅ Environment variables check passed");

  let job: any = null;

  try {
    console.log("🔍 Starting database operations...");
    
    // ensure user exists
    console.log("Creating/finding user with address:", address);
    const user = await prisma.user.upsert({
      where: { address },
      update: {},
      create: { address }
    });
    console.log("✅ User upsert completed, user ID:", user.id);

    const { datasetId, sourceCid, sourceUrl, filename, recipe, count, seed } = req.body as Body;
    console.log("Request body parsed:");
    console.log("- datasetId:", datasetId);
    console.log("- sourceCid:", sourceCid);
    console.log("- sourceUrl:", sourceUrl);
    console.log("- filename:", filename);
    console.log("- recipe:", recipe);
    console.log("- count:", count);
    console.log("- seed:", seed);

    // ensure dataset exists (so you don't hit FK errors again)
    console.log("Creating/finding dataset with ID:", datasetId);
    await prisma.dataset.upsert({
      where: { id: datasetId },
      update: {},
      create: { 
        id: datasetId, 
        ownerId: user.id, 
        name: `Dataset by ${address.slice(0, 6)}...${address.slice(-4)}`,
        description: `Personal dataset for ${address}`,
        region: "Global"
      }
    });
    console.log("✅ Dataset upsert completed");

    console.log("Creating image record...");
    const image = await prisma.image.create({
      data: { datasetId, key: sourceCid, meta: { filename, sourceUrl } as any }
    });
    console.log("✅ Image created, image ID:", image.id);

    console.log("Creating job record...");
    job = await prisma.job.create({
      data: { imageId: image.id, recipe, status: "processing" }
    });
    console.log("✅ Job created, job ID:", job.id);

    console.log("🔍 Starting augmentor service call...");
    const augmentorUrl = process.env.AUGMENTOR_URL;
    console.log("Augmentor URL:", augmentorUrl);
    
    const requestBody = {
      srcUrl: sourceUrl,
      recipe,
      count: Math.min(12, Math.max(1, count ?? 10)),
      seed: seed ?? Math.floor(Math.random() * 1e9)
    };
    console.log("Augmentor request body:", JSON.stringify(requestBody, null, 2));

    console.log("Making fetch request to augmentor...");
    const r = await fetch(`${augmentorUrl}/augment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody)
    });
    
    console.log("Augmentor response status:", r.status);
    console.log("Augmentor response headers:", JSON.stringify(Object.fromEntries(r.headers.entries()), null, 2));
    
    if (!r.ok) {
      const errorText = await r.text();
      console.log("❌ Augmentor service error response:", errorText);
      throw new Error(`Augmentor service error: ${r.status} - ${errorText}`);
    }
    
    console.log("✅ Augmentor service call successful");
    const data = await r.json();
    console.log("Augmentor response data:", JSON.stringify(data, null, 2));
    
    console.log("Updating job status to completed...");
    await prisma.job.update({ where: { id: job.id }, data: { status: "completed" } });
    console.log("✅ Job status updated to completed");
    
    console.log("✅ Successfully returning job result");
    return res.json({ jobId: job.id, outputsBase64: data.outputsBase64 });
  } catch (e: any) {
    console.error("❌ JOBS/CREATE API ERROR:");
    console.error("Error message:", e.message);
    console.error("Error stack:", e.stack);
    console.error("Error name:", e.name);
    console.error("Full error object:", JSON.stringify(e, null, 2));
    
    // Try to update job status if job was created
    try {
      if (typeof job !== 'undefined' && job && job.id) {
        console.log("Attempting to update job status to failed...");
        await prisma.job.update({ where: { id: job.id }, data: { status: "failed" } });
        console.log("✅ Job status updated to failed");
      }
    } catch (updateError) {
      console.error("❌ Failed to update job status:", updateError);
    }
    
    return res.status(500).json({ 
      error: "augment failed", 
      details: e.message || "Unknown error occurred",
      timestamp: new Date().toISOString()
    });
  }
}

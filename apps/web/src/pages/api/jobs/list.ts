import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  console.log("=== JOBS/LIST API CALLED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("Query:", JSON.stringify(req.query, null, 2));
  console.log("Body:", JSON.stringify(req.body, null, 2));
  
  if (req.method !== "GET") {
    console.log("❌ Method not allowed:", req.method);
    return res.status(405).end();
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
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("DATABASE_URL value:", process.env.DATABASE_URL ? "SET" : "NOT SET");
  
  try {
    console.log("🔍 Starting database query...");
    console.log("Querying user with address:", address);
    
    // Find user and get their jobs through the relationship chain
    const user = await prisma.user.findUnique({
      where: { address },
      include: {
        datasets: {
          include: {
            images: {
              include: {
                jobs: {
                  orderBy: { createdAt: "desc" },
                  take: 20
                }
              }
            }
          }
        }
      }
    });

    console.log("Database query completed");
    console.log("User found:", !!user);
    console.log("User ID:", user?.id);
    console.log("User datasets count:", user?.datasets?.length || 0);

    if (!user) {
      console.log("⚠️ No user found, returning empty array");
      return res.json([]);
    }

    console.log("Processing datasets and jobs...");
    
    // Flatten all jobs from all user's datasets
    const jobs = user.datasets.flatMap(dataset => 
      dataset.images.flatMap(image => image.jobs)
    );

    console.log("Total jobs found:", jobs.length);
    console.log("Jobs:", jobs.map(job => ({ id: job.id, status: job.status, createdAt: job.createdAt })));

    // Sort by creation date (most recent first) and limit to 20
    const sortedJobs = jobs
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);

    console.log("Sorted jobs count:", sortedJobs.length);
    console.log("✅ Successfully returning jobs");
    
    res.json(sortedJobs);
  } catch (error: any) {
    console.error("❌ JOBS/LIST API ERROR:");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
    res.status(500).json({ 
      error: error.message || "Failed to get jobs",
      details: error.stack,
      timestamp: new Date().toISOString()
    });
  }
}

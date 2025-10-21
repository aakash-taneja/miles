import { prisma } from "@/lib/prisma";

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).end();

  // Get the user address from the Authorization header (sent by Privy)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "not authenticated" });
  }

  const address = authHeader.replace('Bearer ', '');
  if (!address) return res.status(401).json({ error: "not authenticated" });

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

  if (!user) {
    return res.json([]);
  }

  // Flatten all jobs from all user's datasets
  const jobs = user.datasets.flatMap(dataset => 
    dataset.images.flatMap(image => image.jobs)
  );

  // Sort by creation date (most recent first) and limit to 20
  const sortedJobs = jobs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  res.json(sortedJobs);
}

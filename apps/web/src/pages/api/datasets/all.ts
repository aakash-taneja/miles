import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    // Get all datasets with their images and jobs
    const datasets = await prisma.dataset.findMany({
      include: {
        owner: {
          select: {
            id: true,
            address: true
          }
        },
        images: {
          include: {
            jobs: {
              where: {
                status: "done"
              },
              orderBy: { createdAt: "desc" }
              // Get ALL completed jobs, not just the most recent one
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Transform the data to match our frontend expectations
    const transformedDatasets = datasets.map(dataset => {
      // Get all outputs from completed jobs
      const allOutputs = dataset.images.flatMap(image => 
        image.jobs.flatMap(job => {
          if (job.outputs && Array.isArray(job.outputs)) {
            return job.outputs.map((output: any) => ({
              cid: output.cid,
              url: output.url
            }));
          }
          return [];
        })
      );

      return {
        id: dataset.id,
        userId: dataset.owner.address,
        name: dataset.name,
        description: dataset.description,
        region: dataset.region,
        createdAt: dataset.createdAt,
        status: "completed",
        outputs: allOutputs
      };
    }).filter(dataset => dataset.outputs.length > 0); // Only include datasets with actual outputs

    res.json(transformedDatasets);
  } catch (error) {
    console.error("Error fetching datasets:", error);
    res.status(500).json({ error: "Failed to fetch datasets" });
  }
}

import { prisma } from "@/lib/prisma";

type Body = { jobId: string; variants: { cid: string; url: string }[] };

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();
  
  // Get the user address from the Authorization header (sent by Privy)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "not authenticated" });
  }

  const address = authHeader.replace('Bearer ', '');
  if (!address) return res.status(401).json({ error: "not authenticated" });
  
  const { jobId, variants } = req.body as Body;
  
  // Verify the job belongs to the authenticated user
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      image: {
        include: {
          dataset: {
            include: {
              owner: true
            }
          }
        }
      }
    }
  });
  
  if (!job || job.image.dataset.owner.address !== address) {
    return res.status(403).json({ error: "not authorized" });
  }
  await prisma.job.update({
    where: { id: jobId },
    data: { status: "done", outputs: variants as any }
  });
  res.json({ ok: true });
}

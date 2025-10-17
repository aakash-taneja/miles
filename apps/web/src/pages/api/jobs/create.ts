import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Body = { datasetId: string; sourceCid: string; sourceUrl: string; filename: string; recipe: string; count?: number; seed?: number; };


export default async function handler(req: any, res: any) {
  if (req.method !== "POST") return res.status(405).end();

  // Get the user address from the Authorization header (sent by Privy)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "not authenticated" });
  }

  const address = authHeader.replace('Bearer ', '');
  if (!address) return res.status(401).json({ error: "not authenticated" });

  // ensure user exists
  const user = await prisma.user.upsert({
    where: { address },
    update: {},
    create: { address }
  });

  const { datasetId, sourceCid, sourceUrl, filename, recipe, count, seed } = req.body as Body;

  // ensure dataset exists (so you don't hit FK errors again)
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

  const image = await prisma.image.create({
    data: { datasetId, key: sourceCid, meta: { filename, sourceUrl } as any }
  });

  const job = await prisma.job.create({
    data: { imageId: image.id, recipe, status: "processing" }
  });

  try {
    const r = await fetch(`${process.env.AUGMENTOR_URL}/augment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        srcUrl: sourceUrl,
        recipe,
        count: Math.min(12, Math.max(1, count ?? 10)),
        seed: seed ?? Math.floor(Math.random() * 1e9)
      })
    });
    if (!r.ok) throw new Error(await r.text());
    const data = await r.json();
    return res.json({ jobId: job.id, outputsBase64: data.outputsBase64 });
  } catch (e) {
    await prisma.job.update({ where: { id: job.id }, data: { status: "failed" } });
    return res.status(500).json({ error: "augment failed" });
  }
}

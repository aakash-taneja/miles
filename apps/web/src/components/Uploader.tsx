"use client";

import { useState, useRef } from "react";
import lighthouse from "@lighthouse-web3/sdk";
import { usePrivy } from "@privy-io/react-auth";

type Variant = { cid: string; url: string };

export default function Uploader({ datasetId, onRewardSuccess }: { datasetId: string; onRewardSuccess?: () => void }) {
  const [status, setStatus] = useState<string>("");
  const [previews, setPreviews] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [recipe, setRecipe] = useState("weather_basic");
  const [count, setCount] = useState(10);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const { user } = usePrivy();

  const GATEWAY = process.env.NEXT_PUBLIC_LIGHTHOUSE_GATEWAY!;
  const API_KEY = process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY!;

  async function uploadOriginalToLighthouse(file: File) {
    setStatus("Uploading original to Lighthouse...");

    const output = await lighthouse.upload([file], API_KEY);
    const cid = output?.data?.Hash;
    if (!cid) throw new Error("Lighthouse upload failed");
    return { cid, url: `${GATEWAY}/${cid}` };
  }

  function base64ToFile(b64: string, fileName: string) {
    const arr = b64.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[arr.length - 1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new File([u8], fileName, { type: mime });
  }

  async function uploadVariantsToLighthouse(b64s: string[], prefix: string) {
    setStatus("Uploading variants to Lighthouse...");
    const batchSize = 3;
    const results: Variant[] = [];
    for (let i = 0; i < b64s.length; i += batchSize) {
      const slice = b64s.slice(i, i + batchSize);
      const uploaded = await Promise.all(slice.map(async (b64, j) => {
        const f = base64ToFile(b64, `${prefix}_${i + j + 1}.jpg`);
        const out = await lighthouse.upload([f], API_KEY);
        const cid = out?.data?.Hash;
        if (!cid) throw new Error("Variant upload failed");
        return { cid, url: `${GATEWAY}/${cid}` };
      }));
      results.push(...uploaded);
      setStatus(`Uploaded ${Math.min(i + batchSize, b64s.length)} / ${b64s.length}`);
    }
    return results;
  }
  

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setStatus("Starting...");
      setPreviews([]);

      // 1) upload original
      const { cid, url } = await uploadOriginalToLighthouse(file);

      // 2) kick off job, get base64 variants from server
      setStatus("Generating variants on CPU service...");
      const resp = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.wallet?.address}`
        },
        body: JSON.stringify({
          datasetId,
          sourceCid: cid,
          sourceUrl: url,
          filename: file.name,
          recipe,
          count,
          seed
        })
      });
      if (!resp.ok) throw new Error(await resp.text());
      const { jobId, outputsBase64 } = await resp.json();

      // show previews immediately
      setPreviews(outputsBase64);

      // 3) upload variants to Lighthouse
      const variants = await uploadVariantsToLighthouse(outputsBase64, `miles_${jobId}`);

      // 4) mark job complete
      await fetch("/api/jobs/complete", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.wallet?.address}`
        },
        body: JSON.stringify({ jobId, variants })
      });

      // 5) reward user with DataCoin tokens
      setStatus("Rewarding DataCoin tokens...");
      try {
        const rewardResponse = await fetch("/api/rewards/mint", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user?.wallet?.address}`
          },
          body: JSON.stringify({ amount: 1 }) // 1 token per image
        });
        
        if (rewardResponse.ok) {
          const rewardData = await rewardResponse.json();
          setStatus(`Done! You earned 1 DataCoin token! Tx: ${rewardData.txHash?.slice(0, 10)}...`);
          // Refresh balance in dashboard
          if (onRewardSuccess) {
            onRewardSuccess();
          }
        } else {
          setStatus("Done! (Token reward failed, but image processing completed)");
        }
      } catch (rewardError) {
        console.error("Token reward error:", rewardError);
        setStatus("Done! (Token reward failed, but image processing completed)");
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message || String(err)}`);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="border rounded p-4">
      <div className="flex flex-wrap gap-3 mb-3">
    <select value={recipe} onChange={e=>setRecipe(e.target.value)} className="border px-2 py-1">
      <option value="weather_basic">Weather Basic</option>
      <option value="rain_heavy">Rain Heavy</option>
      <option value="fog_heavy">Fog Heavy</option>
      <option value="night_glare">Night Glare</option>
    </select>
    <input type="number" min={1} max={12} value={count} onChange={e=>setCount(parseInt(e.target.value || "10"))} className="w-20 border px-2 py-1" />
    <input type="number" placeholder="seed (optional)" value={seed ?? ""} onChange={e=>setSeed(e.target.value ? parseInt(e.target.value) : undefined)} className="w-36 border px-2 py-1" />
  </div>
      <input ref={fileRef} onChange={onFile} type="file" accept="image/*" />
      <div className="text-sm mt-2">{status}</div>
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
          {previews.map((b64, i) => (
            <img key={i} src={b64} className="w-full h-auto border" />
          ))}
        </div>
      )}
    </div>
  );
}

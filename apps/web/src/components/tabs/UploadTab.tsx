"use client";

import { useState, useEffect } from "react";
import Uploader from "@/components/Uploader";
import AuthGuard from "@/components/AuthGuard";
import { usePrivy } from "@privy-io/react-auth";

export default function UploadTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const { user } = usePrivy();

  async function refreshJobs() {
    if (!user?.wallet?.address) return;
    
    const r = await fetch("/api/jobs/list", {
      headers: {
        'Authorization': `Bearer ${user.wallet.address}`
      }
    });
    setJobs(await r.json());
  }

  async function refreshBalance() {
    if (!user?.wallet?.address) return;
    
    try {
      const r = await fetch("/api/rewards/balance", {
        headers: {
          'Authorization': `Bearer ${user.wallet.address}`
        }
      });
      const data = await r.json();
      if (data.success) {
        setTokenBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    }
  }

  useEffect(() => { 
    refreshJobs();
    refreshBalance();
  }, [user?.wallet?.address]);

  const handleRewardSuccess = () => {
    refreshBalance();
    refreshJobs();
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header with Balance */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-white">Upload & Process</h1>
            <p className="text-zinc-400 mt-2">Upload images and generate augmented variants</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-lg px-6 py-4">
            <div className="text-sm text-zinc-400">DataCoin Balance</div>
            <div className="text-2xl font-semibold text-white">{tokenBalance} MIL</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Upload New Image</h2>
          <Uploader datasetId={`user-${user?.wallet?.address?.slice(-8)}`} onRewardSuccess={handleRewardSuccess} />
        </div>

        {/* Processing Logs */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Processing Logs</h2>
            <button 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
              onClick={() => { refreshJobs(); refreshBalance(); }}
            >
              Refresh
            </button>
          </div>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-zinc-400 mb-2">No processing jobs yet</div>
              <div className="text-sm text-zinc-500">Upload an image to see processing logs here</div>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-zinc-900 border border-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-400"></div>
                      <span className="font-mono text-sm text-white">#{job.id.slice(0,8)}</span>
                      <span className="px-2 py-1 bg-green-400/20 text-green-400 rounded text-xs font-medium">
                        {job.status}
                      </span>
                      {Array.isArray(job.outputs) && job.outputs.length > 0 && (
                        <span className="px-2 py-1 bg-blue-400/20 text-blue-400 rounded text-xs font-medium">
                          {job.outputs.length} variants generated
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Datasets */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">My Datasets</h2>
          
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-zinc-400 mb-2">No datasets created yet</div>
              <div className="text-sm text-zinc-500">Your processed images will appear here as datasets</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map(job => (
                <div key={job.id} className="bg-zinc-900 border border-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">Dataset #{job.id.slice(0,8)}</h3>
                    <span className="text-xs text-zinc-500">
                      {Array.isArray(job.outputs) ? job.outputs.length : 0} variants
                    </span>
                  </div>
                  
                  {Array.isArray(job.outputs) && job.outputs.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {job.outputs.slice(0, 4).map((output: any, index: number) => (
                        <img 
                          key={output.cid} 
                          src={output.url} 
                          alt={`Sample ${index + 1}`}
                          className="w-full h-16 object-cover rounded border border-white/10"
                        />
                      ))}
                      {job.outputs.length > 4 && (
                        <div className="w-full h-16 bg-zinc-800 border border-white/10 rounded flex items-center justify-center">
                          <span className="text-xs text-zinc-400">+{job.outputs.length - 4} more</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-3 text-xs text-zinc-500">
                    Created {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { usePrivy } from "@privy-io/react-auth";

interface Dataset {
  id: string;
  userId: string;
  name: string;
  description?: string;
  region?: string;
  createdAt: string;
  outputs: Array<{
    cid: string;
    url: string;
  }>;
  status: string;
}

export default function DatasetsTab() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const { user } = usePrivy();

  const loadDatasets = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/datasets/all');
      if (response.ok) {
        const data = await response.json();
        setDatasets(data);
      } else {
        console.error('Failed to fetch datasets');
        setDatasets([]);
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadDatasets();
  }, []);

  const DatasetStack = ({ dataset }: { dataset: Dataset }) => {
    const topImage = dataset.outputs[0];
    const stackCount = dataset.outputs.length;
    
    return (
      <div 
        className="relative cursor-pointer group"
        onClick={() => setSelectedDataset(dataset)}
      >
        {/* Stack Effect */}
        <div className="relative">
          {/* Background images for stack effect */}
          {dataset.outputs.slice(1, 4).map((output, index) => (
            <div
              key={output.cid}
              className="absolute inset-0 rounded-xl border border-white/10"
              style={{
                transform: `translate(${(index + 1) * 2}px, ${(index + 1) * 2}px)`,
                zIndex: 1 + index, // Use low z-index values (1, 2, 3)
              }}
            >
              <img
                src={output.url}
                alt={`Stack layer ${index + 2}`}
                className="w-full h-48 object-cover rounded-xl opacity-60"
              />
            </div>
          ))}
          
          {/* Top image */}
          <div className="relative z-20 rounded-xl border border-white/10 overflow-hidden">
            <img
              src={topImage.url}
              alt="Dataset preview"
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-center">
                <div className="text-white font-semibold mb-1">View Dataset</div>
                <div className="text-sm text-zinc-300">{stackCount} images</div>
              </div>
            </div>
            
            {/* Stack indicator */}
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
              <span className="text-xs text-white font-medium">{stackCount}</span>
            </div>
          </div>
        </div>
        
        {/* Dataset info */}
        <div className="mt-3">
          <div className="text-sm font-medium text-white">{dataset.name}</div>
          <div className="text-xs text-zinc-400">
            by {dataset.userId.slice(0, 6)}...{dataset.userId.slice(-4)} • {dataset.outputs.length} variants
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {new Date(dataset.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-white">Community Datasets</h1>
          <p className="text-zinc-400 mt-2">Explore datasets created by all users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
            <div className="text-sm text-zinc-400 mb-2">Total Datasets</div>
            <div className="text-2xl font-semibold text-white">{datasets.length}</div>
          </div>
          
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
            <div className="text-sm text-zinc-400 mb-2">Total Images</div>
            <div className="text-2xl font-semibold text-white">
              {datasets.reduce((sum, dataset) => sum + dataset.outputs.length, 0)}
            </div>
          </div>
          
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
            <div className="text-sm text-zinc-400 mb-2">Contributors</div>
            <div className="text-2xl font-semibold text-white">
              {new Set(datasets.map(d => d.userId)).size}
            </div>
          </div>
        </div>

        {/* Datasets Grid */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">All Datasets</h2>
            <button 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
              onClick={loadDatasets}
            >
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="text-zinc-400">Loading datasets...</div>
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-zinc-400 mb-2">No datasets available</div>
              <div className="text-sm text-zinc-500">Datasets will appear here as users upload images</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {datasets.map((dataset) => (
                <DatasetStack key={dataset.id} dataset={dataset} />
              ))}
            </div>
          )}
        </div>

        {/* Dataset Detail Modal */}
        {selectedDataset && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-zinc-950 border border-white/10 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{selectedDataset.name}</h3>
                    <p className="text-sm text-zinc-400">
                      by {selectedDataset.userId.slice(0, 6)}...{selectedDataset.userId.slice(-4)} • {selectedDataset.outputs.length} variants
                    </p>
                    <p className="text-sm text-zinc-500 mt-1">
                      Created {new Date(selectedDataset.createdAt).toLocaleDateString()}
                    </p>
                    {selectedDataset.description && (
                      <p className="text-sm text-zinc-400 mt-2">{selectedDataset.description}</p>
                    )}
                    {selectedDataset.region && (
                      <p className="text-xs text-zinc-500 mt-1">Region: {selectedDataset.region}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedDataset(null)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <span className="text-zinc-400 text-xl">×</span>
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {selectedDataset.outputs.map((output, index) => (
                    <div key={output.cid} className="relative group">
                      <img
                        src={output.url}
                        alt={`Variant ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-white/10"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-medium">Variant {index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

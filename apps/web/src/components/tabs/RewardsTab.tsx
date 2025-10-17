"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import { usePrivy } from "@privy-io/react-auth";

export default function RewardsTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [loading, setLoading] = useState(true);
  const { user } = usePrivy();

  async function refreshTransactions() {
    if (!user?.wallet?.address) return;
    
    try {
      const r = await fetch("/api/transactions/list", {
        headers: {
          'Authorization': `Bearer ${user.wallet.address}`
        }
      });
      const data = await r.json();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
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
    const loadData = async () => {
      setLoading(true);
      await Promise.all([refreshTransactions(), refreshBalance()]);
      setLoading(false);
    };
    loadData();
  }, [user?.wallet?.address]);

  // Use the current balance as total earned since it represents all tokens earned
  const totalEarned = parseFloat(tokenBalance) || 0;

  return (
    <AuthGuard>
      <div className="space-y-8">
        {/* Header with Balance */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-semibold text-white">Rewards & Transactions</h1>
            <p className="text-zinc-400 mt-2">Track your DataCoin earnings and transaction history</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 rounded-lg px-6 py-4">
            <div className="text-sm text-zinc-400">Current Balance</div>
            <div className="text-2xl font-semibold text-white">{tokenBalance} MIL</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
            <div className="text-sm text-zinc-400 mb-2">Total Earned</div>
            <div className="text-2xl font-semibold text-white">{totalEarned} MIL</div>
          </div>
          
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
            <div className="text-sm text-zinc-400 mb-2">Transactions</div>
            <div className="text-2xl font-semibold text-white">{transactions.length}</div>
          </div>
          
          <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
            <div className="text-sm text-zinc-400 mb-2">Avg per Upload</div>
            <div className="text-2xl font-semibold text-white">
              {transactions.length > 0 ? (totalEarned / transactions.length).toFixed(1) : 0} MIL
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Transaction History</h2>
            <button 
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"
              onClick={() => { refreshTransactions(); refreshBalance(); }}
            >
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="text-zinc-400">Loading transactions...</div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-zinc-400 mb-2">No transactions yet</div>
              <div className="text-sm text-zinc-500">Upload images to earn DataCoin tokens!</div>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="bg-zinc-900 border border-white/5 rounded-lg p-4 hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{tx.description}</div>
                      <div className="text-sm text-zinc-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-green-400 text-lg">+{tx.amount} MIL</div>
                      <div className="text-xs text-zinc-500 font-mono">
                        {tx.txHash.slice(0, 10)}...{tx.txHash.slice(-8)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How to Earn */}
        <div className="bg-zinc-950 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">How to Earn DataCoin Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-white">Upload Images</h3>
                  <p className="text-sm text-zinc-400">Upload high-quality images to the platform</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-white">Generate Variants</h3>
                  <p className="text-sm text-zinc-400">Use AI augmentation to create synthetic variants</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-white">Earn Tokens</h3>
                  <p className="text-sm text-zinc-400">Receive DataCoin tokens for each successful upload</p>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-900 border border-white/5 rounded-lg p-4">
              <h3 className="font-medium text-white mb-2">Current Rewards</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Per Image Upload:</span>
                  <span className="text-green-400 font-medium">1 MIL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Per Variant Generated:</span>
                  <span className="text-green-400 font-medium">0.1 MIL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Quality Bonus:</span>
                  <span className="text-green-400 font-medium">Up to 2x</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

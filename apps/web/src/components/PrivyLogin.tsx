"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

export default function PrivyLogin() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const router = useRouter();

  const handleLogin = async () => {
    try {
      await login();
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after logout
      router.push('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-3 py-2 rounded border border-white/20 text-zinc-300">
          Loading...
        </div>
      </div>
    );
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-medium">
            {user?.wallet?.address?.slice(0, 2).toUpperCase() || "U"}
          </div>
          <div className="text-sm">
            {user?.wallet?.address?.slice(0, 6)}...{user?.wallet?.address?.slice(-4)}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="px-3 py-2 rounded border border-white/20 text-zinc-300 hover:bg-white/10 text-sm transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleLogin}
        className="px-4 py-2 rounded bg-white text-black hover:bg-zinc-200 font-medium transition-colors"
      >
        Login with Privy
      </button>
    </div>
  );
}

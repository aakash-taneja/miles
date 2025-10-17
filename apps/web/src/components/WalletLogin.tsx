"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useSignMessage } from "wagmi";
import { getCsrfToken, signIn } from "next-auth/react";
import { createSiweMessage } from "viem/siwe";

const TARGET_CHAIN_ID = 84532; // Base Sepolia

export default function WalletLogin() {
  const { address, chainId } = useAccount();
  const { signMessageAsync } = useSignMessage();

  async function onSiwe() {
    if (!address) throw new Error("Connect wallet first.");
    if (chainId && chainId !== TARGET_CHAIN_ID) {
      // not fatal, but you’ll sign with the wrong chainId; better to switch in UI
      console.warn("Wallet not on Base Sepolia; SIWE will still sign, but fix your chain.");
    }

    const nonce = await getCsrfToken();
    const message = createSiweMessage({
      address,
      chainId: TARGET_CHAIN_ID,
      domain: window.location.host,
      uri: window.location.origin,
      version: "1",
      statement: "Sign in to MILES",
      nonce: nonce || ""
    });
    const signature = await signMessageAsync({ message });
    await signIn("credentials", { message: JSON.stringify(message), signature, redirect: false });
  }

  return (
    <div className="flex items-center gap-3">
      <ConnectButton />
      <button onClick={onSiwe} className="px-3 py-2 rounded bg-black text-white hover:bg-gray-800">
        Sign In
      </button>
    </div>
  );
}

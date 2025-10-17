"use client";
import { WagmiProvider, createConfig, http } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import { metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";
import { baseSepolia } from "wagmi/chains";
import { SessionProvider } from "next-auth/react";
import { PrivyProvider } from "@privy-io/react-auth";
import "@rainbow-me/rainbowkit/styles.css";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet],
    },
  ],
  {
    appName: "MILES",
    projectId: "dummy-project-id", // Not used for MetaMask but required by RainbowKit
  }
);

const config = createConfig({
  chains: [baseSepolia],
  connectors,
  transports: {
    [baseSepolia.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "your-privy-app-id"}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#676FFF",
          logo: "/next.svg",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        supportedChains: [baseSepolia],
        defaultChain: baseSepolia,
      }}
    >
      <SessionProvider>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>{children}</RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </SessionProvider>
    </PrivyProvider>
  );
}

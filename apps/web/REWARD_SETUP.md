# DataCoin Token Rewards Setup

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# Blockchain Configuration
CHAIN_NAME=sepolia
DATACOIN_ADDRESS=0x33da15fdcaa8e7ca38ffe2048421d5e193100747
PRIVATE_KEY=your_private_key_here

# RPC URLs (choose one based on your chain)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
BASE_RPC_URL=https://mainnet.base.org
POLYGON_RPC_URL=https://polygon-rpc.com
WORLDCHAIN_RPC_URL=https://worldchain-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

## Setup Instructions

1. **Get your private key**: Export the private key from the wallet that will mint tokens
2. **Set up RPC provider**: Choose your preferred RPC provider (Infura, Alchemy, etc.)
3. **Deploy DataCoin contract**: Make sure your DataCoin contract is deployed and the address is correct
4. **Grant minting permissions**: Ensure the wallet with your private key has minting permissions on the DataCoin contract

## How It Works

- Users upload images through the Uploader component
- After successful image processing, the system automatically mints 1 DataCoin token to the user
- Users can see their token balance in the dashboard
- The reward system is fault-tolerant - if token minting fails, image processing still completes

## API Endpoints

- `POST /api/rewards/mint` - Mints tokens to a user
- `GET /api/rewards/balance` - Gets user's token balance

## Security Notes

- The private key should be kept secure and never exposed to the frontend
- Only the server-side API has access to the private key
- Users are authenticated via Privy before receiving rewards

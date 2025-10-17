# MILES - AI Image Augmentation Platform

MILES is a decentralized AI-powered image augmentation platform that allows users to upload images, generate multiple variants using AI augmentation techniques, and store everything on IPFS via Lighthouse. The platform uses Web3 authentication with wallet-based sign-in and provides a seamless experience for creating diverse image datasets.

## 🏗️ Architecture Overview

The project consists of two main components:

### 1. **Web Application** (`apps/web/`)
- **Frontend**: Next.js 15 with React 19, TypeScript, and Tailwind CSS
- **Backend**: Next.js API routes with Prisma ORM
- **Database**: SQLite with Prisma
- **Authentication**: NextAuth.js with SIWE (Sign-In with Ethereum)
- **Web3 Integration**: Wagmi + RainbowKit for wallet connectivity
- **Storage**: Lighthouse IPFS for decentralized file storage

### 2. **Augmentor Service** (`services/augmentor/`)
- **Framework**: FastAPI (Python)
- **Image Processing**: OpenCV + Albumentations
- **AI Augmentation**: Multiple weather and lighting effect recipes

## 🚀 Features

### Core Functionality
- **Wallet Authentication**: Connect MetaMask and sign in with Ethereum address
- **Image Upload**: Upload images to IPFS via Lighthouse
- **AI Augmentation**: Generate multiple variants using different augmentation recipes
- **Recipe Selection**: Choose from weather_basic, rain_heavy, fog_heavy, night_glare
- **Batch Processing**: Generate 1-12 variants per image
- **Real-time Preview**: See generated variants immediately
- **Job Management**: Track processing status and view completed jobs

### Technical Features
- **Decentralized Storage**: All images stored on IPFS via Lighthouse
- **Web3 Authentication**: SIWE-based authentication with wallet signatures
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live status updates during processing
- **Error Handling**: Comprehensive error handling and user feedback

## 📁 Project Structure

```
miles/
├── apps/
│   └── web/                          # Next.js Web Application
│       ├── src/
│       │   ├── app/                  # App Router (Next.js 13+)
│       │   │   ├── dashboard/       # Main dashboard page
│       │   │   ├── layout.tsx       # Root layout with providers
│       │   │   ├── page.tsx         # Landing page
│       │   │   └── provider.tsx      # Web3 & Auth providers
│       │   ├── components/           # React Components
│       │   │   ├── Uploader.tsx     # File upload & processing
│       │   │   └── WalletLogin.tsx  # Wallet connection & SIWE
│       │   └── pages/
│       │       └── api/             # API Routes
│       │           ├── auth/       # NextAuth configuration
│       │           └── jobs/       # Job management endpoints
│       ├── prisma/                  # Database schema & migrations
│       └── package.json
└── services/
    └── augmentor/                   # Python FastAPI Service
        └── main.py                  # Image augmentation service
```

## 🗄️ Database Schema

The application uses a relational database with the following entities:

- **User**: Web3 wallet addresses and user metadata
- **Dataset**: Collections of images owned by users
- **Image**: Individual images with IPFS metadata
- **Job**: Augmentation jobs with status tracking

```prisma
model User {
  id        String   @id @default(cuid())
  address   String   @unique
  createdAt DateTime @default(now())
  datasets  Dataset[]
}

model Dataset {
  id          String   @id @default(cuid())
  ownerId     String
  name        String
  description String?
  region      String?
  createdAt   DateTime @default(now())
  owner       User     @relation(fields: [ownerId], references: [id])
  images      Image[]
}

model Image {
  id        String   @id @default(cuid())
  datasetId String
  key       String   # IPFS CID
  width     Int?
  height    Int?
  meta      Json?    # Additional metadata
  createdAt DateTime @default(now())
  dataset   Dataset  @relation(fields: [datasetId], references: [id])
  jobs      Job[]
}

model Job {
  id        String   @id @default(cuid())
  imageId   String
  recipe    String   # Augmentation recipe name
  status    String   @default("queued")
  outputs   Json?    # Generated variant metadata
  createdAt DateTime @default(now())
  image     Image    @relation(fields: [imageId], references: [id])
}
```

## 🔧 Setup & Installation

### Prerequisites
- Node.js 18+ and pnpm
- Python 3.11+ with pip
- MetaMask wallet with Base Sepolia testnet

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd miles

# Install web app dependencies
cd apps/web
pnpm install

# Install augmentor service dependencies
cd ../../services/augmentor
pip install fastapi uvicorn opencv-python albumentations numpy requests
```

### 2. Environment Configuration

Create `.env` file in `apps/web/`:

```env
# Lighthouse IPFS Configuration
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_api_key
NEXT_PUBLIC_LIGHTHOUSE_GATEWAY=https://gateway.lighthouse.storage/ipfs

# Augmentor Service
AUGMENTOR_URL=http://localhost:8001

# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-change-this-in-production
NEXTAUTH_URL=http://localhost:3000
```

### 3. Database Setup

```bash
cd apps/web
npx prisma generate
npx prisma db push
```

### 4. Start Services

**Terminal 1 - Augmentor Service:**
```bash
cd services/augmentor
uvicorn main:app --reload --port 8001
```

**Terminal 2 - Web Application:**
```bash
cd apps/web
pnpm dev
```

## 🔄 How It Works

### 1. **Authentication Flow**
1. User connects MetaMask wallet via RainbowKit
2. User clicks "Sign In" to initiate SIWE (Sign-In with Ethereum)
3. Wallet prompts for signature of structured message
4. NextAuth verifies signature and creates JWT session
5. User is authenticated and can access protected features

### 2. **Image Upload & Processing Flow**
1. **Upload Original**: User selects image file
2. **IPFS Storage**: Image uploaded to Lighthouse IPFS
3. **Job Creation**: API creates database record and calls augmentor
4. **AI Processing**: Augmentor service fetches image and applies augmentation recipes
5. **Variant Generation**: Multiple variants created with different parameters
6. **IPFS Upload**: Generated variants uploaded to IPFS
7. **Completion**: Job marked as complete with variant metadata

### 3. **Augmentation Recipes**

The augmentor service supports multiple augmentation recipes:

- **weather_basic**: Dynamic weather effects with varying intensity
- **rain_heavy**: Heavy rain simulation with motion blur
- **fog_heavy**: Dense fog effects with reduced visibility
- **night_glare**: Night scene with artificial lighting glare

Each recipe uses Albumentations library with OpenCV for realistic image transformations.

## 🛠️ API Endpoints

### Authentication
- `GET /api/auth/[...nextauth]` - NextAuth configuration

### Jobs
- `POST /api/jobs/create` - Create new augmentation job
- `POST /api/jobs/complete` - Mark job as complete
- `GET /api/jobs/list` - List recent jobs

### Augmentor Service
- `POST /augment` - Process image augmentation
- `GET /health` - Service health check

## 🔐 Security Features

- **SIWE Authentication**: Cryptographic signature verification
- **JWT Sessions**: Secure session management
- **CORS Protection**: Proper CORS configuration
- **Input Validation**: Request validation with TypeScript
- **Error Handling**: Comprehensive error boundaries

## 🌐 Web3 Integration

- **Base Sepolia**: Testnet for wallet connectivity
- **MetaMask**: Primary wallet provider
- **SIWE**: Standard for Web3 authentication
- **IPFS**: Decentralized file storage
- **Lighthouse**: IPFS pinning service

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach
- **Real-time Feedback**: Live status updates
- **Preview System**: Immediate variant preview
- **Error States**: Clear error messaging
- **Loading States**: Progress indicators
- **Modern Design**: Clean, professional interface

## 🚀 Deployment

### Web Application
- Built for Vercel deployment
- Environment variables required
- Database migrations handled automatically

### Augmentor Service
- Can be deployed to any Python hosting service
- Requires OpenCV and Albumentations dependencies
- Configured for container deployment

## 🔧 Development

### Adding New Augmentation Recipes

1. Define recipe function in `services/augmentor/main.py`
2. Add to `RECIPE_BUILDERS` dictionary
3. Update frontend dropdown in `Uploader.tsx`

### Database Changes

1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` for development
3. Generate migration for production

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📞 Support

For issues and questions, please open an issue on the repository or contact the development team.

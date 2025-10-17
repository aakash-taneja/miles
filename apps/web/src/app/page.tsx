"use client";

import React, { useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import PrivyLogin from "@/components/PrivyLogin";
import { usePrivy } from "@privy-io/react-auth";

/**
 * MILES – AI Image Augmentation Platform
 * Landing page inspired by the provided screenshot: dark, high‑contrast, wide gutters,
 * large hero, modular sections, and subtle glass effects.
 *
 * Tech: React + Tailwind classes. Replace imageAssets[] urls with your own.
 * The "Login" button calls openPrivy() which you can wire to Privy.
 */

// 1) Central swap-friendly image map. Replace these in one place.
const imageAssets = [
  // HERO
  { key: "hero", url: "/images/hero.png" },
  // FLOW DIAGRAM / GRAPHIC
  { key: "diagram", url: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1600&auto=format&fit=crop" },
  // LIDAR / POINTCLOUD STYLE PLACEHOLDER
  { key: "pointcloud", url: "https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?q=80&w=1600&auto=format&fit=crop" },
  // CITY STREET / DATASET SHOT
  { key: "street", url: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=1600&auto=format&fit=crop" },
  // PHASES THUMBNAILS
  { key: "phase_base", url: "/images/hivemapper.png" },
  { key: "phase_improve", url: "/images/cow.png" },
  { key: "phase_target", url: "/images/av.png" },
  // FOUNDATION MODEL ILLUSTRATION
  { key: "foundation", url: "/images/foundation.png" },
  // LOGOS ROW (use same for all or replace per-item)
  { key: "logo_generic", url: "https://dummyimage.com/120x32/0f0f10/ffffff&text=LOGO" },
];

function useImg(key: string) {
  return useMemo(() => imageAssets.find(i => i.key === key)?.url || imageAssets[0].url, [key]);
}

export default function MilesLanding() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const hero = useImg("hero");
  const diagram = useImg("diagram");
  const point = useImg("pointcloud");
  const street = useImg("street");
  const fnd = useImg("foundation");

  // Auto-redirect to dashboard if already authenticated
  useEffect(() => {
    if (ready && authenticated) {
      router.push('/dashboard');
    }
  }, [ready, authenticated, router]);

  function openPrivy() {
    if (authenticated) {
      router.push('/dashboard');
    } else {
      // @ts-ignore: 'window' on client, Privy injected at runtime
      if (typeof window !== "undefined" && (window as any).privy) {
        (window as any).privy.open();
      }
    }
  }

  return (
    <div className="min-h-screen w-full bg-black text-zinc-100 selection:bg-white/10">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/5 bg-[#0A0A0A]">
        {/* soft vignette like the reference */}
        <div className="pointer-events-none absolute inset-0" />

        <div className="container mx-auto pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6 md:gap-8">
            {/* Left copy block */}
            <div className="md:col-span-6 lg:col-span-5">
              <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-white">
                AI Image Augmentation Engine
              </h1>
              <p className="mt-5 text-lg text-zinc-300 max-w-xl">
                Unlocking autonomy with best‑in‑class synthetic variants stored on IPFS. Upload, augment, and deploy faster.
              </p>
              <div className="mt-8">
                <button
                  onClick={openPrivy}
                  className="px-6 py-3 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-lg transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Right visual with reflection */}
            <div className="relative md:col-span-6 lg:col-span-7 h-[420px] md:h-[520px]">
              {/* car / hero asset */}
              <img
                src={useImg("hero")}
                alt="hero"
                className="absolute right-0 bottom-24 md:bottom-20 w-[560px] md:w-[720px] max-w-none select-none"
              />
              
            </div>
          </div>
        </div>

        {/* logos bar anchored to bottom of hero, evenly spaced */}
        <div className="absolute inset-x-0 bottom-6 md:bottom-10">
          <div className="mx-auto w-full max-w-6xl px-6 flex items-center justify-between opacity-90">
            {[...Array(4)].map((_, i) => (
              <img key={i} src={useImg("logo_generic")} alt="logo" className="h-8 w-auto object-contain" />
            ))}
          </div>
        </div>
      </section>

      {/* DATA ENGINE OVERVIEW */}
      <section id="data-engine" className="border-b border-white/5">
        <div className="container mx-auto max-w-7xl py-16">
          <p className="text-center uppercase tracking-[0.25em] text-[10px] text-zinc-400">THE MILES DATA ENGINE</p>
          <h2 className="mt-3 text-center text-3xl md:text-5xl font-semibold">Everything you need to de‑bias vision models</h2>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="order-2 md:order-1 space-y-8 my-auto" >
              <DataEngineFeature
                title="Data Curation"
                body="Explore both labeled and unlabeled data. Understand dataset distribution, curate data matching target scenarios and send data for annotation."
              />
              <DataEngineFeature
                title="Augmentation Engine"
                body="Industry-leading synthetic data generation with ML-assisted workflows. Achieve high quality augmented data at low cost from advanced augmentation interfaces."
              />
              <DataEngineFeature
                title="Earn Rewards"
                body="Analyze the performance of your machine learning models. Explore model metrics, identify model weaknesses and earn rewards for contributing quality data."
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="rounded-2xl border border-white/10 bg-zinc-950 p-6">
                <div className="space-y-6">
                  <img src="/images/data-engine.png" alt="" />
                </div>
                 
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORE DATASETS */}
      <section className="border-b border-white/5">
        <div className="container mx-auto max-w-7xl py-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-4xl font-semibold">Explore Data-sets</h3>
            <p className="mt-2 text-zinc-400">Discover diverse geographical datasets from around the world</p>
          </div>
          
          <div className="relative overflow-hidden">
            <div className="flex animate-marquee space-x-6">
              {/* First set of cards */}
              <DatasetCard country="Singapore" mapStyle="singapore" />
              <DatasetCard country="Los Angeles" mapStyle="los-angeles" />
              <DatasetCard country="Paris" mapStyle="paris" />
              <DatasetCard country="Tokyo" mapStyle="tokyo" />
              <DatasetCard country="London" mapStyle="london" />
              <DatasetCard country="New York" mapStyle="new-york" />
              <DatasetCard country="Berlin" mapStyle="berlin" />
              <DatasetCard country="Sydney" mapStyle="sydney" />
              {/* Duplicate set for seamless loop */}
              <DatasetCard country="Singapore" mapStyle="singapore" />
              <DatasetCard country="Los Angeles" mapStyle="los-angeles" />
              <DatasetCard country="Paris" mapStyle="paris" />
              <DatasetCard country="Tokyo" mapStyle="tokyo" />
              <DatasetCard country="London" mapStyle="london" />
              <DatasetCard country="New York" mapStyle="new-york" />
              <DatasetCard country="Berlin" mapStyle="berlin" />
              <DatasetCard country="Sydney" mapStyle="sydney" />
            </div>
          </div>
        </div>
      </section>

      {/* HOW TO BUILD AUTONOMY
      <section className="border-b border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <h3 className="text-2xl md:text-4xl font-semibold">How to Build Robust Perception</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Thumb caption="Point‑cloud overlay for depth cues" src={point} />
            <Thumb caption="Urban traffic scenes under night glare" src={street} />
          </div>
        </div>
      </section> */}

      {/* PHASES */}
      <section className="border-b border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <h3 className="text-center text-2xl md:text-4xl font-semibold">Phases of Model Development</h3>
          <p className="text-center mt-2 text-zinc-400">Progress your model with a hybrid real + synthetic pipeline.</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Phase
              src={useImg("phase_base")}
              title="Base Phase"
              body="Start with real‑world imagery from Hivemapper. Establish baseline metrics for lane, depth, slot detection."
              number={1}
            />
            <Phase
              src={useImg("phase_improve")}
              title="Improvement Phase"
              body="Augment with heavy weather, occlusion, low‑light, and India‑specific edge cases like livestock on roads."
              number={2}
            />
            <Phase
              src={useImg("phase_target")}
              title="Target Phase"
              body="Train on balanced, diverse sets scored by embeddings. Close gaps on rare long‑tail failure modes."
              number={3}
            />
          </div>
        </div>
      </section>

      {/* TRUSTED BY BENEFITS */}
      <section className="border-b border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <p className="text-center uppercase tracking-[0.25em] text-[10px] text-zinc-400">WHY MILES</p>
          <h3 className="text-center text-2xl md:text-4xl font-semibold mt-3">Trusted by Leading <br/> Automotive Companies</h3>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Reason title="Fewer Safety Regressions" body="Stress tests target rare conditions before they hit the road. Cut incident rates with synthetic audits." />
            <Reason title="Maximum Performance" body="Diversity‑aware sampling boosts generalization across weather, lighting, and geos." />
            <Reason title="Faster Development" body="On‑demand edge‑case generation eliminates costly data trips and labeling lead times." />
          </div>
        </div>
      </section>

     

      {/* FOUNDATION MODEL */}
      <section className="border-b border-white/5">
        <div className="container mx-auto max-w-6xl px-4 py-16">
          <h3 className="text-2xl md:text-4xl font-semibold">The MILES Foundation Model</h3>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
              <img src={fnd} alt="foundation" className="w-full h-[320px] object-cover" />
            </div>
            <div>
              <p className="text-zinc-300">A single, scene‑conditioned perception backbone tuned on hybrid datasets. Compatible with ControlNet, Stable Diffusion 3, and video priors. Datasets are minted as <span className="text-white">DataCoin</span> NFTs. Royalties are split among contributors. The agent stakes earnings to generate more edge‑cases.</p>
              <ul className="mt-4 space-y-2 text-zinc-300 list-disc list-inside">
                <li>Wallet login with SIWE. Mint ENS for the agent identity.</li>
                <li>Store artifacts on IPFS via Lighthouse.</li>
                <li>Score diversity with CLIP/DINO embeddings.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="">
        <div className="container mx-auto max-w-6xl px-4 py-20 text-center">
          <h3 className="text-3xl md:text-5xl font-semibold">Get augmented data today</h3>
          <p className="mt-3 text-zinc-400">Set limits, pick recipes, batch 1–12 variants, preview live, and ship.</p>
          <div className="mt-8 flex justify-center gap-3">
          <button
                  onClick={openPrivy}
                  className="px-6 py-3 rounded-lg bg-white text-black hover:bg-zinc-200 font-medium text-lg transition-colors"
                >
                  Get Started
                </button>
            <a href="#" className="px-5 py-2.5 rounded-lg border border-white/15 text-zinc-200 hover:bg-white/5">Book a demo</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}


function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-5 bg-gradient-to-b from-white/[0.02] to-transparent">
      <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-xs">★</div>
      <h4 className="mt-4 text-lg font-medium">{title}</h4>
      <p className="mt-2 text-sm text-zinc-400">{body}</p>
    </div>
  );
}

function DataEngineFeature({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
        <div className="h-2 w-2 rounded-full bg-white/60"></div>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-white">{title}</h4>
        <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

function Thumb({ caption, src }: { caption: string; src: string }) {
  return (
    <figure className="rounded-2xl overflow-hidden border border-white/10 bg-zinc-900">
      <img src={src} alt={caption} className="w-full h-[300px] object-cover" />
      <figcaption className="px-4 py-3 text-xs text-zinc-400">{caption}</figcaption>
    </figure>
  );
}

function Phase({ title, body, src, number }: { title: string; body: string; src: string; number: number }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
      <div className="aspect-video w-full bg-zinc-900 relative">
        <img src={src} alt={title} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 h-8 w-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-semibold">
          {number}
        </div>
      </div>
      <div className="p-4">
        <h5 className="text-base font-medium">{title}</h5>
        <p className="mt-1 text-sm text-zinc-400">{body}</p>
      </div>
    </div>
  );
}

function Reason({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-5 bg-zinc-950">
      <h5 className="mt-3 text-base font-medium">{title}</h5>
      <p className="mt-1 text-sm text-zinc-400">{body}</p>
    </div>
  );
}

function SmallCard({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="rounded-2xl border border-white/10 p-5 bg-zinc-950">
      <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{tag}</p>
      <h6 className="mt-2 font-medium">{title}</h6>
      <button className="mt-4 text-sm text-white/90 hover:text-white">Read more →</button>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5">
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-sm">
          
          
        </div>
        <div className="mt-10 flex items-center justify-between text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} Miles. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
          </div>
        </div>
      </div>
      </footer>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="font-medium">{title}</div>
      <ul className="mt-2 space-y-1 text-zinc-400">
        {items.map((it) => (
          <li key={it}><a href="#" className="hover:text-white">{it}</a></li>
        ))}
      </ul>
    </div>
  );
}

function DatasetCard({ country, mapStyle }: { country: string; mapStyle: string }) {
  const getMapImage = (style: string) => {
    // Using placeholder images that look like maps
    const mapImages = {
      'singapore': '/images/singapore.png',
      'los-angeles': '/images/los-angeles.png',
      'paris': '/images/paris.png',
      'tokyo': '/images/tokyo.png',
      'london': '/images/london.png',
      'new-york': '/images/new-york.png',
    };
    return mapImages[style as keyof typeof mapImages] || mapImages.singapore;
  };

  return (
    <div className="group relative flex-shrink-0 w-80 h-48 rounded-xl border border-white/10 bg-zinc-950 overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 to-black/40 z-10" />
      <img 
        src={getMapImage(mapStyle)} 
        alt={`${country} map`}
        className="w-full h-full object-cover"
      />
      
      {/* Hover overlay with country name */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
        <div className="text-center">
          <h4 className="text-2xl font-semibold text-white mb-2">{country}</h4>
          <button className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors">
            Explore <span aria-hidden>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import PrivyLogin from "./PrivyLogin";

export default function Header() {

  return (
    <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-black/50 bg-black/70 border-b border-white/5 pt-4" >
      <div className="container max-w-7xl py-3 mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-semibold tracking-tight text-lg">Miles</Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-300">
              <a className="hover:text-white" href="#data-engine">Product</a>
              <a className="hover:text-white" href="#">Use cases</a>
              <a className="hover:text-white" href="#learn">Resources</a>
              <a className="hover:text-white" href="#">Pricing</a>
              <a className="hover:text-white" href="#">Docs</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <PrivyLogin />
          </div>
        </div>
      </div>
    </header>
  );
}

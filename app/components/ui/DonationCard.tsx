"use client";
import React from 'react';
import { Icon } from "@iconify/react";

export default function DonationCard() {
  return (
    <a 
      href="/donate" 
      target="_blank" 
      rel="noopener noreferrer"
      className="relative group flex items-center justify-between w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0E0E12] p-8 transition-all hover:border-white/20 hover:bg-white/4 active:scale-[0.99]"
    >
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/15 blur-[80px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
      
      <div className="relative z-10 flex items-center gap-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white border border-white/10 group-hover:bg-white/10 transition-colors shrink-0">
          <Icon icon="carbon:cafe" width="28" height="28" />
        </div>
        
        <div className="flex flex-col">
          <h4 className="text-xl font-medium text-white tracking-tight">
            Cómprame un café
          </h4>
          <p className="text-sm text-neutral-500 group-hover:text-neutral-400 transition-colors">
            Apoya al proyecto openvid
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-4 text-neutral-600 group-hover:text-white transition-all">
        <Icon 
          icon="carbon:arrow-right" 
          width="24" 
          height="24" 
          className="transform group-hover:translate-x-1 transition-transform" 
        />
      </div>
    </a>
  );
}

"use client";

import { useState } from "react";
import UploadTab from "./tabs/UploadTab";
import RewardsTab from "./tabs/RewardsTab";
import DatasetsTab from "./tabs/DatasetsTab";

export default function TabLayout() {
  const [activeTab, setActiveTab] = useState("upload");

  const tabs = [
    { id: "upload", label: "Upload" },
    { id: "rewards", label: "Rewards" },
    { id: "datasets", label: "Datasets" },
  ];

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Tab Navigation */}
      <div className="border-b border-white/10 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-white text-white"
                    : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                }`}
              >
                <span className="font-medium">
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "upload" && <UploadTab />}
        {activeTab === "rewards" && <RewardsTab />}
        {activeTab === "datasets" && <DatasetsTab />}
      </div>
    </div>
  );
}

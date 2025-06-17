"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export function CustomAvatarFlow(props: { onConnectButtonClicked: () => void, ControlBar: React.ComponentType<{ onConnectButtonClicked: () => void }> }) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    // Here you would handle the avatar generation
    console.log("Generating avatar with prompt:", prompt);
    props.onConnectButtonClicked();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
      className="flex flex-col items-center gap-8 h-full"
    >
      <div className="w-96 h-96 bg-white/10 rounded-lg">
        {/* Image will be displayed here */}
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your avatar..."
          className="w-full h-32 p-4 rounded-lg bg-white/10 text-white resize-none"
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt}
          className="uppercase px-6 py-3 bg-white text-black rounded-md disabled:opacity-50"
        >
          Generate & Connect
        </button>
      </div>
    </motion.div>
  );
}

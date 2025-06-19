"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomAvatarFlow(props: { onConnectButtonClicked: () => void, ControlBar: React.ComponentType<{ onConnectButtonClicked: () => void }> }) {
  const [prompt, setPrompt] = useState("");
  const [assetId, setAssetId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!assetId) return;

      try {
        const statusResponse = await getImageGenerationStatus(assetId);
        if (statusResponse.state === 'complete') {
          const imageUrl = await getImageFromS3(assetId);
          setImageUrl(imageUrl);
          setIsGenerating(false);
          props.onConnectButtonClicked();
          clearInterval(pollInterval);
        } else if (statusResponse.state === 'error') {
          console.error('Image generation failed:', statusResponse.errorMessage);
          setIsGenerating(false);
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(pollInterval);
        setIsGenerating(false);
      }
    };

    if (assetId) {
      pollInterval = setInterval(pollStatus, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [assetId, props]);

  const handleSubmit = async () => {
    try {
      setIsGenerating(true);
      const assetId = await sendImageGenerationRequest(prompt);
      setAssetId(assetId);
    } catch (error) {
      console.error('Error generating image:', error);
      setIsGenerating(false);
    }
  };

  const sendImageGenerationRequest = async (prompt: string) => {
    const response = await fetch('https://api.staging.hedra.com/web-app/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'image',
        text_prompt: prompt,
        aspect_ratio: '1:1',
        resolution: '1024x1024',
        ai_model_id: 'f8f8ef36-9665-4e48-b54e-802196771293' // Flux Dev
      })
    });

    if (!response.ok) {
      throw new Error(`Image generation request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.asset_id;
  };

  const getImageGenerationStatus = async (jobId: string) => {
    const response = await fetch(`https://api.staging.hedra.com/web-app/public/generations/${jobId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get generation status: ${response.status}`);
    }

    const data = await response.json();
    return {
      state: data.status,
      url: data.url,
      errorMessage: data.error_message
    };
  };

  const getImageFromS3 = async (imageKey: string) => {
    // TODO: Implement fetching generated image from S3
    // Should return image URL or blob
    throw new Error("Not implemented");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
      className="flex flex-col items-center gap-8 h-full"
    >
      <div className="w-96 h-96 bg-white/10 rounded-lg">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="Generated avatar"
            className="w-full h-full object-cover rounded-lg"
          />
        )}
      </div>

      <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your avatar..."
          className="w-full h-32 p-4 rounded-lg bg-white/10 text-white resize-none"
          disabled={isGenerating}
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt || isGenerating}
          className="uppercase px-6 py-3 bg-white text-black rounded-md disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Generate & Connect'}
        </button>
      </div>
    </motion.div>
  );
}

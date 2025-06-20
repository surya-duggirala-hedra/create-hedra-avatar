"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomAvatarFlow(props: { onConnectButtonClicked: () => void, ControlBar: React.ComponentType<{ onConnectButtonClicked: () => void }> }) {
  const [prompt, setPrompt] = useState("");
  const [assetId, setAssetId] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!generationId) return;
  
    let isCancelled = false;
    setIsGenerating(true);
  
    const poll = async () => {
      try {
        const status = await getImageGenerationStatus(generationId);
        if (isCancelled) return;
  
        if (status.state === 'complete') {
          setImageUrl(status.url);
          setIsGenerating(false);
          props.onConnectButtonClicked();
        } else if (status.state === 'error') {
          console.error('Image generation failed:', status.errorMessage);
          setIsGenerating(false);
        } else {
          setTimeout(poll, 2000); // Re-poll in 2 sec
        }
      } catch (err) {
        console.error('Polling failed:', err);
        setIsGenerating(false);
      }
    };
  
    poll(); // Start polling
  
    return () => {
      isCancelled = true;
    };
  }, [generationId]);
  

  const handleSubmit = async () => {
    try {
      setIsGenerating(true);
      const { assetId, generationId } = await sendImageGenerationRequest(prompt);
      setAssetId(assetId);
      setGenerationId(generationId);
    } catch (error) {
      console.error('Error generating image:', error);
      setIsGenerating(false);
    }
  };

  const sendImageGenerationRequest = async (prompt: string) => {
    const response = await fetch('https://api.staging.hedra.com/web-app/public/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEXT_PUBLIC_HEDRA_API_KEY
      },
      body: JSON.stringify({
        type: 'image',
        text_prompt: prompt + " This is an image being used for a custom avatar. Make sure it is rendered like a high quality Linkedin profile picture.",
        "aspect_ratio": "1:1",
        "resolution": "540p",
        ai_model_id: 'dd370137-90ee-4246-a312-f30f8944429a' // Flux Dev
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(errorText);
      throw new Error(`Image generation request failed: ${response.status}`);
    }

    const data = await response.json();
    return { assetId: data.asset_id, generationId: data.id };
  };

  const getImageGenerationStatus = async (jobId: string | null) => {
    if (!jobId) {
      throw new Error('Generation ID is required');
    }

    const response = await fetch(`https://api.staging.hedra.com/web-app/public/generations/${jobId}/status`, {
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_HEDRA_API_KEY
      }
    });
    
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

  const getImageFromS3 = async (assetId: string) => {
    const response = await fetch(`https://api.staging.hedra.com/web-app/public/assets?type=image&ids=${assetId}`, {
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_HEDRA_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get image from S3: ${response.status}`);
    }

    const data = await response.json();
    if (!data?.[0]?.asset?.url) {
      throw new Error('No image URL found in response');
    }

    return data[0].asset.url;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
      className="flex flex-col items-center gap-8 h-full"
    >
      <div className="w-96 h-96 bg-white/10 rounded-lg relative">
        {imageUrl && (
          <img 
            src={imageUrl} 
            alt="Generated avatar"
            className="w-full h-full object-cover rounded-lg"
          />
        )}
        {isGenerating && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
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

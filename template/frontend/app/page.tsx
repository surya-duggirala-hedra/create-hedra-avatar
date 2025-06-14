"use client";

import { CloseIcon } from "@components/CloseIcon";
import { NoAgentNotification } from "@components/NoAgentNotification";
import TranscriptionView from "@components/TranscriptionView";
import {
  BarVisualizer,
  DisconnectButton,
  RoomAudioRenderer,
  RoomContext,
  VideoTrack,
  VoiceAssistantControlBar,
  useVoiceAssistant,
} from "@livekit/components-react";
import { AnimatePresence, motion } from "framer-motion";
import { Room, RoomEvent } from "livekit-client";
import { useCallback, useEffect, useState } from "react";
import type { ConnectionDetails } from "./api/connection-details/route";

export default function Page() {
  const [room] = useState(new Room());
  const [selectedFlow, setSelectedFlow] = useState<'quickstart' | 'custom' | null>(null);

  const onConnectButtonClicked = useCallback(async () => {
    // Generate room connection details, including:
    //   - A random Room name
    //   - A random Participant name
    //   - An Access Token to permit the participant to join the room
    //   - The URL of the LiveKit server to connect to
    //
    // In real-world application, you would likely allow the user to specify their
    // own participant name, and possibly to choose from existing rooms to join.

    const url = new URL(
      process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? "/api/connection-details",
      window.location.origin
    );
    const response = await fetch(url.toString());
    const connectionDetailsData: ConnectionDetails = await response.json();

    await room.connect(connectionDetailsData.serverUrl, connectionDetailsData.participantToken);
    await room.localParticipant.setMicrophoneEnabled(true);
  }, [room]);

  useEffect(() => {
    room.on(RoomEvent.MediaDevicesError, onDeviceFailure);

    return () => {
      room.off(RoomEvent.MediaDevicesError, onDeviceFailure);
    };
  }, [room]);

  return (
    <main data-lk-theme="default" className="h-full grid content-center bg-[var(--lk-bg)]">
      <div className="w-full flex justify-center mb-8">
        <img src="assets/hedra_logo.svg" alt="Hedra Logo" className="h-16 w-auto" />
      </div>
      <RoomContext.Provider value={room}>
        <div className="lk-room-container max-w-[1024px] w-[90vw] mx-auto max-h-[90vh]">
          {!selectedFlow ? (
            <div className="grid grid-cols-2 gap-8">
              <div onClick={() => setSelectedFlow('quickstart')} className="cursor-pointer">
                <h2 className="text-xl font-bold mb-4 text-center text-white">Quickstart</h2>
                <SimpleVoiceAssistant onConnectButtonClicked={onConnectButtonClicked} />
              </div>
              <div onClick={() => setSelectedFlow('custom')} className="cursor-pointer">
                <h2 className="text-xl font-bold mb-4 text-center text-white">Custom Avatar</h2>
                <CustomAvatarFlow onConnectButtonClicked={onConnectButtonClicked} />
              </div>
            </div>
          ) : (
            <div className="w-full">
              <div className="flex justify-between items-center mb-8">
                <button 
                  onClick={() => setSelectedFlow(null)}
                  className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20"
                >
                  ← Back to Selection
                </button>
                <h2 className="text-xl font-bold text-center text-white">
                  {selectedFlow === 'quickstart' ? 'Quickstart' : 'Custom Avatar'}
                </h2>
                <div className="w-[100px]"></div> {/* Spacer for centering */}
              </div>
              {selectedFlow === 'quickstart' ? (
                <SimpleVoiceAssistant onConnectButtonClicked={onConnectButtonClicked} />
              ) : (
                <CustomAvatarFlow onConnectButtonClicked={onConnectButtonClicked} />
              )}
            </div>
          )}
        </div>
      </RoomContext.Provider>
    </main>
  );
}

function CustomAvatarSetup(props: { onSubmit: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState("");
  
  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl mx-auto">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your avatar..."
        className="w-full h-32 p-4 rounded-lg bg-white/10 text-white resize-none"
      />
      <div className="flex gap-4">
        <button
          onClick={() => props.onSubmit(prompt)}
          disabled={!prompt}
          className="uppercase px-6 py-3 bg-white text-black rounded-md disabled:opacity-50"
        >
          Generate
        </button>
      </div>
    </div>
  );
}

function CustomAvatarFlow(props: { onConnectButtonClicked: () => void }) {
  const { state: agentState } = useVoiceAssistant();
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [generatedAvatar, setGeneratedAvatar] = useState<string | null>(null);

  const handleGenerate = (prompt: string) => {
    // Here you would handle the avatar generation and get back an image URL
    console.log("Generating avatar with prompt:", prompt);
    // Simulating avatar generation - replace with actual API call
    setGeneratedAvatar("placeholder-url");
  };

  const handleSubmit = () => {
    setIsCustomizing(false);
    props.onConnectButtonClicked();
  };

  if (isCustomizing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
        className="flex flex-col items-center gap-8 h-full"
      >
        {generatedAvatar && (
          <div className="w-96 h-96 bg-white/10 rounded-lg">
            {/* Display generated avatar here */}
          </div>
        )}
        <CustomAvatarSetup onSubmit={handleGenerate} />
        {generatedAvatar && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="uppercase px-6 py-3 bg-white text-black rounded-md"
            onClick={handleSubmit}
          >
            Submit
          </motion.button>
        )}
      </motion.div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {agentState === "disconnected" ? (
        <motion.div
          key="disconnected"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
          className="grid items-center justify-center h-full"
        >
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="uppercase px-4 py-2 bg-white text-black rounded-md"
            onClick={() => setIsCustomizing(true)}
          >
            Customize Avatar
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          key="connected"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
          className="flex flex-col items-center gap-4 h-full"
        >
          <AgentVisualizer />
          <div className="flex-1 w-full">
            <TranscriptionView />
          </div>
          <div className="w-full">
            <ControlBar onConnectButtonClicked={props.onConnectButtonClicked} />
          </div>
          <RoomAudioRenderer />
          <NoAgentNotification state={agentState} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SimpleVoiceAssistant(props: { onConnectButtonClicked: () => void }) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <>
      <AnimatePresence mode="wait">
        {agentState === "disconnected" ? (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="grid items-center justify-center h-full"
          >
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="uppercase px-4 py-2 bg-white text-black rounded-md"
              onClick={() => props.onConnectButtonClicked()}
            >
              Quickstart a conversation
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="connected"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex flex-col items-center gap-4 h-full"
          >
            <AgentVisualizer />
            <div className="flex-1 w-full">
              <TranscriptionView />
            </div>
            <div className="w-full">
              <ControlBar onConnectButtonClicked={props.onConnectButtonClicked} />
            </div>
            <RoomAudioRenderer />
            <NoAgentNotification state={agentState} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function AgentVisualizer() {
  const { state: agentState, videoTrack, audioTrack } = useVoiceAssistant();
  if (videoTrack) {
    return (
      <div className="h-[512px] w-[512px] rounded-lg overflow-hidden">
        <VideoTrack trackRef={videoTrack} />
      </div>
    );
  }
  return (
    <div className="h-[300px] w-full">
      <BarVisualizer
        state={agentState}
        barCount={5}
        trackRef={audioTrack}
        className="agent-visualizer"
        options={{ minHeight: 24 }}
      />
    </div>
  );
}

function ControlBar(props: { onConnectButtonClicked: () => void }) {
  const { state: agentState } = useVoiceAssistant();

  return (
    <div className="relative h-[60px]">
      <AnimatePresence>
        {agentState === "disconnected" && (
          <motion.button
            initial={{ opacity: 0, top: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 1, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="uppercase absolute left-1/2 -translate-x-1/2 px-4 py-2 bg-white text-black rounded-md"
            onClick={() => props.onConnectButtonClicked()}
          >
            Quickstart a conversation
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {agentState !== "disconnected" && agentState !== "connecting" && (
          <motion.div
            initial={{ opacity: 0, top: "10px" }}
            animate={{ opacity: 1, top: 0 }}
            exit={{ opacity: 0, top: "-10px" }}
            transition={{ duration: 0.4, ease: [0.09, 1.04, 0.245, 1.055] }}
            className="flex h-8 absolute left-1/2 -translate-x-1/2  justify-center"
          >
            <VoiceAssistantControlBar controls={{ leave: false }} />
            <DisconnectButton>
              <CloseIcon />
            </DisconnectButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function onDeviceFailure(error: Error) {
  console.error(error);
  alert(
    "Error acquiring camera or microphone permissions. Please make sure you grant the necessary permissions in your browser and reload the tab"
  );
}

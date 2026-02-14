import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useState } from "react";

const VoiceAssistant = () => {
  const [isActive, setIsActive] = useState(false);

  return (
    <motion.button
      className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gradient-hero flex items-center justify-center shadow-lg ${
        isActive ? "voice-pulse" : ""
      }`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setIsActive(!isActive)}
      title="Voice Assistant"
    >
      <Mic className="w-6 h-6 text-primary-foreground" />
    </motion.button>
  );
};

export default VoiceAssistant;

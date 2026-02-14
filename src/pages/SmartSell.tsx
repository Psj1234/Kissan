import { useState } from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, TrendingDown, AlertTriangle, Package, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import VoiceAssistant from "@/components/VoiceAssistant";

type Recommendation = "sell" | "hold" | "wait";

const SmartSell = () => {
  const [selectedCrop, setSelectedCrop] = useState("Wheat");
  const [recommendation] = useState<Recommendation>("sell");

  const recConfig = {
    sell: { label: "SELL NOW", labelHi: "अभी बेचें", color: "text-primary", ring: "border-primary", bg: "bg-primary/10", glow: "shadow-[0_0_40px_hsl(142_72%_36%_/_0.3)]" },
    hold: { label: "HOLD", labelHi: "रुकें", color: "text-accent", ring: "border-accent", bg: "bg-accent/10", glow: "shadow-[0_0_40px_hsl(48_96%_53%_/_0.3)]" },
    wait: { label: "WAIT", labelHi: "प्रतीक्षा करें", color: "text-destructive", ring: "border-destructive", bg: "bg-destructive/10", glow: "shadow-[0_0_40px_hsl(0_84%_60%_/_0.3)]" },
  };

  const rec = recConfig[recommendation];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-24">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kisan-orange to-accent flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Smart Sell AI</h1>
          <p className="text-muted-foreground">AI-powered sell/hold recommendation</p>
        </motion.div>

        {/* Crop selector */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap">
          {["Wheat", "Rice", "Cotton", "Soybean", "Maize"].map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCrop(c)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCrop === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* AI Decision Ring */}
        <motion.div
          className="flex justify-center mb-12"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <div className={`relative w-64 h-64 rounded-full border-4 ${rec.ring} ${rec.bg} ${rec.glow} flex items-center justify-center`}>
            {/* Rotating outer ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-muted-foreground/20" style={{ animation: "spin-slow 20s linear infinite" }} />
            <div className="absolute inset-4 rounded-full border border-muted-foreground/10" />

            <div className="text-center z-10">
              <motion.p
                className={`text-3xl font-heading font-bold ${rec.color}`}
                key={recommendation}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
              >
                {rec.label}
              </motion.p>
              <p className={`text-lg ${rec.color} opacity-70`}>{rec.labelHi}</p>
              <p className="text-xs text-muted-foreground mt-2">AI Confidence: 87%</p>
            </div>
          </div>
        </motion.div>

        {/* Net Loss Prediction */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-heading font-semibold text-foreground mb-4 text-center">Net Loss Prediction</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div
              className="glass-card rounded-2xl p-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Package className="w-8 h-8 text-kisan-orange mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Storage Loss</p>
              <p className="text-2xl font-heading font-bold text-destructive">-₹2,400</p>
              <p className="text-xs text-muted-foreground mt-1">3% per month</p>
            </motion.div>
            <motion.div
              className="glass-card rounded-2xl p-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TrendingDown className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Price Drop Risk</p>
              <p className="text-2xl font-heading font-bold text-destructive">-₹5,100</p>
              <p className="text-xs text-muted-foreground mt-1">Based on forecast</p>
            </motion.div>
            <motion.div
              className="glass-card rounded-2xl p-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Clock className="w-8 h-8 text-kisan-blue mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-1">Best Window</p>
              <p className="text-2xl font-heading font-bold text-primary">3 Days</p>
              <p className="text-xs text-muted-foreground mt-1">Sell within window</p>
            </motion.div>
          </div>
        </div>
      </div>

      <VoiceAssistant />
    </div>
  );
};

export default SmartSell;

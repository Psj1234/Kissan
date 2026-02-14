import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import VoiceAssistant from "@/components/VoiceAssistant";

const cropPrices: Record<string, number> = {
  Wheat: 2450,
  Rice: 3200,
  Cotton: 6800,
  Sugarcane: 350,
  Soybean: 4100,
  Maize: 1950,
  Mustard: 5200,
  Onion: 1800,
};

const cropCosts: Record<string, number> = {
  Wheat: 1800,
  Rice: 2400,
  Cotton: 4500,
  Sugarcane: 250,
  Soybean: 2900,
  Maize: 1400,
  Mustard: 3600,
  Onion: 1200,
};

const ProfitCalculator = () => {
  const [crop, setCrop] = useState("Wheat");
  const [quantity, setQuantity] = useState(10);

  const revenue = useMemo(() => cropPrices[crop] * quantity, [crop, quantity]);
  const cost = useMemo(() => cropCosts[crop] * quantity, [crop, quantity]);
  const profit = revenue - cost;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-24 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Profit Calculator</h1>
            <p className="text-muted-foreground">लाभ कैलकुलेटर</p>
          </div>

          <div className="glass-card rounded-2xl p-8 space-y-6">
            {/* Crop Selector */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Select Crop</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(cropPrices).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCrop(c)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                      crop === c
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Slider */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-foreground">Quantity (quintals)</label>
                <span className="text-sm font-heading font-bold text-primary">{quantity} qt</span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-muted accent-primary cursor-pointer"
                style={{ accentColor: "hsl(142 72% 36%)" }}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1 qt</span>
                <span>100 qt</span>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Market Price</span>
                <span className="text-sm font-medium text-foreground">₹{cropPrices[crop].toLocaleString()}/qt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Revenue</span>
                <span className="text-sm font-medium text-foreground">₹{revenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Est. Cost</span>
                <span className="text-sm font-medium text-foreground">₹{cost.toLocaleString()}</span>
              </div>
            </div>

            {/* Profit Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${crop}-${quantity}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-2xl p-6 text-center ${
                  profit >= 0 ? "bg-primary/10" : "bg-destructive/10"
                }`}
              >
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {profit >= 0 ? "Estimated Profit" : "Estimated Loss"}
                </p>
                <p className={`text-4xl font-heading font-bold ${
                  profit >= 0 ? "text-primary" : "text-destructive"
                }`}>
                  {profit >= 0 ? "+" : ""}₹{Math.abs(profit).toLocaleString()}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <TrendingUp className={`w-4 h-4 ${profit >= 0 ? "text-primary" : "text-destructive"}`} />
                  <span className={`text-sm ${profit >= 0 ? "text-primary" : "text-destructive"}`}>
                    {((profit / cost) * 100).toFixed(1)}% margin
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <VoiceAssistant />
    </div>
  );
};

export default ProfitCalculator;

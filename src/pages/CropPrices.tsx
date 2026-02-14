import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import VoiceAssistant from "@/components/VoiceAssistant";

const crops = [
  { name: "Wheat", nameHi: "गेहूं", price: 2450, change: 3.2, emoji: "🌾", data: [20,22,21,24,23,25,24] },
  { name: "Rice", nameHi: "चावल", price: 3200, change: -1.5, emoji: "🍚", data: [32,33,34,33,31,32,32] },
  { name: "Cotton", nameHi: "कपास", price: 6800, change: 5.1, emoji: "☁️", data: [60,62,63,65,64,66,68] },
  { name: "Sugarcane", nameHi: "गन्ना", price: 350, change: 0, emoji: "🎋", data: [35,35,34,35,35,36,35] },
  { name: "Soybean", nameHi: "सोयाबीन", price: 4100, change: 2.8, emoji: "🫘", data: [38,39,38,40,41,40,41] },
  { name: "Maize", nameHi: "मक्का", price: 1950, change: -0.8, emoji: "🌽", data: [21,20,20,19,20,19,19] },
  { name: "Mustard", nameHi: "सरसों", price: 5200, change: 4.2, emoji: "🌼", data: [48,49,50,51,50,52,52] },
  { name: "Onion", nameHi: "प्याज", price: 1800, change: -3.1, emoji: "🧅", data: [22,21,20,19,20,19,18] },
];

const CropPrices = () => {
  const { t } = useTranslation();
  
  const crops = [
    { name: "wheat", price: 2450, change: 3.2, emoji: "🌾", data: [20,22,21,24,23,25,24] },
    { name: "rice", price: 3200, change: -1.5, emoji: "🍚", data: [32,33,34,33,31,32,32] },
    { name: "cotton", price: 6800, change: 5.1, emoji: "☁️", data: [60,62,63,65,64,66,68] },
    { name: "sugarcane", price: 350, change: 0, emoji: "🎋", data: [35,35,34,35,35,36,35] },
    { name: "soybean", price: 4100, change: 2.8, emoji: "🪸", data: [38,39,38,40,41,40,41] },
    { name: "maize", price: 1950, change: -0.8, emoji: "🌽", data: [21,20,20,19,20,19,19] },
    { name: "mustard", price: 5200, change: 4.2, emoji: "🌼", data: [48,49,50,51,50,52,52] },
    { name: "onion", price: 1800, change: -3.1, emoji: "🧅", data: [22,21,20,19,20,19,18] },
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Ticker */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-primary/5 border-b border-border overflow-hidden">
        <motion.div
          className="flex gap-8 py-2 px-4 whitespace-nowrap"
          animate={{ x: [0, -1000] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {[...crops, ...crops].map((c, i) => (
            <span key={i} className="text-sm font-medium text-foreground">
              {c.emoji} {t(`crops.${c.name}`)}: ₹{c.price}
              <span className={c.change > 0 ? " text-primary" : c.change < 0 ? " text-destructive" : " text-muted-foreground"}>
                {" "}{c.change > 0 ? "+" : ""}{c.change}%
              </span>
            </span>
          ))}
        </motion.div>
      </div>

      <div className="container mx-auto px-4 pt-32 pb-24">
        <motion.h1
          className="text-3xl font-heading font-bold text-foreground mb-2 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {t('prices.title')} 📊
        </motion.h1>
        <p className="text-center text-muted-foreground mb-10">{t('prices.currentPrice')} — {t('prices.lastUpdated')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {crops.map((crop, i) => (
            <motion.div
              key={crop.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="tilt-3d glass-card rounded-2xl p-5 cursor-pointer border border-border hover:border-primary/30 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-2xl mr-2">{crop.emoji}</span>
                  <span className="font-heading font-semibold text-foreground">{t(`crops.${crop.name}`)}</span>
                </div>
                {crop.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-primary" />
                ) : crop.change < 0 ? (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                ) : (
                  <Minus className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">₹{crop.price.toLocaleString()}</p>
              <p className={`text-sm font-medium mt-1 ${crop.change > 0 ? "text-primary" : crop.change < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {crop.change > 0 ? "+" : ""}{crop.change}% today
              </p>
              <div className="h-12 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={crop.data.map((v) => ({ v }))}>
                    <Line
                      type="monotone"
                      dataKey="v"
                      stroke={crop.change >= 0 ? "hsl(142 72% 36%)" : "hsl(0 84% 60%)"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <VoiceAssistant />
    </div>
  );
};

export default CropPrices;

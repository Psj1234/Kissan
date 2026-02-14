import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import Navbar from "@/components/Navbar";
import VoiceAssistant from "@/components/VoiceAssistant";

const trendData = [
  { month: "Aug", wheat: 2200, rice: 3000, cotton: 6200 },
  { month: "Sep", wheat: 2300, rice: 3100, cotton: 6400 },
  { month: "Oct", wheat: 2280, rice: 3050, cotton: 6500 },
  { month: "Nov", wheat: 2350, rice: 3150, cotton: 6600 },
  { month: "Dec", wheat: 2400, rice: 3180, cotton: 6700 },
  { month: "Jan", wheat: 2420, rice: 3200, cotton: 6750 },
  { month: "Feb", wheat: 2450, rice: 3200, cotton: 6800 },
];

const PriceTrends = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-24">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-kisan-sky to-kisan-blue flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Price History & Trends</h1>
          <p className="text-muted-foreground">बाजार ट्रेंड — 6-month price analysis</p>
        </motion.div>

        {/* Main Chart */}
        <motion.div
          className="glass-card rounded-2xl p-6 mb-8 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-heading font-semibold text-foreground mb-4">Crop Price Comparison</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 32% 91%)" />
                <XAxis dataKey="month" stroke="hsl(215 16% 47%)" fontSize={12} />
                <YAxis stroke="hsl(215 16% 47%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0 0% 100%)",
                    border: "1px solid hsl(214 32% 91%)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 24px hsl(217 91% 53% / 0.1)",
                  }}
                />
                <Line type="monotone" dataKey="wheat" stroke="hsl(142 72% 36%)" strokeWidth={3} dot={{ r: 4 }} name="Wheat" />
                <Line type="monotone" dataKey="rice" stroke="hsl(217 91% 53%)" strokeWidth={3} dot={{ r: 4 }} name="Rice" />
                <Line type="monotone" dataKey="cotton" stroke="hsl(25 95% 53%)" strokeWidth={3} dot={{ r: 4 }} name="Cotton" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Individual Trend Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            { name: "Wheat", key: "wheat" as const, color: "hsl(142 72% 36%)" },
            { name: "Rice", key: "rice" as const, color: "hsl(217 91% 53%)" },
            { name: "Cotton", key: "cotton" as const, color: "hsl(25 95% 53%)" },
          ].map((crop, i) => (
            <motion.div
              key={crop.name}
              className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
            >
              <h4 className="font-heading font-semibold text-foreground mb-1">{crop.name}</h4>
              <p className="text-2xl font-heading font-bold text-foreground">₹{trendData[trendData.length - 1][crop.key].toLocaleString()}</p>
              <div className="h-20 mt-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id={`grad-${crop.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={crop.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={crop.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey={crop.key} stroke={crop.color} strokeWidth={2} fill={`url(#grad-${crop.key})`} />
                  </AreaChart>
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

export default PriceTrends;

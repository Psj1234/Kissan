import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Calculator, Brain, BarChart3, CloudSun, Mic, Wheat, Droplets, Wind } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "@/components/Navbar";
import VoiceAssistant from "@/components/VoiceAssistant";

const weatherData = { temp: "32°C", condition: "Sunny", humidity: "65%", wind: "12 km/h" };

const dashboardCards = [
  {
    title: "Live Crop Prices",
    titleHi: "फसल भाव",
    icon: TrendingUp,
    description: "Real-time market prices for all crops",
    color: "from-primary to-kisan-sky",
    path: "/prices",
  },
  {
    title: "Profit Calculator",
    titleHi: "लाभ कैलकुलेटर",
    icon: Calculator,
    description: "Calculate your expected profit instantly",
    color: "from-kisan-blue to-secondary",
    path: "/calculator",
  },
  {
    title: "Smart Sell AI",
    titleHi: "स्मार्ट सेल AI",
    icon: Brain,
    description: "AI-powered selling recommendations",
    color: "from-kisan-orange to-accent",
    path: "/smart-sell",
  },
  {
    title: "Market Trends",
    titleHi: "बाजार ट्रेंड",
    icon: BarChart3,
    description: "Historical price data & analysis",
    color: "from-kisan-sky to-kisan-blue",
    path: "/trends",
  },
];

const FarmerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("नमस्कार");

  const dashboardCards = [
    {
      title: t('nav.prices'),
      icon: TrendingUp,
      description: t('dashboard.recentPrices'),
      color: "from-primary to-kisan-sky",
      path: "/prices",
    },
    {
      title: t('nav.calculator'),
      icon: Calculator,
      description: t('dashboard.calculateProfit'),
      color: "from-kisan-blue to-secondary",
      path: "/calculator",
    },
    {
      title: t('nav.smartSell'),
      icon: Brain,
      description: t('smartSell.title'),
      color: "from-kisan-orange to-accent",
      path: "/smart-sell",
    },
    {
      title: t('nav.trends'),
      icon: BarChart3,
      description: t('trends.title'),
      color: "from-kisan-sky to-kisan-blue",
      path: "/trends",
    },
  ];

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setGreeting("सुप्रभात");
    else if (h < 17) setGreeting("नमस्कार");
    else setGreeting("शुभ संध्या");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="relative container mx-auto px-4 pt-24 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2">
              {greeting} {t('common.brand')} 👋
            </h1>
            <p className="text-lg text-muted-foreground">{t('dashboard.welcome')}</p>
          </motion.div>

          {/* Weather Strip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-4 max-w-2xl mx-auto mb-12"
          >
            <div className="flex items-center justify-around text-center">
              <div className="flex items-center gap-2">
                <CloudSun className="w-8 h-8 text-accent" />
                <div>
                  <p className="text-2xl font-heading font-bold text-foreground">{weatherData.temp}</p>
                  <p className="text-xs text-muted-foreground">{weatherData.condition}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-kisan-blue" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{weatherData.humidity}</p>
                  <p className="text-xs text-muted-foreground">{t('dashboard.myAlerts')}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-kisan-sky" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{weatherData.wind}</p>
                  <p className="text-xs text-muted-foreground">Wind</p>
                </div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div className="flex items-center gap-2">
                <Wheat className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('crops.wheat')} ₹2,450</p>
                  <p className="text-xs text-primary">Best Today</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Cards */}
      <section className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {dashboardCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.5 }}
              onClick={() => navigate(card.path)}
              className="group cursor-pointer"
            >
              <div className="tilt-3d glass-card rounded-2xl p-6 h-full border border-border hover:border-primary/30 transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-heading font-semibold text-foreground mb-1">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <VoiceAssistant />
    </div>
  );
};

export default FarmerDashboard;

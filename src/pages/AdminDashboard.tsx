import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Bell,
  TrendingUp,
  Package,
  AlertTriangle,
  Activity,
  Eye,
  Bot,
  Server,
  Database,
  Save,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  getActivityStats,
  getDemandRows,
  getAlertsSent,
  getMarketPrices,
  setMarketPrices,
  savePriceUpdate,
  addCrop,
  type PriceRow,
} from "@/lib/adminStore";

const AdminDashboard = () => {
  const [activity, setActivity] = useState(getActivityStats());
  const [demand, setDemand] = useState(getDemandRows());
  const [alertsCount, setAlertsCount] = useState(0);
  const [cropsCount, setCropsCount] = useState(0);
  const [liveSync, setLiveSync] = useState(true);
  const [prices, setPrices] = useState<PriceRow[]>(() => getMarketPrices());
  const [savedId, setSavedId] = useState<number | null>(null);

  const refreshStats = () => {
    setActivity(getActivityStats());
    setDemand(getDemandRows());
    setAlertsCount(getAlertsSent().length);
    setCropsCount(getMarketPrices().length);
  };

  useEffect(() => {
    refreshStats();
    const loaded = getMarketPrices();
    setPrices(loaded);
    loaded.forEach((row) => {
      if ((row.lastThreePrices?.length ?? 0) > 0) {
        fetch("/chatbot/prices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ crop: row.crop, lastThreePrices: row.lastThreePrices }),
        }).catch(() => {});
      }
    });
  }, []);

  const updatePriceLocal = (id: number, value: number) => {
    setPrices((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: value } : p))
    );
  };

  const handleSavePrice = (id: number) => {
    const row = prices.find((p) => p.id === id);
    if (!row) return;
    const oldOfficial = row.lastThreePrices?.[0] ?? row.price;
    const newPrice = row.price;
    const lastFour = [oldOfficial, ...(row.lastThreePrices || [])].slice(0, 4);
    const updated = prices.map((p) =>
      p.id === id ? { ...p, price: newPrice, lastThreePrices: lastFour } : p
    );
    setPrices(updated);
    setMarketPrices(updated);
    savePriceUpdate(row.crop, oldOfficial, newPrice);
    setSavedId(id);
    setCropsCount(updated.length);
    fetch("/chatbot/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop: row.crop, lastThreePrices: lastFour }),
    }).catch(() => {});
    setTimeout(() => setSavedId(null), 2000);
  };

  const previousPrice = (row: PriceRow) => row.lastThreePrices?.[0] ?? 0;
  const changePct = (row: PriceRow) => {
    const prev = previousPrice(row);
    if (prev === 0) return "0";
    return (((row.price - prev) / prev) * 100).toFixed(1);
  };

  const [newCropName, setNewCropName] = useState("");
  const [newCropPrice, setNewCropPrice] = useState("");
  const handleAddCrop = () => {
    const name = newCropName.trim();
    const price = Number(newCropPrice);
    if (!name || Number.isNaN(price) || price < 0) return;
    addCrop(name, price);
    setPrices(getMarketPrices());
    setCropsCount(getMarketPrices().length);
    setNewCropName("");
    setNewCropPrice("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-24">
        <motion.div
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground">
              Market Official Control Panel
            </p>
          </div>
          {liveSync && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Sync Active
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Active Farmers Today",
              value: activity.activeFarmersToday.toLocaleString(),
              icon: Users,
              change: "+8%",
            },
            {
              label: "Alerts Sent",
              value: String(alertsCount),
              icon: Bell,
              change: "",
            },
            {
              label: "Crops Listed",
              value: String(cropsCount),
              icon: Package,
              change: "",
            },
            {
              label: "Demand Insights",
              value: demand.length > 0 ? "Active" : "—",
              icon: TrendingUp,
              change: "",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
            >
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-5 h-5 text-primary" />
                {stat.change && (
                  <span className="text-xs text-primary font-medium">
                    {stat.change}
                  </span>
                )}
              </div>
              <p className="text-2xl font-heading font-bold text-foreground">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Update prices directly from dashboard */}
        <motion.div
          className="glass-card rounded-2xl overflow-hidden mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">
                Update crop prices
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Edit below and Save. Last 4 prices used for chatbot auto-prediction.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Crop
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Last price before update (₹)
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Last 4 prices (₹)
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Current (₹/qt)
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Change
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {prices.map((row) => {
                  const prev = previousPrice(row);
                  const pct = changePct(row);
                  const isUp = Number(pct) > 0;
                  const isDown = Number(pct) < 0;
                  const last3 = row.lastThreePrices ?? [];
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-6 py-3 font-medium text-foreground">
                        {row.crop}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {prev ? `₹${prev.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground text-sm">
                        {last3.length
                          ? last3.map((p) => `₹${p}`).join(", ")
                          : "—"}
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="number"
                          value={row.price}
                          onChange={(e) =>
                            updatePriceLocal(row.id, Number(e.target.value))
                          }
                          className="w-24 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={
                            isUp
                              ? "text-green-600 font-medium"
                              : isDown
                                ? "text-red-600 font-medium"
                                : "text-muted-foreground"
                          }
                        >
                          {Number(pct) > 0 ? "+" : ""}
                          {pct}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => handleSavePrice(row.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            savedId === row.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                          }`}
                        >
                          {savedId === row.id ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          {savedId === row.id ? "Saved" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-border flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">New crop name</label>
              <input
                type="text"
                value={newCropName}
                onChange={(e) => setNewCropName(e.target.value)}
                placeholder="e.g. Maize"
                className="w-40 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Price (₹/qt)</label>
              <input
                type="number"
                value={newCropPrice}
                onChange={(e) => setNewCropPrice(e.target.value)}
                placeholder="0"
                className="w-28 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleAddCrop}
              disabled={!newCropName.trim() || !newCropPrice.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Add crop
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          {/* Farmer Activity Monitoring */}
          <motion.div
            className="glass-card rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">
                Farmer Activity Monitoring
              </h2>
            </div>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Active farmers today
                </span>
                <span className="font-medium text-foreground">
                  {activity.activeFarmersToday.toLocaleString()}
                </span>
              </li>
              <li className="flex items-center justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Most viewed crop
                </span>
                <span className="font-medium text-foreground">
                  {activity.mostViewedCrop}
                </span>
              </li>
              <li className="flex items-center justify-between py-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Most predicted crop (AI)
                </span>
                <span className="font-medium text-foreground">
                  {activity.mostPredictedCrop}
                </span>
              </li>
            </ul>
          </motion.div>

          {/* System Status Panel */}
          <motion.div
            className="glass-card rounded-2xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold text-foreground">
                System Status
              </h2>
            </div>
            <ul className="space-y-3 text-sm">
              {[
                { label: "Backend", icon: Server },
                { label: "ML Engine", icon: Bot },
                { label: "Database", icon: Database },
              ].map(({ label, icon: Icon }) => (
                <li
                  key={label}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {label}
                  </span>
                  <span className="flex items-center gap-1.5 text-green-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Online
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Demand Intelligence Dashboard */}
        <motion.div
          className="glass-card rounded-2xl overflow-hidden mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">
              Demand Intelligence
            </h2>
            <p className="text-sm text-muted-foreground ml-2">
              Crop views and profit calculator usage
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Crop
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Views
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-heading font-semibold text-foreground">
                    Profit Calculations
                  </th>
                </tr>
              </thead>
              <tbody>
                {demand.map((row, i) => (
                  <tr
                    key={row.crop}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-6 py-3 font-medium text-foreground">
                      {row.crop}
                    </td>
                    <td className="px-6 py-3 text-right text-foreground">
                      {row.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-right text-foreground">
                      {row.profitCalcs.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Link to="/admin/prices">
            <motion.div
              className="glass-card rounded-2xl p-6 cursor-pointer hover:border-primary/30 border border-border transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <BarChart3 className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-heading font-semibold text-foreground">
                Live Price Control Panel
              </h3>
              <p className="text-sm text-muted-foreground">
                Update crop prices, see previous & % change
              </p>
            </motion.div>
          </Link>
          <Link to="/admin/alerts">
            <motion.div
              className="glass-card rounded-2xl p-6 cursor-pointer hover:border-accent/30 border border-border transition-all"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <AlertTriangle className="w-8 h-8 text-accent mb-3" />
              <h3 className="font-heading font-semibold text-foreground">
                Broadcast Alerts
              </h3>
              <p className="text-sm text-muted-foreground">
                Send notifications to farmers
              </p>
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

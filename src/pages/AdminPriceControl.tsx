import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Save, History } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  getMarketPrices,
  setMarketPrices,
  savePriceUpdate,
  getPriceHistory,
  type PriceRow,
  type PriceHistoryEntry,
} from "@/lib/adminStore";

const AdminPriceControl = () => {
  const [prices, setPrices] = useState<PriceRow[]>(() => getMarketPrices());
  const [saved, setSaved] = useState<number | null>(null);
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getPriceHistory());
  }, [saved]);

  const updatePrice = (id: number, newPrice: number) => {
    setPrices((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price: newPrice } : p))
    );
  };

  const previousPrice = (row: PriceRow) => row.lastThreePrices?.[0] ?? 0;

  const handleSave = (id: number) => {
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
    setSaved(id);
    setHistory(getPriceHistory());
    fetch("/chatbot/prices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop: row.crop, lastThreePrices: lastFour }),
    }).catch(() => {});
    setTimeout(() => setSaved(null), 2000);
  };

  const changePct = (row: PriceRow) => {
    const prev = previousPrice(row);
    if (prev === 0) return "0";
    return (((row.price - prev) / prev) * 100).toFixed(1);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-24">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Live Market Price Control
          </h1>
          <p className="text-muted-foreground">
            Update official mandi prices. Previous price and last 4 prices shown.
          </p>
        </motion.div>

        <div className="glass-card rounded-2xl overflow-hidden max-w-4xl mb-10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-sm font-heading font-semibold text-foreground">
                  Crop
                </th>
                <th className="text-left px-6 py-4 text-sm font-heading font-semibold text-foreground">
                  Last price before update (₹)
                </th>
                <th className="text-left px-6 py-4 text-sm font-heading font-semibold text-foreground">
                  Last 4 prices (₹)
                </th>
                <th className="text-left px-6 py-4 text-sm font-heading font-semibold text-foreground">
                  Current (₹/qt)
                </th>
                <th className="text-left px-6 py-4 text-sm font-heading font-semibold text-foreground">
                  Change
                </th>
                <th className="text-right px-6 py-4 text-sm font-heading font-semibold text-foreground">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {prices.map((item, i) => {
                const prev = previousPrice(item);
                const pct = changePct(item);
                const isUp = Number(pct) > 0;
                const isDown = Number(pct) < 0;
                const last3 = item.lastThreePrices ?? [];
                return (
                  <motion.tr
                    key={item.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {item.crop}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {prev ? `₹${prev.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-sm">
                      {last3.length ? last3.map((p) => `₹${p}`).join(", ") : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) =>
                          updatePrice(item.id, Number(e.target.value))
                        }
                        className="w-28 px-3 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-sm"
                      />
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleSave(item.id)}
                        className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          saved === item.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        {saved === item.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saved === item.id ? "Saved" : "Save"}
                      </button>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Price Change History (Audit Trail) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl overflow-hidden max-w-4xl"
        >
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">
              Price Change History (Audit Trail)
            </h2>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="px-6 py-8 text-muted-foreground text-sm">
                No price changes yet. Updates will appear here with who changed
                and when.
              </p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-6 py-3 text-xs font-heading font-semibold text-muted-foreground">
                      Who
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-heading font-semibold text-muted-foreground">
                      Crop
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-heading font-semibold text-muted-foreground">
                      Change
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-heading font-semibold text-muted-foreground">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 20).map((h, i) => (
                    <tr
                      key={i}
                      className="border-b border-border/50 last:border-0 text-sm"
                    >
                      <td className="px-6 py-3 text-foreground">{h.adminName}</td>
                      <td className="px-6 py-3 text-foreground">{h.crop}</td>
                      <td className="px-6 py-3">
                        <span className="text-muted-foreground">
                          ₹{h.oldPrice} → ₹{h.newPrice}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {formatTime(h.at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPriceControl;

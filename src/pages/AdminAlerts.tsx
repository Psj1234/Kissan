import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bell, Users, Wheat } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { sendAlert, getAlertsSent, type AlertEntry } from "@/lib/adminStore";

const TARGET_OPTIONS = [
  { value: "all", label: "All farmers", icon: Users },
  { value: "onion", label: "Onion farmers" },
  { value: "tomato", label: "Tomato farmers" },
  { value: "potato", label: "Potato farmers" },
  { value: "wheat", label: "Wheat farmers", icon: Wheat },
];

const AdminAlerts = () => {
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [sent, setSent] = useState(false);
  const [history, setHistory] = useState<AlertEntry[]>([]);

  useEffect(() => {
    setHistory(getAlertsSent());
  }, [sent]);

  const handleSend = () => {
    const text = message.trim();
    if (!text) return;
    const targetLabel =
      TARGET_OPTIONS.find((o) => o.value === target)?.label ?? target;
    sendAlert(text, targetLabel);
    setMessage("");
    setSent(true);
    setHistory(getAlertsSent());
    setTimeout(() => setSent(false), 2000);
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-24 max-w-2xl">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Alert Broadcast System
          </h1>
          <p className="text-muted-foreground">
            Send notifications to farmers (all or by crop)
          </p>
        </motion.div>

        <motion.div
          className="glass-card rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-foreground mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Heavy rain expected. Store crops safely."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none text-sm"
          />
          <label className="block text-sm font-medium text-foreground mt-4 mb-2">
            Send to
          </label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
          >
            {TARGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            onClick={handleSend}
            disabled={!message.trim() || sent}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
            {sent ? "Sent" : "Send alert"}
          </button>
        </motion.div>

        {/* Sent alerts history */}
        <motion.div
          className="glass-card rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">
              Recent alerts
            </h2>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="px-6 py-8 text-muted-foreground text-sm">
                No alerts sent yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {history.slice(0, 15).map((a, i) => (
                  <li key={i} className="px-6 py-3 text-sm">
                    <p className="text-foreground">{a.message}</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      To {a.target} · {formatTime(a.at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        <Link
          to="/admin"
          className="inline-block mt-6 text-sm text-primary hover:underline"
        >
          ← Back to Admin Dashboard
        </Link>
      </div>
    </div>
  );
};

export default AdminAlerts;

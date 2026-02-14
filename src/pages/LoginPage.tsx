import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, Wheat, Eye, EyeOff, Phone, Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "@/lib/api";

const LoginPage = () => {
  const [role, setRole] = useState<"farmer" | "official">("farmer");
  const [loginMode, setLoginMode] = useState<"username" | "phone">("username");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [otpCounter, setOtpCounter] = useState(0);
  const navigate = useNavigate();

  // OTP Countdown Timer
  useEffect(() => {
    if (otpCounter <= 0) return;
    const timer = setTimeout(() => setOtpCounter(otpCounter - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpCounter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === "farmer") {
      navigate("/dashboard");
    } else {
      navigate("/admin");
    }
  };

  // Handle sending OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/chatbot/auth/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      setOtpSent(true);
      setSuccessMessage("OTP sent successfully! Check your phone.");
      setOtpCounter(60); // 60 second countdown
    } catch (err) {
      setError("Error sending OTP. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/chatbot/auth/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to verify OTP");
        return;
      }

      if (data.verified) {
        setSuccessMessage("Phone verified! Logging in...");
        setTimeout(() => {
          if (role === "farmer") {
            navigate("/dashboard");
          } else {
            navigate("/admin");
          }
        }, 1500);
      } else {
        setError("Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Error verifying OTP. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/chatbot/auth/resend-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend OTP");
        return;
      }

      setSuccessMessage("New OTP sent! Check your phone.");
      setOtpCounter(60);
    } catch (err) {
      setError("Error resending OTP. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden relative">
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(142 72% 36% / 0.4), transparent)" }}
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, hsl(217 91% 53% / 0.4), transparent)" }}
          animate={{ scale: [1.2, 1, 1.2], x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Login Form */}
      <motion.div
        className="flex-1 flex items-center justify-center p-6 lg:p-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="inline-flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center">
                <Wheat className="w-7 h-7 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">KISAN</h1>
            </div>
            <p className="text-muted-foreground text-sm">Smart Agricultural Market Intelligence</p>
          </motion.div>

          {/* Glass Card */}
          <motion.div
            className="glass-card rounded-2xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {/* Role Toggle */}
            <div className="flex rounded-xl bg-muted p-1 mb-6">
              {(["farmer", "official"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-heading font-semibold transition-all duration-300 ${
                    role === r
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {r === "farmer" ? "🌾 Farmer" : "🏢 Official"}
                </button>
              ))}
            </div>

            {/* Login Mode Toggle */}
            <div className="flex rounded-lg bg-muted p-1 mb-6 border border-border">
              {(["username", "phone"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setLoginMode(mode);
                    setError("");
                    setSuccessMessage("");
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-heading font-semibold transition-all duration-300 ${
                    loginMode === mode
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === "username" ? "👤 Username" : "📱 Phone"}
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Success Message */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-sm"
              >
                {successMessage}
              </motion.div>
            )}

            {/* Username Login Form */}
            {loginMode === "username" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none pr-12"
                      placeholder="Enter your password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-heading font-semibold text-base shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                >
                  {loading && <Loader className="w-4 h-4 animate-spin" />}
                  {role === "farmer" ? "Login as Farmer 🌾" : "Login as Official 🏢"}
                </motion.button>
              </form>
            )}

            {/* Phone Login Form */}
            {loginMode === "phone" && (
              <form onSubmit={!otpSent ? handleSendOtp : handleVerifyOtp} className="space-y-4">
                {!otpSent ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Phone Number</label>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-3 rounded-xl border border-border bg-muted text-muted-foreground text-sm font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                          className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none"
                          placeholder="9876543210"
                          maxLength="10"
                          disabled={loading}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Enter your 10-digit mobile number</p>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading || phoneNumber.length !== 10}
                      className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-heading font-semibold text-base shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: loading || phoneNumber.length !== 10 ? 1 : 1.01 }}
                      whileTap={{ scale: loading || phoneNumber.length !== 10 ? 1 : 0.99 }}
                    >
                      {loading && <Loader className="w-4 h-4 animate-spin" />}
                      Send OTP
                    </motion.button>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Enter OTP</label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all outline-none text-center text-2xl tracking-widest font-mono"
                        placeholder="000000"
                        maxLength="6"
                        disabled={loading}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">We sent a 6-digit OTP to +91{phoneNumber}</p>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full py-3 rounded-xl gradient-hero text-primary-foreground font-heading font-semibold text-base shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: loading || otp.length !== 6 ? 1 : 1.01 }}
                      whileTap={{ scale: loading || otp.length !== 6 ? 1 : 0.99 }}
                    >
                      {loading && <Loader className="w-4 h-4 animate-spin" />}
                      Verify OTP
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading || otpCounter > 0}
                      className="w-full py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: loading || otpCounter > 0 ? 1 : 1.01 }}
                      whileTap={{ scale: loading || otpCounter > 0 ? 1 : 0.99 }}
                    >
                      {otpCounter > 0 ? `Resend in ${otpCounter}s` : "Resend OTP"}
                    </motion.button>
                  </>
                )}
              </form>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or continue with</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground">
                <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors text-sm font-medium text-foreground">
                <Mic className="w-4 h-4 text-primary" />
                Voice OTP
              </button>
            </div>
          </motion.div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Empowering Indian Farmers with AI-Driven Market Intelligence
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;

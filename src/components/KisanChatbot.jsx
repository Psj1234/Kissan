/**
 * KISAN AI Assistant – Floating chatbot for price prediction and selling recommendations.
 * Integrates with backend POST /chatbot/predict and POST /chatbot/recommend.
 */

import { useState, useRef, useEffect } from "react";
import { X, Send, Mic, Bot, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./KisanChatbot.css";

const CHATBOT_API = "/chatbot/predict";
const RECOMMEND_API = "/chatbot/recommend";
const COMMODITIES = ["onion", "potato", "tomato", "cucumber", "wheat", "bajra", "rice", "soybean"];

// Detect if user message is asking for price prediction
function wantsPrediction(text) {
  const t = text.toLowerCase().trim();
  return COMMODITIES.some((c) => t.includes("predict") && t.includes(c)) || /predict\s+\w+\s*price/i.test(t);
}

// Detect if user message is asking for selling recommendation
function wantsRecommendation(text) {
  const t = text.toLowerCase().trim();
  const keywords = ['sell', 'recommendation', 'recommend', 'when to sell', 'best time', 'stock', 'should i sell'];
  return keywords.some(kw => t.includes(kw)) && COMMODITIES.some(c => t.includes(c));
}

// Parse commodity from message (e.g. "predict onion price" -> "onion")
function parseCommodity(text) {
  const t = text.toLowerCase();
  const found = COMMODITIES.find((c) => t.includes(c));
  return found || null;
}

// Parse quantity from message (e.g. "30 quintals" or "30 qt" -> 30)
function parseQuantity(text) {
  const match = text.match(/(\d+)\s*(quintal|qt|q|kg|quintals)/i);
  if (match) {
    let qty = Number(match[1]);
    // Convert kg to quintals
    if (match[2].toLowerCase().startsWith('kg')) {
      qty = qty / 100;
    }
    return qty;
  }
  return null;
}

export default function KisanChatbot() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: `${t('chatbot.greeting')}\n\n${t('chatbot.helpText')}\n• ${t('chatbot.pricePrediction')} (e.g., "${t('chatbot.predictPriceExample')}")\n• ${t('chatbot.sellingRecommendation')} (e.g., "${t('chatbot.recommendExample')}")\n\n${t('chatbot.askAnything')}` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [pendingCommodity, setPendingCommodity] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'predict' or 'recommend'
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true; // Show real-time transcription
        recognition.lang = 'en-IN'; // English (India) - understands both English and Hindi words
        recognition.maxAlternatives = 1;
        
        recognition.onstart = () => {
          console.log('Speech recognition started');
          setIsListening(true);
        };
        
        recognition.onresult = (event) => {
          console.log('Speech recognition result:', event);
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          
          console.log('Transcript:', transcript);
          setInput(transcript);
          
          // If it's a final result, process it
          if (event.results[last].isFinal) {
            setIsRecording(false);
            setIsListening(false);
            
            // Auto-send after a short delay to show the recognized text
            setTimeout(() => {
              if (transcript.trim()) {
                handleSendVoice(transcript);
              }
            }, 500);
          }
        };
        
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setIsListening(false);
          
          if (event.error === 'no-speech') {
            addMessage("ai", `${t('chatbot.speakClearly')} 🎤`);
          } else if (event.error === 'not-allowed') {
            addMessage("ai", t('chatbot.microphonePermission'));
          } else if (event.error === 'aborted') {
            // User stopped recording, don't show error
            console.log('Recording aborted by user');
          } else {
            addMessage("ai", `${t('chatbot.voiceNotSupported')}: ${event.error}`);
          }
        };
        
        recognition.onend = () => {
          console.log('Speech recognition ended');
          setIsRecording(false);
          setIsListening(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, { role, text }]);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      addMessage("ai", t('chatbot.voiceNotSupported'));
      return;
    }

    if (isRecording) {
      // Stop recording
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      // Start recording
      setIsRecording(true);
      setInput(""); // Clear any existing text
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recording:', error);
        setIsRecording(false);
        addMessage("ai", t('chatbot.voiceNotSupported'));
      }
    }
  };

  const handleSendVoice = async (text) => {
    if (!text || loading) return;

    addMessage("user", text);

    // Check for selling recommendation request
    if (wantsRecommendation(text) && parseCommodity(text)) {
      const comm = parseCommodity(text);
      const qty = parseQuantity(text);
      setPendingCommodity(comm);
      setPendingAction('recommend');
      setTyping(true);
      
      if (qty !== null) {
        // Have both commodity and quantity
        await handleRecommend(comm, qty);
        setPendingCommodity(null);
        setPendingAction(null);
        return;
      } else {
        // Need quantity
        setTyping(false);
        addMessage("ai", `How many quintals of ${comm} do you have? (e.g., "30 quintals" or "30 qt")`);
        return;
      }
    }

    // Check if responding with quantity for pending recommendation
    if (pendingAction === 'recommend' && pendingCommodity) {
      const qty = parseQuantity(text);
      if (qty !== null) {
        await handleRecommend(pendingCommodity, qty);
        setPendingCommodity(null);
        setPendingAction(null);
        return;
      } else {
        setTyping(true);
        await new Promise((r) => setTimeout(r, 400));
        setTyping(false);
        addMessage("ai", "Please specify the quantity in quintals (e.g., '30 quintals' or '30 qt')");
        return;
      }
    }

    // Check for price prediction request
    if (wantsPrediction(text) && parseCommodity(text)) {
      const comm = parseCommodity(text);
      setPendingCommodity(comm);
      setPendingAction('predict');
      setTyping(true);
      try {
        const lastRes = await fetch(`/chatbot/prices/last/${comm}`);
        const lastData = await lastRes.json().catch(() => ({}));
        const stored = lastData.prices || [];
        if (stored.length >= 4) {
          // Perfect: we have all 4 prices needed for prediction
          setTyping(false);
          await handlePredict(comm, stored.slice(0, 4));
          setPendingCommodity(null);
          setPendingAction(null);
          return;
        }
        if (stored.length >= 3) {
          // Use available prices and approximate the 4th (Day -7 approximated by Day -3)
          const pricesForApi = [stored[0], stored[1], stored[2], stored[2]];
          setTyping(false);
          await handlePredict(comm, pricesForApi);
          setPendingCommodity(null);
          setPendingAction(null);
          return;
        }
        // Not enough price data available
        setTyping(false);
        addMessage("ai", `Sorry, I don't have enough price data for ${comm} yet. Please contact the admin to update market prices in the admin dashboard. Once prices are added, I'll be able to predict for you! 🌾`);
        setPendingCommodity(null);
        setPendingAction(null);
        return;
      } catch (_) {
        setTyping(false);
        addMessage("ai", `Could not fetch price data for ${comm}. Please check with the admin or try again later.`);
        setPendingCommodity(null);
        setPendingAction(null);
        return;
      }
    }

    // General help message
    setTyping(true);
    await new Promise((r) => setTimeout(r, 400));
    setTyping(false);
    addMessage("ai", "I can help you with:\n\n📈 **Price Predictions**: Say \"Predict onion price\" or \"Predict tomato price\"\n\n💰 **Selling Recommendations**: Say \"Should I sell my 30 quintals of onion?\" or \"When to sell tomato?\"\n\nAvailable crops: onion, potato, tomato, cucumber, wheat, rice, bajra, soybean 🌾");
  };

  const handlePredict = async (commodity, prices) => {
    setLoading(true);
    try {
      const res = await fetch(CHATBOT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commodity, prices }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      const reply = data.reply ?? `Predicted ${commodity} price: ₹${data.prediction ?? "—"}`;
      setTyping(true);
      await new Promise((r) => setTimeout(r, 600));
      setTyping(false);
      addMessage("ai", reply);
    } catch (err) {
      setTyping(false);
      addMessage("ai", `${t('chatbot.predictionFailed')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async (commodity, quantity) => {
    setLoading(true);
    try {
      const res = await fetch(RECOMMEND_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commodity, quantity }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Recommendation failed");
      const reply = data.reply ?? "Unable to generate recommendation.";
      setTyping(true);
      await new Promise((r) => setTimeout(r, 800));
      setTyping(false);
      addMessage("ai", reply);
    } catch (err) {
      setTyping(false);
      addMessage("ai", `${t('chatbot.recommendationFailed')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    addMessage("user", text);

    // Check for selling recommendation request
    if (wantsRecommendation(text) && parseCommodity(text)) {
      const comm = parseCommodity(text);
      const qty = parseQuantity(text);
      setPendingCommodity(comm);
      setPendingAction('recommend');
      setTyping(true);
      
      if (qty !== null) {
        // Have both commodity and quantity
        await handleRecommend(comm, qty);
        setPendingCommodity(null);
        setPendingAction(null);
        return;
      } else {
        // Need quantity
        setTyping(false);
        addMessage("ai", `How many quintals of ${comm} do you have? (e.g., "30 quintals" or "30 qt")`);
        return;
      }
    }

    // Check if responding with quantity for pending recommendation
    if (pendingAction === 'recommend' && pendingCommodity) {
      const qty = parseQuantity(text);
      if (qty !== null) {
        await handleRecommend(pendingCommodity, qty);
        setPendingCommodity(null);
        setPendingAction(null);
        return;
      } else {
        setTyping(true);
        await new Promise((r) => setTimeout(r, 400));
        setTyping(false);
        addMessage("ai", "Please specify the quantity in quintals (e.g., '30 quintals' or '30 qt')");
        return;
      }
    }

    // Check for price prediction request
    if (wantsPrediction(text) && parseCommodity(text)) {
      const comm = parseCommodity(text);
      setPendingCommodity(comm);
      setPendingAction('predict');
      setTyping(true);
      try {
        const lastRes = await fetch(`/chatbot/prices/last/${comm}`);
        const lastData = await lastRes.json().catch(() => ({}));
        const stored = lastData.prices || [];
        if (stored.length >= 4) {
          // Perfect: we have all 4 prices needed for prediction
          setTyping(false);
          await handlePredict(comm, stored.slice(0, 4));
          setPendingCommodity(null);
          setPendingAction(null);
          return;
        }
        if (stored.length >= 3) {
          // Use available prices and approximate the 4th (Day -7 approximated by Day -3)
          const pricesForApi = [stored[0], stored[1], stored[2], stored[2]];
          setTyping(false);
          await handlePredict(comm, pricesForApi);
          setPendingCommodity(null);
          setPendingAction(null);
          return;
        }
        // Not enough price data available
        setTyping(false);
        addMessage("ai", `Sorry, I don't have enough price data for ${comm} yet. Please contact the admin to update market prices in the admin dashboard. Once prices are added, I'll be able to predict for you! 🌾`);
        setPendingCommodity(null);
        setPendingAction(null);
        return;
      } catch (_) {
        setTyping(false);
        addMessage("ai", `Could not fetch price data for ${comm}. Please check with the admin or try again later.`);
        setPendingCommodity(null);
        setPendingAction(null);
        return;
      }
    }

    // General help message
    setTyping(true);
    await new Promise((r) => setTimeout(r, 400));
    setTyping(false);
    addMessage("ai", "I can help you with:\n\n📈 **Price Predictions**: Say \"Predict onion price\" or \"Predict tomato price\"\n\n💰 **Selling Recommendations**: Say \"Should I sell my 30 quintals of onion?\" or \"When to sell tomato?\"\n\nAvailable crops: onion, potato, tomato, cucumber, wheat, rice, bajra, soybean 🌾");
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        className="kisan-chatbot-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open KISAN AI Assistant"
      >
        <span className="kisan-chatbot-fab-icon">🌾</span>
        <span className="kisan-chatbot-fab-label">KISAN AI</span>
      </button>

      {/* Chat window */}
      <div className={`kisan-chatbot-window ${open ? "kisan-chatbot-window--open" : ""}`}>
        <div className="kisan-chatbot-header">
          <div className="kisan-chatbot-header-title">
            <Bot size={20} />
            <span>KISAN AI Assistant 🌾</span>
          </div>
          <div className="kisan-chatbot-status">
            <span className="kisan-chatbot-status-dot" />
            Online
          </div>
          <button
            type="button"
            className="kisan-chatbot-close"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>

        <div className="kisan-chatbot-messages">
          {messages.map((m, i) => (
            <div key={i} className={`kisan-chatbot-msg kisan-chatbot-msg--${m.role}`}>
              {m.role === "ai" ? <Bot size={16} className="kisan-chatbot-msg-icon" /> : <User size={16} className="kisan-chatbot-msg-icon" />}
              <div className="kisan-chatbot-msg-bubble">{m.text}</div>
            </div>
          ))}
          {typing && (
            <div className="kisan-chatbot-msg kisan-chatbot-msg--ai">
              <Bot size={16} className="kisan-chatbot-msg-icon" />
              <div className="kisan-chatbot-typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          {loading && !typing && (
            <div className="kisan-chatbot-msg kisan-chatbot-msg--ai">
              <Bot size={16} className="kisan-chatbot-msg-icon" />
              <div className="kisan-chatbot-loading-dots">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="kisan-chatbot-footer">
          {isListening && (
            <div className="kisan-chatbot-listening-indicator">
              <span className="kisan-chatbot-pulse-dot"></span>
              {t('chatbot.listening')}
            </div>
          )}
          <div className="kisan-chatbot-input-wrap">
            <button 
              type="button" 
              className={`kisan-chatbot-voice ${isRecording ? 'kisan-chatbot-voice--recording' : ''}`}
              onClick={handleVoiceInput}
              disabled={loading}
              aria-label={isRecording ? t('chatbot.stopRecording') : t('chatbot.startVoiceInput')}
            >
              <Mic size={18} />
            </button>
            <input
              ref={inputRef}
              type="text"
              className="kisan-chatbot-input"
              placeholder={isRecording ? t('chatbot.listening') : t('chatbot.typePlaceholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={loading || isRecording}
            />
            <button
              type="button"
              className="kisan-chatbot-send"
              onClick={handleSend}
              disabled={loading || !input.trim() || isRecording}
              aria-label={t('chatbot.sendMessage')}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

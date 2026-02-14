/**
 * KISAN backend – serves POST /chatbot/predict (calls Python predict.py).
 * Also handles OTP authentication via Twilio.
 * Run: node server.js  (port 3001)
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const chatbotRouter = require("./routes/chatbot");
const authRouter = require("./routes/auth");

const app = express();
const PORT = process.env.CHATBOT_PORT || 3001;

app.use(cors());
app.use(express.json());

const router = express.Router();
chatbotRouter(router);
authRouter(router);
app.use("/chatbot", router);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "kisan-chatbot" });
});

app.listen(PORT, () => {
  console.log(`KISAN chatbot backend running at http://localhost:${PORT}`);
});

/**
 * Twilio OTP Authentication Router
 * Handles phone number OTP verification using Twilio Verify Service
 */

const twilio = require("twilio");

// Twilio credentials from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const VERIFY_SERVICE_SID = process.env.VERIFY_SERVICE_SID;

// Validate credentials are set
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !VERIFY_SERVICE_SID) {
  throw new Error("Missing required Twilio environment variables. Check .env file.");
}

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Rate limiting: store OTP requests to prevent brute force
const otpAttempts = new Map();
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Helper: Check if phone number has exceeded rate limit
function checkRateLimit(phoneNumber) {
  const now = Date.now();
  if (!otpAttempts.has(phoneNumber)) {
    otpAttempts.set(phoneNumber, []);
  }

  const attempts = otpAttempts.get(phoneNumber);
  const recentAttempts = attempts.filter((time) => now - time < ATTEMPT_WINDOW);

  if (recentAttempts.length >= MAX_ATTEMPTS) {
    return false;
  }

  recentAttempts.push(now);
  otpAttempts.set(phoneNumber, recentAttempts);
  return true;
}

// Helper: Validate phone number format
function validatePhoneNumber(phone) {
  // Accept formats: +91XXXXXXXXXX, 91XXXXXXXXXX, XXXXXXXXXX
  const cleaned = phone.replace(/[\s\-()]/g, "");
  const indianPhoneRegex = /^(\+?91|0)?[6-9]\d{9}$/;
  return indianPhoneRegex.test(cleaned);
}

// Helper: Normalize phone number to E.164 format (+91XXXXXXXXXX)
function normalizePhoneNumber(phone) {
  let cleaned = phone.replace(/[\s\-()]/g, "");

  // Remove leading 0
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  // Add country code if not present
  if (!cleaned.startsWith("+91") && !cleaned.startsWith("91")) {
    cleaned = "91" + cleaned;
  } else if (cleaned.startsWith("91") && !cleaned.startsWith("+91")) {
    // prefix with +
  }

  // Ensure + prefix
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }

  return cleaned;
}

module.exports = (router) => {
  /**
   * POST /auth/send-otp
   * Send OTP to phone number via Twilio Verify
   */
  router.post("/auth/send-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({
          error: "Invalid phone number. Please use an Indian number (10-11 digits)",
        });
      }

      // Check rate limit
      if (!checkRateLimit(phoneNumber)) {
        return res.status(429).json({
          error: "Too many OTP requests. Please try again later.",
        });
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Send OTP using Twilio Verify
      const verification = await client.verify.v2
        .services(VERIFY_SERVICE_SID)
        .verifications.create({
          to: normalizedPhone,
          channel: "sms",
        });

      console.log(`OTP sent to ${normalizedPhone}. SID: ${verification.sid}`);

      res.json({
        success: true,
        message: "OTP sent successfully",
        sid: verification.sid,
        phoneNumber: normalizedPhone,
      });
    } catch (error) {
      console.error("Error sending OTP:", error.message);
      res.status(500).json({
        error: "Failed to send OTP. Please try again.",
        details: error.message,
      });
    }
  });

  /**
   * POST /auth/verify-otp
   * Verify OTP code entered by user
   */
  router.post("/auth/verify-otp", async (req, res) => {
    try {
      const { phoneNumber, otp } = req.body;

      if (!phoneNumber || !otp) {
        return res.status(400).json({
          error: "Phone number and OTP are required",
        });
      }

      // Validate OTP format (typically 6 digits)
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({
          error: "Invalid OTP format. Please enter 6 digits.",
        });
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Verify OTP using Twilio Verify
      const verificationCheck = await client.verify.v2
        .services(VERIFY_SERVICE_SID)
        .verificationChecks.create({
          to: normalizedPhone,
          code: otp,
        });

      if (verificationCheck.status === "approved") {
        console.log(`OTP verified successfully for ${normalizedPhone}`);

        // OTP is valid - create a session/JWT token or authenticate user
        // For now, return success status
        res.json({
          success: true,
          message: "OTP verified successfully",
          verified: true,
          phoneNumber: normalizedPhone,
          // In a real app, you'd create a session/JWT here
          // Could also link to farmer/official user account
        });
      } else {
        res.status(400).json({
          error: "Invalid OTP. Please try again.",
          verified: false,
        });
      }
    } catch (error) {
      console.error("Error verifying OTP:", error.message);

      // Check if it's a "Max checks" exceeded error
      if (error.message.includes("Max checks")) {
        return res.status(429).json({
          error:
            "Too many verification attempts. Please request a new OTP.",
        });
      }

      res.status(500).json({
        error: "Failed to verify OTP. Please try again.",
        details: error.message,
      });
    }
  });

  /**
   * POST /auth/resend-otp
   * Resend OTP to phone number
   */
  router.post("/auth/resend-otp", async (req, res) => {
    try {
      const { phoneNumber } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      // Validate phone number
      if (!validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({
          error: "Invalid phone number format",
        });
      }

      // Check rate limit (allows resend but still limited)
      if (!checkRateLimit(phoneNumber)) {
        return res.status(429).json({
          error: "Too many OTP requests. Please try again later.",
        });
      }

      // Normalize phone number
      const normalizedPhone = normalizePhoneNumber(phoneNumber);

      // Send new OTP
      const verification = await client.verify.v2
        .services(VERIFY_SERVICE_SID)
        .verifications.create({
          to: normalizedPhone,
          channel: "sms",
        });

      console.log(`OTP resent to ${normalizedPhone}. SID: ${verification.sid}`);

      res.json({
        success: true,
        message: "OTP resent successfully",
        sid: verification.sid,
      });
    } catch (error) {
      console.error("Error resending OTP:", error.message);
      res.status(500).json({
        error: "Failed to resend OTP. Please try again.",
        details: error.message,
      });
    }
  });
};

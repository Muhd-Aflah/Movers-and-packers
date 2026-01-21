const express = require("express");
const Razorpay = require("razorpay");
const nodeCrypto = require("crypto");

const { protect } = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");



const router = express.Router();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay keys missing in environment variables");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});


router.post("/create-order", protect, async (req, res) => {
  try {
    const { amount, currency = "INR", notes = {} } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ 
        success: false,
        message: "Valid amount is required" 
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, 
      currency: currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        ...notes,
        user_id: req.user?.id || "guest",
        created_at: new Date().toISOString()
      },
      payment_capture: 1,
      partial_payment: false,
    });

    console.log("Razorpay Order Created:", {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt
    });

    res.json({
      success: true,
      data: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        created_at: order.created_at
      }
    });

  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to create payment order",
      error: error.message 
    });
  }
});

router.post("/verify", async (req, res) => {

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing required payment verification fields"
      });
    }

   // Create verification signature
const body = razorpay_order_id + "|" + razorpay_payment_id;

const expectedSignature = nodeCrypto
  .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
  .update(body)
  .digest("hex");


    // Verify signature
    if (expectedSignature === razorpay_signature) {
      // Payment is successful
      console.log("Payment Verified Successfully:", {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature
      });

      res.json({
        success: true,
        message: "Payment verified successfully",
        data: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          signature: razorpay_signature,
          verified_at: new Date().toISOString()
        }
      });

    } else {
      // Payment verification failed
      console.error("Payment Verification Failed:", {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        received_signature: razorpay_signature,
        expected_signature: expectedSignature
      });

      res.status(400).json({
        success: false,
        message: "Payment verification failed - invalid signature"
      });
    }

  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Payment verification failed",
      error: error.message
    });
  }
});

router.get("/:paymentId", protect, async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required"
      });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(paymentId);

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error("Fetch Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment details",
      error: error.message
    });
  }
});

router.get("/order/:orderId", protect, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    // Fetch order details from Razorpay
    const order = await razorpay.orders.fetch(orderId);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    console.error("Fetch Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message
    });
  }
});

router.post("/refund", protect, async (req, res) => {
  try {
    const { paymentId, amount } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required for refund"
      });
    }

    // Create refund
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount ? amount * 100 : undefined 
    });

    console.log("Payment Refunded:", {
      payment_id: paymentId,
      refund_id: refund.id,
      amount: refund.amount
    });

    res.json({
      success: true,
      message: "Refund processed successfully",
      data: refund
    });

  } catch (error) {
    console.error("Refund Error:", error);
    res.status(500).json({
      success: false,
      message: "Refund failed",
      error: error.message
    });
  }
});

router.post("/webhook", express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "your_webhook_secret";
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature
    const body = req.body;
    const expectedSignature = nodeCrypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    if (signature === expectedSignature) {
      const event = JSON.parse(body);
      
      console.log("Webhook Event Received:", {
        event: event.event,
        entity: event.entity?.id
      });

      // Handle different webhook events
      switch (event.event) {
        case 'payment.captured':
          console.log("Payment Captured:", event.payload.payment.entity);
          break;
        
        case 'payment.failed':
          console.log("Payment Failed:", event.payload.payment.entity);
          break;
        
        case 'refund.processed':
          console.log("Refund Processed:", event.payload.refund.entity);
          break;
        
        default:
          console.log("Unhandled Webhook Event:", event);
      }

      res.status(200).json({ status: 'received' });
    } else {
      console.error("Webhook Signature Verification Failed");
      res.status(401).json({ error: 'Invalid signature' });
    }

  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
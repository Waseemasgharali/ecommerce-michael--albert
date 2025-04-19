import express from "express";
import dotenv from "dotenv";
import stripe from "stripe";
import { MongoClient } from "mongodb";

// Load Variables
dotenv.config();

// Start Server
const app = express();
app.use(express.static("public"));
app.use(express.json());

// MongoDB Connection
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let db;

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db("ecommerce");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}
connectToDatabase();

// Home Route
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "public" });
});
// Cart
app.get("/cart.html", (req, res) => {
  res.sendFile("cart.html", { root: "public" });
});
// Success
app.get("/success.html", (req, res) => {
  res.sendFile("success.html", { root: "public" });
});
// Cancel
app.get("/cancel.html", (req, res) => {
  res.sendFile("cancel.html", { root: "public" });
});
// Delivery
app.get("/delivery.html", (req, res) => {
  res.sendFile("delivery.html", { root: "public" });
});

// Categories
app.get("/categories", async (req, res) => {
  try {
    const categories = await db.collection("categories").find().toArray();
    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Products
app.get("/products", async (req, res) => {
  try {
    const { category, subcategory } = req.query;
    let query = {};
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    const products = await db.collection("products").find(query).toArray();
    res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/search", async (req, res) => {
  const { q } = req.query;
  try {
    const products = await db
      .collection("products")
      .find({
        title: { $regex: q, $options: "i" },
      })
      .toArray();
    res.json(products);
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// Place Order
app.post("/place-order", async (req, res) => {
  const { deliveryDetails, cart } = req.body;
  try {
    for (const item of cart) {
      const product = await db.collection("products").findOne({ id: item.id });
      if (product && product.stock >= item.quantity) {
        await db
          .collection("products")
          .updateOne({ id: item.id }, { $inc: { stock: -item.quantity } });
      } else {
        return res
          .status(400)
          .json({ error: `Item ${item.title} is out of stock` });
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Stripe
let stripeGateway = stripe(process.env.stripe_key);
app.post("/stripe-checkout", async (req, res) => {
  const lineItems = req.body.items.map((item) => {
    const unitAmount = parseInt(parseFloat(item.price) * 100);
    console.log("item-price:", item.price);
    console.log("unitAmount:", unitAmount);
    return {
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          images: [item.image],
        },
        unit_amount: unitAmount,
      },
      quantity: item.quantity,
    };
  });
  const session = await stripeGateway.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    success_url: `http://localhost:3000/success.html`,
    cancel_url: `http://localhost:3000/cancel.html`,
    line_items: lineItems,
    billing_address_collection: "required",
  });
  res.json({ url: session.url });
});

app.listen(3000, () => {
  console.log("Listening on port http://localhost:3000");
});

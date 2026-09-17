/**
 * routes/productRoutes.js
 * 
 * Modular Router demonstrating domain separation for Products.
 */

const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');

const products = [
  { id: 101, title: "Mechanical Keyboard", price: 99.99 },
  { id: 102, title: "Wireless Mouse", price: 49.99 }
];

router.get('/', (req, res) => {
  return res.json({ success: true, count: products.length, data: products });
});

router.get('/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const product = products.find(p => p.id === productId);

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  return res.json({ success: true, data: product });
});

// Admin-only creation endpoint
router.post('/', authenticate, (req, res) => {
  const { title, price } = req.body;
  if (!title || price === undefined) {
    return res.status(400).json({ success: false, message: "Title and price are required" });
  }

  const newProduct = { id: products.length + 101, title, price: Number(price) };
  products.push(newProduct);
  return res.status(201).json({ success: true, data: newProduct });
});

module.exports = router;


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const productSchema = new mongoose.Schema({}, {
    strict: false,
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

app.get('/', (req, res) => {
    res.json({
        status: 'online',
        project: 'Elit-Techno'
    });
});

// Получить весь каталог
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ id: 1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Получить один товар по числовому ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findOne({
            id: Number(req.params.id)
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Первоначальная загрузка каталога.
// Не перезаписывает уже существующие товары.
app.post('/api/products/bulk', async (req, res) => {
    try {
        if (!Array.isArray(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: 'Expected a non-empty array' });
        }

        const operations = req.body.map(product => {
            if (!Number.isInteger(Number(product.id))) {
                throw new Error('Every product must have a numeric id');
            }

            return {
                updateOne: {
                    filter: { id: Number(product.id) },
                    update: { $setOnInsert: product },
                    upsert: true
                }
            };
        });

        const result = await Product.bulkWrite(operations);
        res.json({
            message: 'Catalog imported',
            inserted: result.upsertedCount
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Добавить товар
app.post('/api/products', async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { id: Number(req.body.id) },
            { $set: req.body },
            { upsert: true, new: true, runValidators: true }
        );
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Изменить товар
app.put('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndUpdate(
            { id: Number(req.params.id) },
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Удалить товар
app.delete('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findOneAndDelete({
            id: Number(req.params.id)
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err.message));

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Elit-Techno server running on port ${PORT}`);
});



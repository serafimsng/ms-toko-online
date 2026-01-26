const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
// Tambahkan di paling atas file
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Import model User yg baru dibuat

const JWT_SECRET = "kuncirahasia_courtney_store_123"; 

// --- PENGATURAN PENTING (Agar tidak error saat upload gambar) ---
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Izinkan Frontend mengakses Backend
app.use(cors());

// --- KONEKSI DATABASE SPESIAL VERCEL (Anti Timeout) ---
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  try {
    // 👇 INI LINK MONGODB KAMU
    await mongoose.connect('mongodb+srv://admin:admin123@cluster0.rtinywq.mongodb.net/?appName=Cluster0');
    console.log("✅ Database MongoDB Terhubung!");
  } catch (err) {
    console.error("❌ Gagal Konek:", err);
  }
};

// Middleware: Paksa connect database sebelum memproses request apapun
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// --- MODEL DATA PRODUK ---
const ProductSchema = new mongoose.mongoose.Schema({
  name: String,
  price: Number,
  description: String,
  image: String
});
const Product = mongoose.model('Product', ProductSchema);

// --- ROUTE API (CRUD LENGKAP) ---

// 1. READ ALL (Ambil Semua Data)
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. READ ONE (Ambil 1 Data berdasarkan ID)
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.json(product);
  } catch (error) {
    res.status(404).json({ message: "Produk tidak ditemukan" });
  }
});

// 3. CREATE (Tambah Data Baru)
app.post('/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 4. UPDATE (Edit Data)
app.put('/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 5. DELETE (Hapus Data)
app.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// --- FITUR LOGIN & REGISTER (Auth) ---

// REGISTER
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- JANGAN LUPA BARIS INI (Wajib untuk Vercel) ---
module.exports = app;

// Jalankan Server (Hanya jika dijalankan manual, bukan oleh Vercel)
if (require.main === module) {
  app.listen(5000, () => console.log('Server berjalan di port 5000'));
}

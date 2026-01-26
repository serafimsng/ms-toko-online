const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
// Tambahkan di paling atas file
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User'); // Import model User yg baru dibuat

const JWT_SECRET = "kuncirahasia_courtney_store_123"; // Harusnya di .env, tapi hardcode dulu gapapa buat belajar
// --- PENGATURAN PENTING (Agar tidak error saat upload gambar) ---
// Kita naikkan batas ukuran data jadi 50MB supaya gambar HD bisa masuk
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Izinkan Frontend mengakses Backend
app.use(cors());

// --- KONEKSI DATABASE ---
// ✅ INI BENAR (Pakai kutip)
mongoose.connect('mongodb+srv://admin:admin123@cluster0.rtinywq.mongodb.net/?appName=Cluster0')
    .then(() => console.log("✅ Database MongoDB Atlas Terhubung!"))
    .catch(err => console.log("❌ Gagal Konek Database:", err));

// --- MODEL DATA PRODUK ---
const ProductSchema = new mongoose.Schema({
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
        if (!product) return res.status(404).json({ message: "Produk tidak ditemukan" });
        res.json(product);
    } catch (error) {
        res.status(404).json({ message: "ID Produk salah" });
    }
});

// 3. CREATE (Tambah Produk Baru)
app.post('/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: "Gagal menyimpan data" });
    }
});

// 4. UPDATE (Edit Produk) - PERHATIKAN BAGIAN INI
app.put('/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // PENTING: Agar yang dikembalikan adalah data BARU, bukan yang lama
        );
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: "Gagal update produk" });
    }
});

// 5. DELETE (Hapus Produk)
app.delete('/products/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Produk berhasil dihapus" });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus produk" });
    }
});

// --- FITUR AUTHENTICATION (LO3) ---

// 1. REGISTER (Daftar User Baru)
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Cek apakah username sudah ada?
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username sudah dipakai!" });
        }

        // Enkripsi password sebelum disimpan
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan ke database
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "Registrasi berhasil! Silakan login." });
    } catch (error) {
        res.status(500).json({ message: "Error saat registrasi", error });
    }
});

// 2. LOGIN (Masuk & Dapat Token)
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Cari user di database
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: "Username tidak ditemukan" });
        }

        // Cek apakah password benar?
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Password salah!" });
        }

        // Jika benar, buatkan TOKEN (Tiket Masuk)
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token, username: user.username });
    } catch (error) {
        res.status(500).json({ message: "Error saat login", error });
    }
});

// --- JALANKAN SERVER ---
const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Server berjalan mulus di port ${PORT}...`));

module.exports = app;

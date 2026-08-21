# Belajar Vibe Coding (API Backend)

Aplikasi ini adalah sebuah RESTful API sederhana yang mengimplementasikan sistem Autentikasi Pengguna (Registrasi, Login, Dapatkan Profil, dan Logout). Aplikasi ini dibangun dengan mengedepankan performa tinggi menggunakan runtime modern **Bun** dan kerangka kerja web **ElysiaJS**.

---

## 🛠️ Technology Stack & Library
- **Runtime:** [Bun](https://bun.sh/)
- **Web Framework:** [ElysiaJS](https://elysiajs.com/)
- **Database:** MySQL
- **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
- **Validasi Input:** TypeBox (Bawaan ElysiaJS)
- **Kriptografi/Hashing:** `bcryptjs`
- **Testing:** Bun Test

---

## 📁 Arsitektur dan Struktur Folder

Aplikasi ini menggunakan pendekatan arsitektur berlapis (layered architecture) berbasis komponen, untuk memisahkan *business logic* dari *routing layer*. Seluruh file menggunakan format penamaan *kebab-case* (misal: `user-route.ts`).

```text
.
├── src/
│   ├── db/                 # Konfigurasi koneksi MySQL dan skema Drizzle ORM
│   ├── errors/             # Custom Error Classes (Unauthorized, InvalidCredentials, dll)
│   ├── middlewares/        # Elysia middlewares (seperti middleware autentikasi token Bearer)
│   ├── routes/             # Endpoint Controller / Router (Mendefinisikan path API & validasi)
│   ├── services/           # Business Logic Layer (Interaksi dengan DB, hashing, logika utama)
│   └── index.ts            # Entry point aplikasi (Server Elysia)
├── test/                   # Integration & Unit Testing menggunakan Bun Test
├── .env                    # Variabel environment (Database URL, port)
├── drizzle.config.ts       # Konfigurasi Drizzle Kit
└── package.json            # Dependensi proyek
```

---

## 💾 Skema Database

Aplikasi menggunakan dua buah tabel utama yang direlasikan:

### 1. Tabel `users`
Menyimpan informasi identitas dan kredensial pengguna.
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR 255, Not Null)
- `email` (VARCHAR 255, Not Null, Unique)
- `password` (VARCHAR 255, Not Null) - *disimpan dalam bentuk hash bcrypt*
- `created_at` (TIMESTAMP, Not Null, Default Now)

### 2. Tabel `sessions`
Menyimpan token sesi pengguna yang sedang aktif (berhasil login).
- `id` (INT, Primary Key, Auto Increment)
- `token` (VARCHAR 255, Not Null) - *UUID token yang digenerate sistem*
- `user_id` (INT, Not Null) - *Foreign Key ke `users.id` (On Delete Cascade)*
- `created_at` (TIMESTAMP, Not Null, Default Now)

---

## 🌐 API yang Tersedia

> **Base URL:** `http://localhost:3000`

| Endpoint | Method | Keterangan | Header Auth | Body Request (JSON) |
| :--- | :--- | :--- | :--- | :--- |
| `/api/users` | `POST` | Registrasi pengguna baru | Tidak | `name`, `email`, `password` |
| `/api/login` | `POST` | Autentikasi dan dapatkan token | Tidak | `email`, `password` |
| `/api/current`| `GET` | Dapatkan detail profil saat ini | **Ya (Bearer)** | - |
| `/api/logout` | `DELETE`| Akhiri sesi (Hapus token) | **Ya (Bearer)** | - |

> *Catatan: Untuk Endpoint yang mensyaratkan `Header Auth`, gunakan header: `Authorization: Bearer <token_dari_login>`.*

---

## 🚀 Cara Setup Project

1. **Clone repository ini**
2. **Install Dependensi** (Pastikan sudah menginstal Bun)
   ```bash
   bun install
   ```
3. **Konfigurasi Environment Variables**
   Buat atau modifikasi file `.env` di root direktori dan sesuaikan parameter koneksi database Anda:
   ```env
   PORT=3000
   DATABASE_URL=mysql://root:@localhost:3306/belajar_vibe_coding
   ```
4. **Siapkan Database (Drizzle Push)**
   Jalankan perintah ini untuk melakukan sinkronisasi skema tabel secara otomatis ke MySQL Anda:
   ```bash
   bun run db:push
   ```

---

## ▶️ Cara Run Aplikasi

Aplikasi memiliki dua mode jalan:

1. **Mode Development (Hot-Reloading aktif):**
   ```bash
   bun run dev
   ```
2. **Mode Production:**
   ```bash
   bun run start
   ```
   
Secara default, server Elysia akan berjalan di `http://localhost:3000`.

---

## 🧪 Cara Test Aplikasi

Aplikasi ini sudah dipasangi 15+ Integration dan Unit Tests untuk memastikan setiap komponen API berfungsi sempurna dan menghindari regresi, divalidasi menggunakan *framework* test bawaan Bun.

Untuk menjalankan seluruh tes:
```bash
bun test
```

*(Catatan: Saat menjalankan perintah di atas, skenario tes secara otomatis akan membersihkan [wipe] data terkait di tabel database agar hasil tes selalu konsisten dan dapat diprediksi).*

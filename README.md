# Belajar Vibe Coding - ElysiaJS + Drizzle + MySQL

Proyek backend menggunakan **Bun**, **ElysiaJS**, dan **Drizzle ORM** dengan database **MySQL**.

## 🛠️ Tech Stack
- **Runtime:** [Bun](https://bun.sh)
- **Web Framework:** [ElysiaJS](https://elysiajs.com)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Database:** MySQL (driver: `mysql2`)

---

## 🚀 Memulai Proyek

### 1. Salin Environment File
```bash
cp .env.example .env
```
Sesuaikan variabel `DATABASE_URL` di file `.env` dengan kredensial database MySQL Anda.

### 2. Jalankan Migrasi Database
Untuk men-generate file migrasi:
```bash
bun run db:generate
```
Untuk mengaplikasikan migrasi langsung ke database (push):
```bash
bun run db:push
```

### 3. Menjalankan Server
Mode Development (auto-reload):
```bash
bun run dev
```

Mode Production:
```bash
bun run start
```

---

## 📡 API Endpoints

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/` | Health check route (`{ "message": "Hello Elysia" }`) |
| `GET` | `/users` | Mengambil daftar semua user dari database MySQL |
| `POST` | `/users` | Menambahkan user baru (Body: `{ "name": string, "email": string }`) |

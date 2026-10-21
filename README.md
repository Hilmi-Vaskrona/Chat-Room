# Website Chat Room — Tugas Project Kelas 12

Aplikasi web percakapan grup realtime modern yang dibangun menggunakan **Next.js (TypeScript + Tailwind CSS)** pada frontend dan **NestJS (TypeScript + TypeORM)** pada backend dengan database **PostgreSQL di Supabase** serta komunikasi realtime melalui **Socket.IO WebSocket Gateway**.

Proyek ini memenuhi seluruh **9 Fitur Wajib** dan arsitektur yang dirancang pada dokumen tugas serta Product Requirements Document (PRD).

---

## 1. Tech Stack & Arsitektur

| Bagian | Teknologi | Tanggung Jawab |
|---|---|---|
| **Frontend** | Next.js 16 (App Router) + TypeScript | Antarmuka pengguna responsif & interaktif |
| **Styling** | Tailwind CSS + Lucide Icons | Desain modern, sleek dark mode & glassmorphism |
| **Backend** | NestJS + TypeScript | REST API, Business Logic, WebSocket Gateway |
| **Database** | PostgreSQL di Supabase | Penyimpanan relasional terstruktur |
| **ORM** | TypeORM | Pemetaan relasi dan akses database |
| **Realtime** | NestJS WebSocket Gateway + Socket.IO | Pengiriman pesan realtime tanpa polling |
| **Autentikasi** | JWT (JSON Web Token) + Passport | Otentikasi stateless untuk REST & WebSocket |
| **Keamanan Password**| bcrypt | Hash password dengan salt 10 rounds |
| **Validasi Input**| class-validator & class-transformer | Validasi DTO ketat dengan `ValidationPipe` |

### Diagram Komunikasi

```text
Browser (Next.js)
  ├── REST API / HTTPS ──────────┐
  │   (Auth, Profil, Kontak,     │
  │    Grup, Riwayat Pesan)      v
  └── WebSocket / Socket.IO ──> NestJS Backend
      (joinGroup, sendMessage,       │
       newMessage, mention)          v
                                  TypeORM
                                     │
                                     v
                           Supabase PostgreSQL
```

---

## 2. Fitur yang Telah Selesai (9 Fitur Wajib)

1. **Register Akun (`/register`):**
   - Validasi ketat: username unik tanpa spasi, email unik, password minimal 6 karakter.
   - Password di-hash menggunakan `bcrypt`.
   - Akun baru otomatis berstatus user biasa.
2. **Login & Logout (`/login`):**
   - Login menggunakan username atau email dan password.
   - Menghasilkan token JWT yang disimpan dengan aman di client.
   - Proteksi halaman: pengguna belum login diarahkan ke `/login`.
   - Logout membersihkan token dan sesi client.
3. **Profil Pengguna (`/profile`):**
   - Melihat username, nama tampilan, email, bio, dan tanggal bergabung.
   - Mengubah nama tampilan dan bio (username bersifat permanen).
   - Profil orang lain bersifat read-only. `password_hash` tidak pernah dikirim ke client.
4. **Buku Kontak (`/contacts`):**
   - Pencarian instan (debounced) berdasarkan username.
   - Menambahkan user ke dalam kontak (satu arah per `owner_id`).
   - Validasi: dilarang menambah diri sendiri dan dilarang duplikasi kontak.
5. **Manajemen Grup (`/home`):**
   - Pembuatan grup baru: pembuat grup otomatis dicatat sebagai anggota dan menjadi **Admin**.
   - Daftar grup yang diikuti muncul di beranda dengan info jumlah anggota dan role.
6. **Pesan Realtime WebSocket (`/groups/[groupId]`):**
   - Riwayat pesan dimuat secara kronologis melalui REST API.
   - Pesan baru dikirim melalui WebSocket dan **disimpan ke database PostgreSQL terlebih dahulu** sebelum disiarkan ke anggota room (`newMessage`).
   - Non-anggota ditolak mengakses room dan riwayat (403 Forbidden).
   - Indikator status realtime WebSocket (Hijau: Terhubung / Kuning: Menyambung).
7. **Tautan Undangan Grup (`/invite/[code]`):**
   - Dibuat khusus oleh Admin grup dengan kode unik acak dan masa kedaluwarsa.
   - Preview info grup sebelum bergabung.
   - Pengguna bergabung otomatis menjadi anggota biasa (`member`).
   - Idempotent: jika sudah bergabung, tidak membuat data keanggotaan ganda.
8. **Mention `@username`:**
   - Auto-suggest anggota grup saat mengetik karakter `@` pada kolom chat.
   - Validasi backend: target mention wajib merupakan anggota aktif grup terkait.
   - Notifikasi mention pada navbar bell dan penanda visual sorotan kuning/emas pada pesan jika user ditandai.
9. **Kelola Admin Grup:**
   - Daftar anggota grup menampilkan badge **Admin** atau **Anggota**.
   - Tombol **Jadikan Admin** hanya terlihat oleh Admin untuk anggota biasa.
   - Backend memvalidasi hak akses Admin (`403 Forbidden` jika bukan admin grup tersebut).

---

## 3. Keputusan Aturan Bisnis (10 Keputusan PRD)

1. **Hak Pembuatan Undangan:** Hanya admin grup yang dapat men-generate tautan undangan.
2. **Anti-Duplikasi Membership:** Membuka tautan undangan ketika sudah menjadi anggota tidak membuat membership baru.
3. **Status Undangan:** Undangan memiliki flag `is_active` dan masa kedaluwarsa opsional (`expires_at`).
4. **Role Pengangkatan Admin:** Admin dapat mempromosikan anggota biasa menjadi admin. Fitur menurunkan admin belum termasuk versi wajib.
5. **Kepemilikan Grup:** Pembuat grup selalu tercatat sebagai admin dan anggota di `group_members`.
6. **Validasi Mention:** Mention ke non-anggota grup ditolak oleh sistem.
7. **Batas Pesan:** Pesan maksimal 2.000 karakter; pesan kosong/whitespace ditolak.
8. **Relasi Kontak:** Kontak bersifat satu arah (`owner_id` menyimpan pemilik daftar).
9. **Mekanisme Logout:** Logout versi awal menghapus token dari penyimpanan client dan memutus socket.
10. **Role Bersifat Per Grup:** Seorang pengguna bisa menjadi Admin di satu grup, namun menjadi Anggota biasa di grup lain.

---

## 4. Struktur Folder Proyek

```text
Chat-Room/
├── backend/
│   ├── src/
│   │   ├── auth/              # Modul Register, Login, JWT, Bcrypt
│   │   ├── users/             # Modul Profil dan Pencarian User
│   │   ├── contacts/          # Modul Buku Kontak
│   │   ├── groups/            # Modul Grup, Keanggotaan, Role, dan Undangan
│   │   ├── messages/          # Modul Penyimpanan & Riwayat Pesan
│   │   ├── mentions/          # Modul Mention & Notifikasi
│   │   ├── websocket/         # NestJS Socket.IO Gateway (ChatGateway)
│   │   ├── entities/          # TypeORM Entities (User, Group, Message, dll.)
│   │   ├── common/            # Guards, Decorators, Filters
│   │   ├── app.module.ts      # Root Module & TypeORM Configuration
│   │   └── main.ts            # Entrypoint Backend (CORS, Pipes, Port)
│   ├── supabase-schema.sql    # Skrip SQL untuk Supabase Editor
│   ├── .env.example           # Template environment variable backend
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── login/             # Halaman Login
│   │   ├── register/          # Halaman Registrasi
│   │   ├── home/              # Halaman Dashboard Beranda & Daftar Grup
│   │   ├── contacts/          # Halaman Buku Kontak
│   │   ├── profile/           # Halaman Profil Saya
│   │   ├── groups/[groupId]/  # Ruang Chat Realtime & Info Anggota
│   │   ├── invite/[code]/     # Halaman Preview & Gabung Undangan
│   │   ├── layout.tsx         # Root Layout dengan AuthProvider
│   │   └── page.tsx           # Landing Page
│   ├── components/
│   │   └── Navbar.tsx         # Navigasi & Notifikasi Mention Dropdown
│   ├── lib/
│   │   ├── api.ts             # API Client Wrapper
│   │   ├── socket.ts          # Socket.IO Client Wrapper
│   │   └── auth-context.tsx   # React Auth Context & State Hook
│   ├── .env.local.example     # Template environment variable frontend
│   └── package.json
├── prd.md                     # Product Requirements Document
├── pdf.md                     # Transkrip Dokumen Tugas
├── .gitignore
└── README.md
```

---

## 5. Cara Menjalankan Proyek Secara Lokal

### Prasyarat
- **Node.js** v18+ atau v20+ (rekomendasi LTS)
- **Database PostgreSQL** (proyek baru di [Supabase](https://supabase.com) atau PostgreSQL lokal)

---

### Langkah 1: Siapkan Database di Supabase
1. Buka dashboard [Supabase](https://app.supabase.com) dan buat project baru.
2. Buka menu **SQL Editor** -> **New Query**.
3. Salin seluruh isi file [`backend/supabase-schema.sql`](file:///d:/MyCode/Chat-Room/backend/supabase-schema.sql) dan jalankan (**Run**).
4. Buka **Project Settings** -> **Database** -> bagian **Connection string** (URI/Node.js). Salin connection string tersebut.

---

### Langkah 2: Konfigurasi & Jalankan Backend
1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Buat file `.env` (atau salin dari `.env.example`):
   ```env
   NODE_ENV=development
   PORT=3001
   DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require"
   JWT_SECRET="chat_room_super_secret_jwt_key_at_least_32_characters"
   JWT_EXPIRES_IN="1d"
   FRONTEND_URL="http://localhost:3000"
   ```
   *(Ganti `DATABASE_URL` dengan connection string dari Supabase Anda)*.
3. Jalankan server backend:
   ```bash
   npm run start:dev
   ```
   Server backend akan berjalan di `http://localhost:3001`.

---

### Langkah 3: Konfigurasi & Jalankan Frontend
1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend
   ```
2. Buat file `.env.local` (atau salin dari `.env.local.example`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   ```
3. Jalankan frontend Next.js:
   ```bash
   npm run dev
   ```
4. Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 6. Daftar Endpoint REST API

Semua endpoint diawali dengan prefix `/api`.

| Kategori | Method | Endpoint | Hak Akses | Deskripsi |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Publik | Registrasi akun baru |
| **Auth** | `POST` | `/api/auth/login` | Publik | Login & mendapatkan JWT token |
| **Auth** | `POST` | `/api/auth/logout` | Login | Logout sesi |
| **Users** | `GET` | `/api/users/me` | Login | Mendapatkan profil akun login |
| **Users** | `PATCH` | `/api/users/me` | Login | Mengubah nama tampilan & bio |
| **Users** | `GET` | `/api/users/search?username=...` | Login | Mencari user berdasarkan username |
| **Users** | `GET` | `/api/users/:id` | Login | Melihat profil publik user |
| **Contacts**| `GET` | `/api/contacts` | Login | Melihat daftar kontak |
| **Contacts**| `POST` | `/api/contacts` | Login | Menambahkan user ke kontak |
| **Contacts**| `DELETE`| `/api/contacts/:id` | Login | Menghapus user dari kontak |
| **Groups** | `POST` | `/api/groups` | Login | Membuat grup baru (pembuat = admin) |
| **Groups** | `GET` | `/api/groups` | Login | Mendapatkan daftar grup yang diikuti |
| **Groups** | `GET` | `/api/groups/:id` | Anggota | Mendapatkan detail grup & role user |
| **Groups** | `PATCH` | `/api/groups/:id` | Admin Grup | Mengubah nama grup |
| **Groups** | `GET` | `/api/groups/:id/members` | Anggota | Mendapatkan daftar anggota grup |
| **Groups** | `PATCH` | `/api/groups/:id/members/:userId/role` | Admin Grup | Mengangkat anggota menjadi Admin |
| **Groups** | `POST` | `/api/groups/:id/invite` | Admin Grup | Membuat kode tautan undangan |
| **Invite** | `GET` | `/api/invite/:code` | Publik | Preview informasi undangan grup |
| **Invite** | `POST` | `/api/invite/:code/join` | Login | Bergabung ke grup via kode |
| **Messages**| `GET` | `/api/groups/:id/messages` | Anggota | Mengambil riwayat pesan grup |
| **Mentions**| `GET` | `/api/mentions` | Login | Mendapatkan daftar mention pengguna |
| **Mentions**| `PATCH` | `/api/mentions/:id/read` | Pemilik | Menandai mention sudah dibaca |

---

## 7. Event Realtime WebSocket (Socket.IO)

Koneksi socket mengirim token melalui `auth: { token: 'JWT_TOKEN' }`.

### Event Client -> Server
- `joinGroup`: `{ "groupId": "uuid" }` — Memvalidasi status keanggotaan lalu memasukkan socket ke room `group:<groupId>`.
- `leaveGroup`: `{ "groupId": "uuid" }` — Keluar dari room grup.
- `sendMessage`: `{ "groupId": "uuid", "content": "Halo semua", "mentions": ["uuid"] }` — Validasi, simpan ke database PostgreSQL, lalu siarkan ke room.

### Event Server -> Client
- `newMessage`: Mengirim pesan tersimpan (beserta data pengirim dan mention) ke semua anggota di room.
- `mention`: Mengirim notifikasi langsung ke user yang di-tag.
- `socketError`: Mengirim pesan error aman jika ada aksi yang ditolak.

---

## 8. Panduan Pengujian & Demo Aplikasi

Untuk menguji fitur secara end-to-end:

1. **Buka 2 Jendela Browser Berbeda** (misalnya Chrome biasa dan Chrome Incognito).
2. **Akun Pertama (Browser A):**
   - Buka `http://localhost:3000/register`.
   - Daftarkan akun: `username: admin_andi`, `display_name: Andi Pratama`.
   - Masuk ke Beranda, klik **Buat Grup Baru** dengan nama `Grup Diskusi RPL`.
   - Buka grup tersebut, klik **Undang** dan salin tautan undangan yang dihasilkan.
3. **Akun Kedua (Browser B):**
   - Buka `http://localhost:3000/register`.
   - Daftarkan akun: `username: budi_santoso`, `display_name: Budi Santoso`.
   - Buka tautan undangan yang disalin dari Browser A (contoh: `http://localhost:3000/invite/xxx`).
   - Klik **Gabung ke Grup Ini**. Budi akan otomatis masuk sebagai Anggota biasa.
4. **Uji Chat Realtime & Mention:**
   - Di Browser A, ketik pesan dan ketik `@` -> pilih `@budi_santoso` dari saran popup -> kirim.
   - Di Browser B, pesan langsung muncul secara realtime tanpa refresh halaman. Pesan Budi memiliki penanda khusus "Anda ditandai dalam pesan ini" dan ikon bel di navbar akan menampilkan angka unread mention!
   - Refresh kedua browser -> pesan tetap tersimpan dari database PostgreSQL.
5. **Uji Otorisasi Role Admin:**
   - Di Browser A (Andi - Admin), buka **Info Grup** -> terlihat tombol **Jadikan Admin** pada baris Budi.
   - Di Browser B (Budi - Anggota), buka **Info Grup** -> tombol Ubah Nama dan Jadikan Admin tidak tersedia.
   - Klik **Jadikan Admin** di Browser A -> status Budi berubah menjadi Admin!
6. **Uji Buku Kontak:**
   - Buka menu **Kontak** di Browser B, cari username `admin_andi`, klik **Tambah Kontak**.
   - Andi berhasil tersimpan di daftar kontak personal Budi.

---

## 9. Rencana Deployment Production

1. **Supabase PostgreSQL:**
   - Skrip SQL telah siap di [`backend/supabase-schema.sql`](file:///d:/MyCode/Chat-Room/backend/supabase-schema.sql).
2. **Deploy Backend (Railway / Render):**
   - Root directory: `backend/`
   - Build Command: `npm run build`
   - Start Command: `npm run start:prod`
   - Environment Variables: `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`.
3. **Deploy Frontend (Vercel):**
   - Root directory: `frontend/`
   - Framework preset: Next.js
   - Environment Variables: `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_SOCKET_URL` diarahkan ke URL backend production.

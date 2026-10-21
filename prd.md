# PRD — Website Chat Room Kelas 12

**Versi:** 1.0  
**Tanggal:** 21 Oktober 2026

## 1. Ringkasan

Website Chat Room adalah aplikasi chat grup berbasis web. Pengguna dapat register/login, mengatur profil, menambah kontak berdasarkan username, membuat grup, bergabung melalui link undangan, mengirim pesan realtime, men-tag anggota dengan `@username`, dan mengelola admin grup.

### Tujuan
- Memenuhi sembilan fitur wajib pada PDF tugas Website Chat Room Kelas 12.
- Menerapkan REST API, WebSocket, autentikasi JWT, otorisasi per grup, dan database relasional.
- Menyimpan pesan ke database sebelum menyiarkannya ke anggota grup.
- Membuat aplikasi yang dapat diuji, dipresentasikan, dan di-deploy.

## 2. Tech Stack dan Arsitektur

| Bagian | Teknologi | Tanggung jawab |
|---|---|---|
| Frontend | Next.js + TypeScript | UI dan interaksi pengguna |
| Styling | Tailwind CSS | Tampilan responsif |
| Backend | NestJS + TypeScript | REST API dan aturan bisnis |
| Database | PostgreSQL di Supabase | Penyimpanan data |
| ORM | TypeORM | Akses PostgreSQL |
| Realtime | NestJS WebSocket Gateway + Socket.IO | Chat realtime |
| Auth | JWT | Identitas pengguna |
| Password | bcrypt | Hash password |
| Validasi | class-validator | Validasi DTO |
| Uji API | Postman/Thunder Client | Pengujian endpoint |
| Git | GitHub | Version control |
| Hosting frontend | Vercel | Next.js |
| Hosting backend | Railway atau Render | NestJS + Socket.IO |

```text
Browser
  ├── REST API / HTTPS ──────────┐
  └── WebSocket / Socket.IO ─────┤
                                 v
                      NestJS backend
                                 |
                            TypeORM
                                 |
                                 v
                       Supabase PostgreSQL
```

**Penting soal Supabase:** karena proyek ini menggunakan TypeORM, backend tersambung langsung ke PostgreSQL memakai `DATABASE_URL` dari Supabase. Supabase `anon`/publishable API key bukan pengganti connection string database. Frontend hanya berkomunikasi dengan backend NestJS. Jangan pernah memasukkan `DATABASE_URL`, password database, JWT secret, atau Supabase secret/service-role key ke frontend atau repository GitHub. API key Supabase tidak wajib dipakai untuk query database TypeORM.

## 3. Peran dan Hak Akses

### User biasa
- Mengatur profil sendiri.
- Mencari dan menambah kontak.
- Membuat grup.
- Bergabung ke grup melalui link undangan.
- Membaca/mengirim pesan dan men-tag anggota pada grup yang diikuti.
- Melihat daftar anggota grup.

### Anggota grup
Dapat membaca pesan, mengirim pesan realtime, melihat anggota, dan men-tag anggota grup. Tidak dapat mengubah nama grup, membuat undangan (sesuai keputusan proyek), atau menjadikan orang lain admin.

### Admin grup
Dapat melakukan semua tindakan anggota, serta membuat link undangan, mengubah nama grup, dan menjadikan anggota lain admin. Role admin hanya berlaku di grup tertentu.

### Aturan keamanan
- Semua akun baru berperan sebagai user biasa.
- Pembuat grup otomatis menjadi anggota dan admin grup tersebut.
- Backend wajib memeriksa JWT, membership, dan role pada setiap operasi terkait grup.
- WebSocket wajib memverifikasi token dan membership sebelum pengguna bergabung ke room.
- Menyembunyikan tombol di frontend bukan pengganti otorisasi backend.

## 4. Fitur Fungsional

### 4.1 Register
Form berisi username, nama tampilan, email, dan password. Username dan email unik; username tidak boleh berisi spasi. Password di-hash dengan bcrypt. Akun baru selalu menjadi user biasa. Username/email duplikat menghasilkan `409`; input invalid menghasilkan `400`.

### 4.2 Login dan logout
Login menggunakan username atau email dan password. Backend mengembalikan JWT setelah password cocok. Request terlindungi memakai `Authorization: Bearer <token>` (atau cookie jika arsitektur cookie dipilih). Halaman chat memerlukan login. Logout versi awal menghapus token di frontend; revokasi token server dapat ditambahkan kemudian.

**Pilihan penyimpanan token:** utamakan cookie `HttpOnly`, `Secure` saat production, dan `SameSite` yang sesuai. Jika memakai `localStorage` untuk versi awal, dokumentasikan risikonya.

### 4.3 Profil
Menampilkan username, nama tampilan, dan bio. User dapat mengubah nama tampilan dan bio miliknya sendiri. Username dibuat tetap pada versi awal. Profil user lain bersifat read-only. `password_hash` tidak boleh dikirim ke frontend.

### 4.4 Kontak
User mencari akun dengan username, melihat profil singkat, lalu menambahkannya sebagai kontak. Tidak boleh menambah diri sendiri atau membuat kontak duplikat. Kontak bersifat satu arah: pemilik daftar disimpan di `owner_id`.

### 4.5 Grup
User login dapat membuat grup dengan nama yang tidak kosong. Setelah grup dibuat, backend memasukkan pembuat ke `group_members` sebagai `admin`. Daftar grup yang diikuti muncul di beranda.

### 4.6 Pesan realtime
Hanya anggota grup yang dapat membaca/mengirim pesan. Riwayat dimuat melalui REST API. Pesan baru dikirim melalui WebSocket, disimpan ke database, lalu disiarkan. Pesan menampilkan pengirim, isi, dan waktu. Pesan bertahan setelah refresh. Pesan kosong/whitespace ditolak. Panjang maksimum awal adalah 2.000 karakter. `sender_id` diambil dari JWT, bukan dipercaya dari payload client.

### 4.7 Link undangan
Hanya admin yang dapat membuat undangan. Kode undangan harus acak dan unik, serta bisa dinonaktifkan atau kedaluwarsa. User harus login sebelum bergabung. User yang bergabung melalui undangan menjadi anggota biasa. Jika sudah menjadi anggota, join ulang tidak membuat membership duplikat.

### 4.8 Mention
Input pesan menyarankan anggota saat pengguna mengetik `@`. Backend memastikan target mention adalah anggota grup. Mention disimpan di tabel `mentions`, ditampilkan dengan gaya visual berbeda, dan menampilkan penanda untuk user yang di-mention. Notifikasi saat grup tidak dibuka merupakan bonus.

### 4.9 Kelola admin
Daftar anggota menunjukkan label Admin/Anggota. Admin melihat tombol “Jadikan Admin” untuk anggota biasa. Endpoint tetap memeriksa role di backend; anggota biasa mendapat `403 Forbidden`.

## 5. Keputusan Aturan Bisnis

1. Undangan hanya bisa dibuat admin.
2. Join ulang ke grup yang sama tidak membuat membership baru.
3. Undangan dapat dinonaktifkan dan mempunyai masa kedaluwarsa opsional.
4. Fitur menurunkan admin belum termasuk versi wajib.
5. Pembuat grup tetap admin; fitur keluar grup belum termasuk versi wajib.
6. Mention ke non-anggota ditolak.
7. Panjang pesan maksimum 2.000 karakter; pesan kosong ditolak.
8. Kontak satu arah.
9. Logout versi awal menghapus token dari frontend; revokasi token server opsional.
10. Keputusan ini dicatat kembali dalam `README.md`.

## 6. Rancangan Database

Tujuh tabel inti mengikuti saran PDF tugas.

- **`users`**: `id`, `username`, `display_name`, `email`, `password_hash`, `bio`, `created_at`, `updated_at`. Username dan email unik.
- **`contacts`**: `id`, `owner_id`, `contact_user_id`, `created_at`. Pasangan pemilik/kontak unik; tidak boleh menambahkan diri sendiri.
- **`groups`**: `id`, `name`, `created_by`, `created_at`, `updated_at`.
- **`group_members`**: `id`, `group_id`, `user_id`, `role`, `joined_at`. Role `admin` atau `member`; pasangan grup/user unik.
- **`invite_links`**: `id`, `group_id`, `code`, `created_by`, `created_at`, `is_active`, `expires_at`.
- **`messages`**: `id`, `group_id`, `sender_id`, `content`, `created_at`.
- **`mentions`**: `id`, `message_id`, `mentioned_user_id`, `is_read`, `created_at`.

Relasi: user memiliki banyak kontak dan pesan; grup memiliki banyak anggota, pesan, dan undangan; hubungan user-grup menggunakan `group_members`; pesan dapat memiliki banyak mention.

## 7. SQL Supabase

Buka proyek Supabase → **SQL Editor** → **New query**, tempel SQL berikut, lalu jalankan. Cocok untuk database baru; pastikan tidak ada tabel dengan nama sama yang ingin dipertahankan.

```sql
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username varchar(30) not null unique,
  display_name varchar(80) not null,
  email varchar(255) not null unique,
  password_hash text not null,
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_username_no_spaces check (username !~ '\\s'),
  constraint users_username_not_blank check (length(trim(username)) > 0),
  constraint users_display_name_not_blank check (length(trim(display_name)) > 0)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  contact_user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint contacts_not_self check (owner_id <> contact_user_id),
  constraint contacts_owner_contact_unique unique (owner_id, contact_user_id)
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint groups_name_not_blank check (length(trim(name)) > 0)
);

create table if not exists public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role varchar(10) not null default 'member',
  joined_at timestamptz not null default now(),
  constraint group_members_role_check check (role in ('admin', 'member')),
  constraint group_members_unique unique (group_id, user_id)
);

create table if not exists public.invite_links (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  code varchar(100) not null unique,
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  expires_at timestamptz null,
  constraint invite_links_code_not_blank check (length(trim(code)) > 0)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete restrict,
  content varchar(2000) not null,
  created_at timestamptz not null default now(),
  constraint messages_content_not_blank check (length(trim(content)) > 0)
);

create table if not exists public.mentions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  mentioned_user_id uuid not null references public.users(id) on delete cascade,
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint mentions_message_user_unique unique (message_id, mentioned_user_id)
);

create index if not exists idx_contacts_owner_id on public.contacts(owner_id);
create index if not exists idx_contacts_contact_user_id on public.contacts(contact_user_id);
create index if not exists idx_groups_created_by on public.groups(created_by);
create index if not exists idx_group_members_user_id on public.group_members(user_id);
create index if not exists idx_group_members_group_id on public.group_members(group_id);
create index if not exists idx_invite_links_group_id on public.invite_links(group_id);
create index if not exists idx_messages_group_created on public.messages(group_id, created_at);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_mentions_user_read on public.mentions(mentioned_user_id, is_read);
create index if not exists idx_mentions_message_id on public.mentions(message_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_groups_updated_at on public.groups;
create trigger trg_groups_updated_at
before update on public.groups
for each row execute function public.set_updated_at();
```

### Catatan SQL
SQL ini membuat tabel, constraint, index, dan trigger `updated_at`. SQL tidak membuat akun aplikasi otomatis; register dilakukan oleh NestJS. Backend wajib membuat grup dan membership admin secara konsisten. SQL juga tidak menggantikan pemeriksaan JWT, membership, atau role di backend.

## 8. Menghubungkan Supabase ke NestJS + TypeORM

### 8.1 Langkah di Supabase
1. Buat project Supabase.
2. Buka **SQL Editor** dan jalankan SQL pada bagian 7.
3. Buka bagian **Connect** atau database settings.
4. Salin connection string PostgreSQL yang sesuai untuk aplikasi Node.js.
5. Simpan rahasia database secara privat. Jangan kirim ke chat publik atau commit ke GitHub.

### 8.2 Environment backend (`backend/.env`)
```env
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
JWT_SECRET="GANTI_DENGAN_SECRET_RANDOM_PANJANG"
JWT_EXPIRES_IN="1d"
FRONTEND_URL="http://localhost:3000"
```
Ganti seluruh placeholder dengan nilai milik sendiri. Tambahkan `.env` ke `.gitignore`.

### 8.3 Environment frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```
URL production akan diganti dengan URL backend production. Variabel `NEXT_PUBLIC_` dapat diakses browser; jangan menaruh credential rahasia di sana.

### 8.4 Contoh konfigurasi TypeORM
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    }),
  ],
})
export class AppModule {}
```

Install driver `pg` dan integrasi TypeORM untuk NestJS. `synchronize: false` disarankan agar struktur production tidak berubah otomatis. Buat entity sesuai nama tabel/kolom SQL dan gunakan migration saat skema perlu diubah. Contoh SSL harus disesuaikan dengan konfigurasi koneksi/TLS yang direkomendasikan Supabase; jangan menonaktifkan validasi sertifikat tanpa memahami alasannya.

### 8.5 API key atau connection string?
- **TypeORM → PostgreSQL:** gunakan `DATABASE_URL`.
- **JWT aplikasi:** gunakan `JWT_SECRET`.
- **Supabase anon/publishable key:** tidak diperlukan untuk query langsung via TypeORM.
- **Supabase secret/service-role key:** jangan pernah taruh di frontend; hanya gunakan di backend bila memang ada kebutuhan memakai Supabase API/client.
- Jangan membuat frontend mengakses tabel langsung untuk fitur inti. Frontend mengakses NestJS API dan WebSocket.

## 9. Struktur Folder yang Disarankan

```text
website-chat-room/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── contacts/
│   │   ├── groups/
│   │   ├── group-members/
│   │   ├── invite-links/
│   │   ├── messages/
│   │   ├── mentions/
│   │   ├── websocket/
│   │   ├── common/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── home/
│   │   ├── contacts/
│   │   ├── profile/
│   │   ├── groups/[groupId]/
│   │   └── invite/[code]/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── package.json
├── README.md
├── PRD.md
└── .gitignore
```

## 10. REST API

Prefix disarankan `/api`. Semua endpoint kecuali register/login memerlukan autentikasi, kecuali jika dijelaskan sebaliknya.

| Fitur | Method & path | Hak akses |
|---|---|---|
| Register | `POST /api/auth/register` | Publik |
| Login | `POST /api/auth/login` | Publik |
| Logout | `POST /api/auth/logout` | Login, opsional untuk revokasi |
| Profil sendiri | `GET /api/users/me` | Login |
| Ubah profil | `PATCH /api/users/me` | Login |
| Cari user | `GET /api/users/search?username=...` | Login |
| Profil user lain | `GET /api/users/:id` | Login |
| Daftar kontak | `GET /api/contacts` | Login |
| Tambah kontak | `POST /api/contacts` | Login |
| Buat grup | `POST /api/groups` | Login |
| Daftar grup | `GET /api/groups` | Login |
| Detail grup | `GET /api/groups/:id` | Anggota grup |
| Ubah nama grup | `PATCH /api/groups/:id` | Admin grup |
| Daftar anggota | `GET /api/groups/:id/members` | Anggota grup |
| Jadikan admin | `PATCH /api/groups/:id/members/:userId/role` | Admin grup |
| Buat undangan | `POST /api/groups/:id/invite` | Admin grup |
| Gabung undangan | `POST /api/invite/:code/join` | Login |
| Riwayat pesan | `GET /api/groups/:id/messages?limit=50&before=...` | Anggota grup |
| Daftar mention | `GET /api/mentions` | Login |
| Tandai mention dibaca | `PATCH /api/mentions/:id/read` | Pemilik mention |

### Kode status
- `400`: input tidak valid.
- `401`: token hilang/tidak valid atau belum login.
- `403`: login berhasil tetapi tidak punya izin.
- `404`: data tidak ditemukan.
- `409`: username/email/kontak duplikat.
- `500`: error server; jangan bocorkan stack trace atau credential ke client.

Contoh response sukses:
```json
{
  "data": { "id": "uuid", "username": "contoh" },
  "message": "Berhasil"
}
```

## 11. WebSocket / Socket.IO

Client menghubungkan Socket.IO ke backend dan mengirim token melalui mekanisme autentikasi socket, misalnya `auth: { token }`. Server memverifikasi token dan mengambil identitas user dari token, bukan dari payload client.

### Event client → server

| Event | Payload contoh | Fungsi |
|---|---|---|
| `joinGroup` | `{ "groupId": "uuid" }` | Validasi membership lalu join room `group:<id>` |
| `leaveGroup` | `{ "groupId": "uuid" }` | Keluar dari room |
| `sendMessage` | `{ "groupId": "uuid", "content": "Halo", "mentions": ["uuid"] }` | Validasi, simpan pesan/mention, lalu broadcast |

### Event server → client

| Event | Fungsi |
|---|---|
| `newMessage` | Mengirim pesan yang sudah tersimpan ke anggota room |
| `mention` | Memberi penanda kepada user yang di-mention |
| `socketError` | Memberi error aman jika event ditolak |

### Urutan pengiriman pesan
1. Verifikasi JWT.
2. Validasi payload, panjang isi, dan konten.
3. Periksa keanggotaan grup.
4. Periksa bahwa setiap target mention adalah anggota grup.
5. Simpan pesan ke PostgreSQL.
6. Simpan data mention.
7. Setelah penyimpanan berhasil, broadcast `newMessage`.
8. Kirim event `mention` sesuai rancangan.

Jika penyimpanan gagal, jangan broadcast pesan seolah berhasil. Untuk deployment multi-instance, jangan mengandalkan state room dalam memori satu proses saja; jika diperlukan, evaluasi adapter Socket.IO lintas-instance dan dukungan hosting.

## 12. Halaman Frontend

Minimal delapan halaman:

1. **Register:** form pendaftaran.
2. **Login:** username/email dan password.
3. **Beranda:** daftar grup, tombol buat grup, navigasi kontak/profil, logout.
4. **Ruang Chat:** pesan, waktu, input pesan, saran `@tag`, status WebSocket.
5. **Info Grup/Anggota:** daftar anggota, role, aksi admin, buat/salin link undangan.
6. **Profil:** lihat/edit profil sendiri dan profil orang lain read-only.
7. **Kontak:** cari username, hasil pencarian, tambah kontak, daftar kontak.
8. **Gabung via Undangan:** memproses kode, meminta login jika diperlukan, mengarahkan ke grup.

Setiap halaman perlu punya loading state, empty state, error state, validasi form, dan tampilan responsif. Tampilkan pesan sendiri dan pesan anggota lain secara berbeda. Informasi grup dapat berupa halaman atau panel selama semua fungsi tetap tersedia.

## 13. Validasi dan Keamanan

- Gunakan DTO dan `ValidationPipe` dengan `whitelist: true` serta `transform: true`.
- Hash password menggunakan bcrypt; jangan pernah menyimpan password asli.
- Jangan mengirim `password_hash` ke frontend.
- Simpan JWT secret dan database URL di environment.
- Batasi CORS ke origin frontend yang diizinkan.
- Validasi UUID, username, email, nama grup, isi pesan, mention, dan kode undangan.
- Gunakan ORM dan hindari merangkai query dari input mentah.
- Periksa membership dan role di backend pada REST dan WebSocket.
- Tambahkan rate limit untuk login/register jika memungkinkan.
- Jangan commit `.env`, `.env.local`, atau credential.
- Jangan mengaktifkan `synchronize: true` di production.
- Bila tabel diakses langsung melalui Supabase Data API pada masa depan, evaluasi Row Level Security (RLS) dan policy semua tabel. Pada rancangan ini akses utama tetap melalui NestJS.

## 14. Tahapan Pengerjaan

### Tahap 1 — Persiapan dan database
Buat repository, backend NestJS, frontend Next.js, proyek Supabase, jalankan SQL, buat entity TypeORM, dan tes baca/tulis data.

**Kriteria selesai:** backend dapat membaca dan menyimpan data percobaan ke PostgreSQL.

### Tahap 2 — Akun
Implementasi register, login, bcrypt, JWT, guard, logout, halaman login/register, dan proteksi halaman.

**Kriteria selesai:** user dapat register/login/logout dan halaman terproteksi tidak bisa diakses tanpa login.

### Tahap 3 — Profil dan kontak
Implementasi profil sendiri, update profil, pencarian username, daftar kontak, dan tambah kontak.

**Kriteria selesai:** dua akun dapat mencari dan menambahkan akun sebagai kontak.

### Tahap 4 — Grup dan role
Implementasi create/list group, membership admin otomatis, daftar anggota, dan perubahan role.

**Kriteria selesai:** pembuat otomatis admin dan anggota biasa menerima `403` ketika mencoba mengangkat admin.

### Tahap 5 — Pesan realtime
Implementasi riwayat pesan, gateway, autentikasi socket, `joinGroup`, `sendMessage`, `newMessage`, serta UI chat.

**Kriteria selesai:** dua akun di browser berbeda dapat berkirim pesan tanpa refresh dan riwayat bertahan setelah refresh.

### Tahap 6 — Mention
Implementasi saran anggota, validasi mention di backend, simpan mention, dan tampilkan penanda.

**Kriteria selesai:** hanya anggota grup yang dapat di-mention.

### Tahap 7 — Link undangan
Implementasi pembuatan kode, validasi aktif/kedaluwarsa, join, anti-duplikasi, dan UI salin link.

**Kriteria selesai:** akun lain dapat bergabung melalui link valid sebagai anggota biasa.

### Tahap 8 — Uji, deploy, dokumentasi
Uji endpoint dan keamanan, deploy backend, set environment production, deploy frontend, dan lengkapi README.

**Kriteria selesai:** semua fitur wajib berfungsi dari domain production.

## 15. Deployment

Rencana deployment:
1. Buat database dan jalankan SQL di Supabase.
2. Deploy backend NestJS ke Railway atau Render.
3. Masukkan `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, dan `PORT` melalui dashboard hosting.
4. Uji endpoint REST dan WebSocket production.
5. Deploy frontend Next.js ke Vercel.
6. Set `NEXT_PUBLIC_API_URL` dan `NEXT_PUBLIC_SOCKET_URL` di Vercel ke URL backend production.
7. Sesuaikan CORS dan Socket.IO CORS dengan domain frontend.
8. Uji register sampai chat realtime dari domain production.

Backend NestJS + Socket.IO tradisional umumnya lebih mudah dijalankan di layanan server seperti Railway/Render. Dalam rencana ini Vercel digunakan untuk frontend. Jika backend hendak ditempatkan di Vercel, verifikasi kompatibilitas NestJS Gateway/Socket.IO dan batas runtime terlebih dahulu.

## 16. Rencana Pengujian

### Auth
- Register valid berhasil.
- Username/email duplikat menghasilkan `409`.
- Username berisi spasi ditolak.
- Password tersimpan sebagai hash.
- Password salah dan token invalid ditolak.

### Profil/kontak
- User hanya dapat mengubah profil sendiri.
- Tidak dapat menambah diri sendiri atau kontak duplikat.
- Username tidak ditemukan menghasilkan error yang jelas.

### Grup/otorisasi
- Pembuat grup otomatis admin.
- Non-anggota tidak bisa melihat anggota atau pesan.
- Non-admin tidak bisa mengubah nama grup, membuat undangan, atau mengangkat admin.
- Admin di satu grup tidak otomatis admin di grup lain.

### Chat/mention
- Dua browser bertukar pesan tanpa refresh.
- Pesan tersimpan setelah refresh.
- Non-anggota ditolak dari room dan pengiriman pesan.
- Pesan kosong atau lebih dari 2.000 karakter ditolak.
- Pesan tidak dibroadcast jika database gagal menyimpan.
- Mention hanya mengarah ke anggota grup.

### Undangan/deployment
- Link valid membuat membership sebagai anggota.
- Link salah, tidak aktif, atau kedaluwarsa ditolak.
- Join ulang tidak membuat membership duplikat.
- WebSocket bekerja pada domain production.
- Tidak ada secret di repository atau bundle frontend.

## 17. Kriteria Selesai dan Pengumpulan

- Sembilan fitur wajib dapat dipakai melalui UI.
- Password di-hash dan endpoint terproteksi.
- Membership dan role diperiksa backend.
- Pesan disimpan sebelum broadcast WebSocket.
- Riwayat pesan tetap ada setelah refresh.
- Link undangan dan mention bekerja.
- SQL dan relasi database tersedia.
- Backend dan frontend dapat dijalankan/deploy terpisah.
- README berisi cara menjalankan, stack, keputusan aturan bisnis, fitur selesai, dan panduan demo.
- Pengembang dapat menjelaskan cara backend memastikan user adalah admin pada grup tertentu.

## 18. Fitur Bonus (setelah fitur wajib selesai)

- Chat pribadi.
- Foto profil/foto grup.
- Mengeluarkan anggota.
- Menurunkan admin.
- Keluar grup.
- Edit/hapus pesan sendiri.
- Status online/typing.
- Notifikasi mention ketika grup tidak dibuka.
- Unread count.
- Mode gelap.
- Pencarian pesan.

## 19. Checklist

- [ ] Proyek NestJS dan Next.js dibuat.
- [ ] Supabase PostgreSQL siap dan SQL dijalankan.
- [ ] TypeORM tersambung ke database.
- [ ] Register/login/JWT/logout.
- [ ] Profil dan kontak.
- [ ] Membuat grup dan admin otomatis.
- [ ] Daftar anggota dan kelola role.
- [ ] Riwayat pesan.
- [ ] WebSocket `joinGroup`, `sendMessage`, `newMessage`.
- [ ] Mention `@username`.
- [ ] Link undangan.
- [ ] Uji hak akses dan kode status.
- [ ] Backend production siap.
- [ ] Frontend production siap.
- [ ] README dan demo siap.

## 20. Dasar Dokumen

Dokumen ini mengikuti PDF tugas “Tugas Project: Website Chat Room (Kelas 12)” untuk tech stack wajib, sembilan fitur, tujuh tabel inti, role per grup, contoh endpoint, halaman frontend, WebSocket, tahapan, dan pengujian. Pilihan Supabase PostgreSQL + TypeORM, contoh SQL, struktur folder, environment, keputusan aturan bisnis, serta deployment merupakan rancangan implementasi untuk proyek ini.

# PRD — Website Chat Room (Kelas 12)

> **Dokumen:** Product Requirements Document  
> **Sumber utama:** `Tugas Project: Website Chat Room (Kelas 12).pdf`  
> **Tujuan:** Menjabarkan kebutuhan produk, fitur, alur, hak akses, database, API, WebSocket, pengujian, dan kriteria pengumpulan secara lengkap berdasarkan dokumen tugas.  
> **Status:** Spesifikasi awal untuk implementasi. Keputusan yang pada dokumen sumber memang diserahkan kepada pengembang ditandai sebagai **[KEPUTUSAN PENGEMBANG]** dan harus dicatat di `README.md`.

---

## 1. Ringkasan Proyek

Website Chat Room adalah aplikasi percakapan berbasis web yang konsepnya menyerupai grup WhatsApp atau server Discord. Pengguna dapat membuat akun, mengatur profil, menambahkan kontak berdasarkan username, membuat grup, bergabung ke grup melalui tautan undangan, serta bertukar pesan secara realtime.

Setiap akun baru merupakan **user biasa**. Ketika pengguna membuat grup, pengguna tersebut otomatis menjadi **admin pada grup itu** sekaligus menjadi anggota grup. Hak admin bersifat **per grup**, bukan hak administrator global aplikasi. Admin dapat menjadikan anggota lain sebagai admin.

### 1.1 Tujuan

1. Membangun aplikasi chat room berbasis web dengan alur pengguna yang jelas.
2. Menerapkan autentikasi register, login, logout, dan perlindungan halaman.
3. Membuat REST API menggunakan NestJS dan menghubungkannya ke database.
4. Menggunakan WebSocket untuk komunikasi pesan realtime tanpa polling.
5. Merancang relasi data pengguna, kontak, grup, anggota grup, undangan, pesan, dan mention.
6. Menerapkan otorisasi berbasis peran di backend.
7. Menghubungkan antarmuka Next.js dengan backend.
8. Melatih pengerjaan proyek secara bertahap, pengujian, Git, dan dokumentasi.

### 1.2 Ruang Lingkup Utama

- Akun dan autentikasi.
- Profil pengguna.
- Kontak berdasarkan username.
- Pembuatan dan daftar grup.
- Keanggotaan dan peran admin grup.
- Pesan grup yang tersimpan di database dan dikirim realtime.
- Tautan undangan grup.
- Mention anggota menggunakan `@username`.
- Daftar anggota dan pengangkatan admin.
- Pengujian keamanan dasar dan dokumentasi proyek.

### 1.3 Di Luar Fitur Wajib

Fitur bonus seperti chat pribadi, foto profil, foto grup, mengeluarkan anggota, mengubah/menghapus pesan, status online/mengetik, pesan belum dibaca, mode gelap, dan pencarian pesan **bukan prioritas awal**. Fitur tersebut hanya dikerjakan setelah semua fitur wajib selesai dan diuji.

---

## 2. Target Pengguna dan Peran

### 2.1 Pengguna

Target pengguna adalah siapa pun yang membuat akun untuk berkomunikasi dalam grup. Semua akun baru otomatis memiliki role global `user`.

### 2.2 Peran dan cakupannya

1. **User yang bukan anggota grup:** pengguna login yang belum menjadi anggota grup tertentu.
2. **Anggota grup (`member`):** pengguna yang terdaftar sebagai anggota pada grup tertentu.
3. **Admin grup (`admin`):** anggota yang membuat grup tersebut atau diangkat oleh admin lain pada grup itu.

Peran `admin` dan `member` disimpan pada keanggotaan grup. Satu pengguna bisa menjadi admin di satu grup dan anggota biasa di grup lain.

### 2.3 Matriks hak akses

| Aksi | Bukan anggota grup | Anggota biasa | Admin grup |
|---|---:|---:|---:|
| Membuat grup baru | Ya, jika login | Ya, jika login | Ya, jika login |
| Bergabung lewat link undangan | Ya, jika login | — | — |
| Membaca pesan grup | Tidak | Ya | Ya |
| Mengirim pesan grup | Tidak | Ya | Ya |
| Men-tag anggota grup | Tidak | Ya | Ya |
| Melihat daftar anggota | Tidak | Ya | Ya |
| Membuat/membagikan link undangan | Tidak | **[KEPUTUSAN PENGEMBANG]** | Ya |
| Menjadikan anggota sebagai admin | Tidak | Tidak | Ya |
| Mengubah nama grup | Tidak | Tidak | Ya |

Backend wajib memeriksa izin pada setiap endpoint dan koneksi/event WebSocket yang relevan. Menyembunyikan tombol pada frontend saja tidak cukup.

---

## 3. Tech Stack dan Arsitektur

### 3.1 Stack wajib

| Bagian | Teknologi | Tanggung jawab |
|---|---|---|
| Backend | NestJS + TypeScript | REST API, autentikasi, otorisasi, logika bisnis, WebSocket gateway |
| Frontend | Next.js; TypeScript disarankan | Halaman aplikasi, formulir, daftar grup/kontak, ruang chat, interaksi pengguna |
| Database | Bebas | Menyimpan akun, kontak, grup, anggota, undangan, pesan, dan mention |
| API biasa | REST API dengan JSON | Operasi data selain pengiriman pesan realtime |
| Chat realtime | WebSocket | Mengirim dan menerima pesan tanpa refresh/polling |
| Autentikasi | JWT disarankan | Token dikirim melalui header `Authorization` pada request yang memerlukannya |

Database boleh menggunakan PostgreSQL, MySQL, MongoDB, atau SQLite untuk belajar. ORM seperti Prisma, TypeORM, atau Mongoose disarankan, tetapi bukan kewajiban.

### 3.2 Rekomendasi implementasi teknis dari dokumen tugas

- Gunakan `bcrypt` untuk hash password; jangan menyimpan password asli.
- Gunakan `class-validator` untuk validasi input backend.
- Untuk WebSocket, gunakan `@nestjs/websockets` dan Socket.IO sebagai pilihan umum.
- Jangan mengganti realtime dengan polling.
- Uji endpoint dengan Postman atau Thunder Client sebelum membangun UI yang bergantung padanya.
- Simpan kode dalam Git dan lakukan commit setiap satu fitur selesai.

### 3.3 Gambaran komunikasi

1. Frontend mengirim request REST ke backend untuk operasi biasa.
2. Backend memvalidasi input, token, hak akses, dan data.
3. Backend membaca/menulis database.
4. Untuk riwayat chat, frontend mengambil pesan menggunakan REST.
5. Untuk pesan baru, client membuat koneksi WebSocket dan meminta bergabung ke ruang grup.
6. Backend memeriksa token serta keanggotaan sebelum mengizinkan koneksi/masuk ruang.
7. Pesan disimpan ke database terlebih dahulu.
8. Setelah penyimpanan berhasil, backend menyiarkan pesan baru ke anggota yang sedang berada di ruang grup.

### 3.4 Keputusan teknis yang wajib ditentukan saat implementasi

- Database yang dipakai dan cara menjalankannya.
- ORM atau pendekatan query.
- Struktur folder, nama file, nama variabel, dan desain tampilan.
- Penyimpanan token: cookie atau `localStorage`, beserta risiko yang dipilih.
- Mekanisme perlindungan halaman Next.js, misalnya middleware.
- UI saat loading, data kosong, dan error.
- Bentuk payload dan strategi autentikasi WebSocket.
- Validasi dan batasan input yang tidak ditentukan eksplisit dalam dokumen.

---

## 4. Kebutuhan Fungsional

### 4.1 Register

**Tujuan:** Pengguna dapat membuat akun.

**Input formulir:**
- `username`
- `display_name` / nama tampilan
- `email`
- `password`

**Aturan:**
1. Username wajib unik.
2. Email wajib unik.
3. Username tidak boleh mengandung spasi.
4. Password harus di-hash sebelum disimpan.
5. Akun baru selalu memiliki role global `user`.
6. Jika username/email sudah digunakan, sistem menampilkan pesan error yang jelas.
7. Request yang tidak valid harus ditolak backend.

**Kriteria penerimaan:**
- Pengguna dapat mendaftar dengan data valid.
- Username atau email duplikat ditolak.
- Password pada database bukan teks asli.
- Role akun baru bernilai `user`.

### 4.2 Login dan Logout

**Login:**
- Pengguna masuk menggunakan username atau email dan password.
- Jika kredensial valid, backend mengirim token.
- Frontend menyimpan token sesuai keputusan implementasi.
- Request terlindungi mengirim token pada header `Authorization`.

**Perlindungan halaman:**
- Halaman chat dan halaman yang memerlukan akun hanya dapat dibuka setelah login.
- Pengguna yang belum login diarahkan ke halaman login.
- Backend tetap memeriksa autentikasi; perlindungan frontend bukan satu-satunya lapisan.

**Logout:**
- Tombol logout tersedia dari beranda/daftar grup.
- Pada versi sederhana, frontend menghapus token lalu kembali ke halaman login.
- Jika ingin token benar-benar tidak berlaku lagi, boleh ditambahkan `POST /auth/logout` dan daftar token yang dicabut; hal ini opsional.

**Kriteria penerimaan:**
- Login valid menghasilkan token.
- Login gagal memberikan pesan yang mudah dipahami.
- Halaman terlindungi menolak pengguna tanpa token valid.
- Logout menghapus token pada frontend dan membawa pengguna ke halaman login.

### 4.3 Profil

**Data yang ditampilkan:**
- Username.
- Nama tampilan.
- Bio.

**Kemampuan:**
- Pengguna dapat melihat profilnya sendiri.
- Pengguna dapat mengubah nama tampilan dan bio miliknya sendiri.
- Pengguna dapat melihat profil pengguna lain, misalnya dari kontak atau anggota grup.
- Username tidak boleh berubah; jika implementasi mengizinkan perubahan username, username baru tetap harus unik.

**Kriteria penerimaan:**
- Profil sendiri dapat dibaca dan diperbarui.
- Perubahan hanya berlaku untuk akun yang sedang login.
- Profil orang lain hanya ditampilkan, bukan diedit melalui fitur profil ini.
- Username tetap memenuhi aturan unik.

### 4.4 Tambah Kontak lewat Username

**Alur:**
1. Pengguna membuka halaman Kontak.
2. Pengguna memasukkan username yang dicari.
3. Sistem mencari akun berdasarkan username.
4. Jika ditemukan, sistem menampilkan profil singkat.
5. Pengguna memilih tombol **Tambah Kontak**.
6. Daftar kontak ditampilkan pada halaman Kontak.

**Aturan:**
- Pengguna tidak boleh menambahkan dirinya sendiri.
- Pengguna tidak boleh menambahkan kontak yang sudah ada.
- Jika akun tidak ditemukan, tampilkan pesan yang jelas.
- Arah hubungan kontak diputuskan pengembang: satu arah atau dua arah, lalu didokumentasikan di `README.md`.

**Kriteria penerimaan:**
- Pencarian username menemukan akun yang cocok.
- Pengguna dapat menambahkan akun lain.
- Penambahan diri sendiri ditolak.
- Kontak duplikat ditolak.

### 4.5 Buat Grup dan Daftar Grup

**Alur membuat grup:**
1. Pengguna yang sudah login memilih **Buat Grup**.
2. Pengguna mengisi minimal nama grup.
3. Backend membuat grup.
4. Pembuat otomatis dimasukkan ke `group_members`.
5. Pembuat otomatis memiliki role `admin` untuk grup tersebut.

**Aturan:**
- Semua pengguna yang login boleh membuat grup.
- Nama grup adalah input minimum yang diwajibkan.
- Grup yang diikuti pengguna ditampilkan pada halaman utama.
- Pembuatan grup dan keanggotaan awal harus konsisten: pembuat tidak boleh menjadi pemilik tanpa tercatat sebagai anggota.

**Kriteria penerimaan:**
- Grup baru berhasil dibuat.
- Pembuat tercatat sebagai anggota dan admin.
- Grup tampil di daftar grup milik pengguna.

### 4.6 Pesan Grup

**Akses dan tampilan:**
- Hanya anggota grup yang boleh membaca dan mengirim pesan.
- Setiap pesan menampilkan pengirim, isi pesan, dan waktu pengiriman.
- Pesan lama ditampilkan dari paling awal ke paling akhir.
- Pesan terbaru muncul di bagian bawah.
- Pesan tersimpan di database dan tetap muncul setelah halaman di-refresh.

**Realtime:**
- Pengiriman dan penerimaan pesan wajib melalui WebSocket.
- Pesan baru langsung terlihat oleh anggota yang sedang membuka grup tanpa refresh.
- Backend memeriksa token dan status keanggotaan ketika koneksi dibuat/ketika client masuk ke ruang grup.
- Client bukan anggota tidak boleh bergabung ke ruang grup atau membaca/mengirim pesan.
- Pesan disimpan ke database sebelum disiarkan kepada anggota lain.
- REST `GET /groups/:id/messages` tetap digunakan untuk mengambil riwayat ketika ruang chat dibuka.

**Kriteria penerimaan:**
- Dua akun di dua browser dapat bertukar pesan tanpa refresh.
- Pesan memiliki pengirim, isi, dan waktu.
- Riwayat tetap tersedia setelah refresh.
- User nonanggota ditolak oleh backend.
- Pesan ditampilkan dalam urutan kronologis.

### 4.7 Link Undangan

**Alur:**
1. Admin membuat link undangan untuk grup.
2. Link dapat disalin dan dibagikan kepada orang lain.
3. Pengguna membuka link.
4. Jika sudah login, sistem memproses undangan dan memasukkannya sebagai anggota biasa.
5. Jika belum login, sistem mengarahkan pengguna untuk login atau register, lalu melanjutkan pemrosesan link.
6. Jika link salah atau tidak berlaku, sistem menampilkan pesan yang jelas.

**Aturan:**
- Code undangan harus unik dan sulit ditebak.
- Pengguna yang bergabung melalui undangan mendapat role `member`, bukan `admin`.
- Kebijakan siapa yang boleh membuat link, kedaluwarsa, dan menonaktifkan link ditentukan pengembang dan dicatat di `README.md`.
- Pembukaan link oleh anggota yang sudah tergabung tidak boleh membuat keanggotaan ganda.

**Kriteria penerimaan:**
- Admin dapat membuat link undangan.
- Link dapat disalin.
- Pengguna login dapat bergabung melalui link valid.
- Pengguna belum login dapat login/register dan melanjutkan proses.
- Link invalid/tidak aktif/kedaluwarsa ditangani dengan pesan yang jelas.
- Keanggotaan grup tidak menjadi duplikat.

### 4.8 Mention `@username`

**Alur dan perilaku:**
- Saat pengguna mengetik `@` pada kolom pesan, UI menampilkan daftar anggota grup yang dapat di-tag.
- Pengguna memilih anggota dari daftar saran.
- Pesan yang berisi `@username` menampilkan username tersebut dengan warna atau gaya berbeda.
- Pengguna yang di-tag mendapatkan penanda di grup, misalnya badge atau sorotan pada pesan.
- Hanya anggota grup yang boleh di-tag.
- Username yang bukan anggota grup ditangani sesuai keputusan pengembang; pilih antara menampilkannya sebagai teks biasa atau menolak mention.

**Data:**
- Satu pesan dapat memiliki beberapa mention.
- Data mention dapat disimpan pada tabel/collection `mentions`.
- Kolom `is_read` bersifat opsional jika ingin menyimpan status sudah dibaca.

**Kriteria penerimaan:**
- Saran anggota muncul saat `@` diketik.
- Mention anggota grup diberi gaya berbeda.
- User yang disebut mendapatkan penanda.
- User nonanggota tidak dapat menjadi mention yang sah.

### 4.9 Kelola Admin Grup

**Perilaku:**
- Halaman/panel daftar anggota menampilkan label `Admin` atau `Anggota` pada setiap nama.
- Admin melihat tombol **Jadikan Admin** pada anggota biasa.
- Setelah anggota diangkat, role anggota itu berubah menjadi `admin` pada grup terkait dan tombol tersebut tidak lagi ditampilkan untuk anggota yang sudah admin.
- Anggota biasa tidak melihat tombol tersebut.
- Jika anggota biasa memanggil endpoint secara langsung, backend menolak dengan status `403`.
- Pengangkatan admin hanya berlaku untuk grup terkait, bukan untuk seluruh aplikasi.

**Kriteria penerimaan:**
- Admin dapat mengangkat anggota biasa menjadi admin.
- Role diperbarui di database.
- Label peran diperbarui di UI.
- Anggota biasa tidak dapat mengangkat admin, termasuk melalui request langsung.
- Perubahan role pada satu grup tidak mengubah role pengguna di grup lain.

---

## 5. Alur Pengguna End-to-End

1. Pengguna membuka aplikasi.
2. Pengguna register jika belum memiliki akun.
3. Pengguna login.
4. Pengguna masuk ke halaman utama yang menampilkan grup yang diikuti.
5. Pengguna dapat mengubah profil atau menambahkan kontak lewat username.
6. Pengguna dapat membuat grup baru; pembuat otomatis menjadi admin sekaligus anggota.
7. Pengguna dapat membuka grup yang sudah diikuti.
8. Ruang chat mengambil riwayat pesan dari REST API dan menyambungkan client ke WebSocket setelah autentikasi serta keanggotaan diverifikasi.
9. Anggota mengirim pesan dan men-tag anggota lain menggunakan `@username`.
10. Admin membuka info/daftar anggota, membuat link undangan, atau mengangkat anggota biasa menjadi admin.
11. Pengguna lain dapat membuka link undangan; jika belum login, mereka login/register terlebih dahulu lalu melanjutkan proses bergabung.
12. Pengguna yang bergabung lewat undangan menjadi anggota biasa.
13. Pengguna dapat logout kapan saja; token dihapus pada versi sederhana.

---

## 6. Rancangan Database

Dokumen tugas menyarankan tujuh tabel/collection. Kolom tambahan boleh dibuat jika diperlukan, selama semua fitur wajib terpenuhi.

### 6.1 `users`

| Kolom | Kegunaan / aturan |
|---|---|
| `id` | Identitas unik user |
| `username` | Username unik dan tidak mengandung spasi |
| `display_name` | Nama tampilan |
| `email` | Email unik |
| `password_hash` | Password yang sudah di-hash; bukan password asli |
| `bio` | Bio pengguna |
| `created_at` | Waktu pembuatan akun |
| `role` (opsional) | Jika tersedia, selalu bernilai `user` untuk role global |

### 6.2 `contacts`

| Kolom | Kegunaan / aturan |
|---|---|
| `id` | Identitas relasi kontak |
| `owner_id` | Mengacu ke `users.id`, pemilik daftar kontak |
| `contact_user_id` | Mengacu ke `users.id`, pengguna yang ditambahkan |
| `created_at` | Waktu penambahan |
| Constraint | Pasangan `(owner_id, contact_user_id)` tidak boleh duplikat |

Arah relasi kontak—satu arah atau dua arah—ditentukan pengembang.

### 6.3 `groups`

| Kolom | Kegunaan / aturan |
|---|---|
| `id` | Identitas grup |
| `name` | Nama grup |
| `created_by` | Mengacu ke `users.id`, pembuat grup |
| `created_at` | Waktu pembuatan |

### 6.4 `group_members`

| Kolom | Kegunaan / aturan |
|---|---|
| `id` | Identitas keanggotaan |
| `group_id` | Mengacu ke `groups.id` |
| `user_id` | Mengacu ke `users.id` |
| `role` | `admin` atau `member` |
| `joined_at` | Waktu bergabung |
| Constraint | Pasangan `(group_id, user_id)` harus unik |

Tabel ini menjadi sumber kebenaran untuk role per grup. Pembuat grup harus masuk sebagai `admin`; orang yang bergabung melalui undangan masuk sebagai `member`.

### 6.5 `invite_links`

| Kolom | Kegunaan / aturan |
|---|---|
| `id` | Identitas link undangan |
| `group_id` | Grup tujuan |
| `code` | Kode acak, unik, dan sulit ditebak |
| `created_by` | Pengguna pembuat link |
| `created_at` | Waktu pembuatan |
| `is_active` | Status aktif/tidak aktif |
| `expires_at` (opsional) | Waktu kedaluwarsa |

### 6.6 `messages`

| Kolom | Kegunaan / aturan |
|---|---|
| `id` | Identitas pesan |
| `group_id` | Grup tempat pesan dikirim |
| `sender_id` | User pengirim |
| `content` | Isi pesan |
| `created_at` | Waktu pengiriman |

Setiap pesan terkait dengan satu grup dan satu pengirim.

### 6.7 `mentions`

| Kolom | Kegunaan / aturan |
|---|---|
| `id` | Identitas mention |
| `message_id` | Pesan yang mengandung mention |
| `mentioned_user_id` | User yang di-tag |
| `is_read` (opsional) | Penanda sudah dibaca |

Satu pesan dapat men-tag beberapa pengguna.

### 6.8 Relasi utama

- Satu user dapat memiliki banyak kontak.
- Satu user dapat bergabung ke banyak grup.
- Satu grup dapat memiliki banyak anggota.
- Relasi many-to-many user dan grup dijembatani `group_members`.
- Satu grup memiliki banyak pesan.
- Satu grup memiliki banyak link undangan.
- Satu pesan memiliki banyak mention.
- `contacts.owner_id` dan `contacts.contact_user_id` mengacu ke `users`.
- `groups.created_by` mengacu ke `users`.
- `group_members.group_id` mengacu ke `groups`; `group_members.user_id` mengacu ke `users`.
- `messages.group_id` mengacu ke `groups`; `messages.sender_id` mengacu ke `users`.
- `mentions.message_id` mengacu ke `messages`; `mentions.mentioned_user_id` mengacu ke `users`.

### 6.9 Integritas data yang perlu dijaga

- Username dan email unik.
- Pasangan kontak tidak boleh ganda.
- Pasangan user-grup tidak boleh ganda.
- Kode undangan unik.
- Role anggota grup hanya `admin` atau `member`.
- Mention hanya sah jika pengguna yang disebut adalah anggota grup tempat pesan dikirim.
- Pembuatan grup harus membuat keanggotaan admin pembuat secara konsisten.
- Pesan harus memiliki grup dan pengirim yang valid.

---

## 7. Rancangan REST API

Nama endpoint di bawah mengikuti contoh dari dokumen tugas. Penamaan boleh diubah selama tiap fitur memiliki endpoint jelas dan otorisasi benar.

| Fitur | Method | Path | Akses |
|---|---|---|---|
| Register | `POST` | `/auth/register` | Siapa saja |
| Login | `POST` | `/auth/login` | Siapa saja |
| Lihat profil sendiri | `GET` | `/users/me` | User login |
| Ubah profil sendiri | `PATCH` | `/users/me` | User login |
| Cari user berdasarkan username | `GET` | `/users/search?username=...` | User login |
| Lihat profil orang lain | `GET` | `/users/:id` | User login |
| Daftar kontak | `GET` | `/contacts` | User login |
| Tambah kontak | `POST` | `/contacts` | User login |
| Buat grup | `POST` | `/groups` | User login |
| Daftar grup saya | `GET` | `/groups` | User login |
| Daftar anggota grup | `GET` | `/groups/:id/members` | Anggota grup |
| Jadikan admin | `PATCH` | `/groups/:id/members/:userId/role` | Admin grup |
| Buat link undangan | `POST` | `/groups/:id/invite` | Admin grup |
| Gabung lewat link | `POST` | `/invite/:code/join` | User login |
| Ambil riwayat pesan | `GET` | `/groups/:id/messages` | Anggota grup |
| Kirim pesan | WebSocket event | `sendMessage` | Anggota grup |

### 7.1 Ketentuan API

- Gunakan JSON untuk request/response REST.
- Endpoint terlindungi harus memverifikasi token.
- Endpoint grup harus memeriksa keanggotaan atau role sesuai aksi.
- Validasi input dilakukan di backend.
- Pesan error harus jelas tanpa membocorkan informasi sensitif.
- `GET /groups/:id/messages` digunakan untuk memuat riwayat saat ruang chat dibuka.
- Endpoint tambahan boleh dibuat jika dibutuhkan, misalnya endpoint untuk membaca status undangan atau logout sungguhan.

### 7.2 Kode status HTTP

| Status | Makna dan contoh |
|---|---|
| `400 Bad Request` | Input tidak valid |
| `401 Unauthorized` | Belum login atau token salah |
| `403 Forbidden` | Sudah login tetapi tidak memiliki hak, misalnya anggota biasa mencoba mengangkat admin |
| `404 Not Found` | User, grup, atau link tidak ditemukan |
| `409 Conflict` | Data ganda, misalnya username sudah dipakai atau kontak sudah ada |

Gunakan status sesuai kondisi; jangan mengembalikan `200` untuk operasi yang gagal karena izin atau validasi.

---

## 8. Spesifikasi WebSocket

WebSocket wajib digunakan untuk pesan realtime. Polling berkala tidak memenuhi kebutuhan realtime pada tugas ini.

### 8.1 Event contoh

| Event | Arah | Fungsi |
|---|---|---|
| `joinGroup` | Client → Server | Meminta bergabung ke ruang grup |
| `sendMessage` | Client → Server | Mengirim pesan ke grup |
| `newMessage` | Server → Client | Menyiarkan pesan baru ke anggota ruang grup |
| `mention` | Server → Client | Memberi tahu/menandai user yang di-tag |

### 8.2 Alur koneksi dan pengiriman pesan

1. Client sudah login dan memiliki token.
2. Client membuka koneksi WebSocket dengan mekanisme autentikasi yang ditentukan implementasi.
3. Client meminta `joinGroup` dengan ID grup.
4. Server memverifikasi token.
5. Server memeriksa apakah user anggota grup.
6. Jika bukan anggota, server menolak permintaan masuk ruang.
7. Client mengirim `sendMessage` beserta data grup dan isi pesan.
8. Server memvalidasi pengirim, keanggotaan, isi pesan, serta mention.
9. Server menyimpan pesan dan data mention yang sah ke database.
10. Setelah penyimpanan berhasil, server menyiarkan `newMessage` kepada anggota yang sedang berada di ruang grup.
11. Server mengirim event/penanda `mention` kepada pengguna yang di-tag sesuai desain implementasi.

### 8.3 Ketentuan penting

- Jangan percaya pada `sender_id` dari client; identitas pengirim harus berasal dari token/konteks autentikasi server.
- Server tidak boleh mengizinkan nonanggota membaca atau mengirim pesan.
- Simpan pesan sebelum menyiarkannya.
- Muat riwayat lama melalui REST.
- Urutan pesan harus konsisten dari paling awal ke paling baru.
- Format payload event, mekanisme acknowledgement, penanganan reconnect, dan batas panjang pesan perlu ditetapkan saat implementasi karena tidak dirinci secara pasti oleh dokumen sumber.

---

## 9. Struktur Halaman Frontend

Minimal delapan halaman/area berikut harus tersedia. Info grup boleh digabung sebagai panel di dalam ruang chat, asalkan semua fungsi tetap dapat digunakan.

| Halaman | Isi utama | Akses |
|---|---|---|
| Register | Form pendaftaran | Publik |
| Login | Form login dan tautan ke Register | Publik |
| Beranda / daftar grup | Grup yang diikuti, tombol Buat Grup, tombol Logout | Login |
| Ruang chat grup | Daftar pesan, input pesan, saran `@tag`, akses daftar anggota | Login dan anggota grup |
| Info grup / anggota | Daftar anggota, label peran, tombol Jadikan Admin untuk admin, buat/salin link undangan | Login dan anggota grup |
| Profil | Profil sendiri dan form edit; profil orang lain hanya tampil | Login |
| Kontak | Pencarian username, hasil pencarian, daftar kontak | Login |
| Gabung via link | Memproses link undangan lalu mengarahkan ke ruang chat grup | Login; jika belum login, login/register dahulu |

### 9.1 Perilaku UI

- Tampilkan loading saat data sedang dimuat.
- Tampilkan empty state jika belum ada grup, kontak, anggota, atau pesan.
- Tampilkan pesan error yang jelas jika request gagal.
- Berikan umpan balik ketika kontak ditambahkan, grup dibuat, link disalin, pesan dikirim, atau role berubah.
- Tombol dan aksi sensitif hanya ditampilkan sesuai peran, tetapi backend tetap wajib melakukan pemeriksaan izin.
- Saran mention hanya berisi anggota grup.
- Riwayat chat ditampilkan berurutan dan pesan baru berada di bawah.
- Halaman yang memerlukan login harus mengarahkan pengguna yang belum login ke login.

### 9.2 Token dan perlindungan halaman

Dokumen tugas meminta pengembang menentukan:
- Token disimpan di cookie atau `localStorage`.
- Risiko dari pilihan penyimpanan tersebut.
- Bagaimana Next.js melindungi halaman, misalnya menggunakan middleware.
- Bagaimana aplikasi menangani loading dan error.

Keputusan akhir wajib ditulis di `README.md` atau dokumentasi proyek. Apa pun pilihan frontend, backend tetap memvalidasi token pada endpoint dan WebSocket.

---

## 10. Aturan Bisnis Tetap

Aturan berikut sudah ditentukan oleh dokumen tugas dan bukan pilihan bebas:

1. Semua user baru memiliki role global `user`.
2. Pembuat grup otomatis menjadi admin sekaligus anggota grup.
3. Hanya admin grup yang boleh menjadikan anggota lain sebagai admin.
4. Role admin berlaku per grup.
5. Username harus unik dan tidak boleh mengandung spasi.
6. Hanya anggota grup yang boleh membaca pesan, mengirim pesan, dan di-tag di grup tersebut.
7. Pengguna yang bergabung lewat link undangan menjadi anggota biasa, bukan admin.

---

## 11. Keputusan Pengembang yang Wajib Dicatat di README

Dokumen sumber secara eksplisit menyerahkan keputusan berikut kepada pengembang. Tentukan dan dokumentasikan jawabannya sebelum proyek dianggap selesai.

| Pertanyaan | Pilihan/pertimbangan |
|---|---|
| Siapa yang boleh membuat link undangan? | Admin saja lebih aman; dokumen memberi pilihan admin saja atau semua anggota |
| Apa yang terjadi jika anggota membuka link grup yang sama lagi? | Hindari keanggotaan ganda; tentukan apakah diarahkan ke grup atau diberi pesan |
| Apakah link undangan kedaluwarsa atau dapat dimatikan? | Tentukan kebijakan `expires_at` dan `is_active` |
| Bolehkah admin menurunkan admin lain menjadi anggota? | Tentukan apakah fitur ada; pertimbangkan posisi pembuat grup |
| Bagaimana jika satu-satunya admin ingin keluar? | Hindari grup tanpa admin; tentukan apakah keluar ditolak atau admin dialihkan |
| Bagaimana jika username yang di-tag bukan anggota grup? | Tampilkan sebagai teks biasa atau tolak mention |
| Berapa panjang maksimal pesan? | Tetapkan batas yang masuk akal |
| Bagaimana menangani pesan kosong/spasi saja? | Sebaiknya ditolak; dokumen meminta keputusan batasan ini |
| Apakah kontak satu arah atau dua arah? | Pilih pendekatan paling sederhana dan konsisten |
| Di mana token disimpan? | Cookie atau `localStorage`, termasuk risikonya |
| Bagaimana halaman terlindungi di Next.js? | Misalnya middleware dan pemeriksaan sesi |
| Bagaimana loading/error ditampilkan? | Tentukan standar tampilan |

Keputusan tambahan yang diperlukan untuk implementasi—misalnya batas panjang username, aturan format email, format tanggal, pagination pesan, serta payload WebSocket—boleh ditetapkan pengembang, tetapi jangan mengubah tujuh aturan bisnis tetap di bagian 10.

---

## 12. Penanganan Kasus Tepi

Sistem perlu menangani kondisi selain alur normal, sekurang-kurangnya:

- Username atau email sudah dipakai.
- Input register/login tidak valid.
- Token hilang, salah, atau tidak berlaku.
- Pengguna mencoba membuka halaman chat tanpa login.
- Pengguna mencoba membuka grup dengan ID yang bukan keanggotaannya.
- Pengguna nonanggota mencoba mengambil riwayat atau mengirim pesan.
- Anggota biasa mencoba mengangkat admin melalui UI maupun request langsung.
- Grup atau user tidak ditemukan.
- Link undangan salah, tidak aktif, atau kedaluwarsa.
- Pengguna membuka link grup yang sudah diikuti.
- Pengguna mencoba menambahkan diri sendiri sebagai kontak.
- Pengguna mencoba menambahkan kontak yang sama dua kali.
- Mention menunjuk username yang bukan anggota grup.
- Pesan kosong atau hanya berisi spasi.
- Koneksi WebSocket gagal atau terputus.
- Pesan gagal disimpan; pesan tidak boleh disiarkan sebagai pesan yang sukses tersimpan.
- Pengguna yang di-tag bukan anggota grup.
- Data grup, anggota, dan pesan tidak konsisten.

Untuk setiap kondisi, frontend harus menampilkan respons yang dapat dimengerti dan backend harus mengembalikan hasil yang sesuai.

---

## 13. Keamanan Dasar

### 13.1 Autentikasi dan password

- Password disimpan sebagai hash, bukan teks asli.
- Endpoint yang memerlukan login memverifikasi JWT/token.
- Token salah atau tidak ada harus menghasilkan `401`.
- Logout sederhana menghapus token di frontend; pencabutan token di server hanya jika fitur tambahan dibuat.

### 13.2 Otorisasi

- Semua pemeriksaan role dilakukan di backend.
- Pemeriksaan keanggotaan dilakukan untuk riwayat pesan, pengiriman pesan, daftar anggota, mention, dan akses ruang WebSocket.
- Pemeriksaan admin dilakukan untuk mengangkat admin dan membuat undangan sesuai kebijakan yang dipilih.
- Jangan mengandalkan tombol tersembunyi sebagai pengaman.

### 13.3 Integritas dan validasi

- Validasi request backend.
- Username tidak boleh berisi spasi dan harus unik.
- Email dan username tidak boleh duplikat.
- Kontak dan keanggotaan grup tidak boleh duplikat.
- Kode undangan harus acak, unik, dan sulit ditebak.
- Isi pesan tidak boleh kosong atau hanya spasi; tetapkan batas maksimalnya.
- Mention hanya boleh mengarah ke anggota grup yang sama.

### 13.4 Pengujian keamanan wajib

1. Login sebagai user yang bukan anggota grup.
2. Ketik ID grup milik orang lain langsung di URL browser; akses harus ditolak.
3. Panggil endpoint Jadikan Admin memakai akun anggota biasa melalui Postman/Thunder Client; hasilnya harus `403`.
4. Hapus token lalu buka halaman chat; pengguna harus diarahkan ke login.
5. Periksa tabel `users`; password tidak boleh terlihat sebagai teks asli.

---

## 14. Tahapan Pengerjaan

Urutan ini mengikuti dependensi fitur pada dokumen tugas.

### Tahap 1 — Persiapan

- Buat proyek NestJS dan Next.js.
- Pilih database.
- Hubungkan backend ke database.
- Rancang tabel/collection.
- Pastikan backend bisa menyimpan dan membaca satu data percobaan.

**Selesai jika:** satu data percobaan berhasil ditulis dan dibaca melalui backend/database.

### Tahap 2 — Akun

- Implementasikan register.
- Implementasikan login dan token.
- Implementasikan logout.
- Lindungi halaman yang memerlukan login.

**Selesai jika:** pengguna bisa register, login, logout, dan halaman terlindungi berjalan dari browser.

### Tahap 3 — Profil dan kontak

- Lihat dan ubah profil.
- Cari username.
- Tambahkan kontak.
- Tampilkan daftar kontak.

**Selesai jika:** dua akun dapat saling menambahkan sebagai kontak sesuai kebijakan kontak yang dipilih.

### Tahap 4 — Grup dan peran

- Buat grup.
- Jadikan pembuat admin otomatis.
- Tampilkan daftar grup dan anggota.
- Implementasikan pengangkatan admin.
- Uji otorisasi backend.

**Selesai jika:** anggota biasa mendapat `403` saat mencoba menjadikan orang lain admin.

### Tahap 5 — Pesan dan mention

- Buat WebSocket gateway.
- Implementasikan join grup, kirim pesan, siarkan pesan baru.
- Simpan pesan dan riwayat.
- Implementasikan saran `@username`, format mention, dan penanda bagi user yang di-tag.

**Selesai jika:** dua akun di dua browser dapat bertukar pesan dan saling men-tag tanpa refresh.

### Tahap 6 — Link undangan

- Buat link undangan.
- Implementasikan proses bergabung.
- Tangani link tidak valid/tidak aktif/kedaluwarsa.
- Pastikan anggota yang sudah ada tidak tercatat dua kali.

**Selesai jika:** akun ketiga dapat bergabung hanya melalui link undangan dan mendapat role anggota biasa.

### Tahap 7 — Perapian dan pengujian

- Rapikan pesan error.
- Uji semua fitur wajib.
- Lakukan pengujian keamanan.
- Selesaikan README.
- Pastikan seluruh checklist fitur wajib terpenuhi.

**Selesai jika:** semua fitur wajib berjalan dan diuji, serta README lengkap.

### 14.1 Kebiasaan kerja yang disarankan

- Simpan kode di Git.
- Commit setiap satu fitur selesai.
- Gunakan pesan commit yang jelas.
- Uji endpoint dengan Postman atau Thunder Client sebelum membuat UI.
- Lakukan pengujian sejak awal, bukan hanya di akhir.

---

## 15. Fitur Bonus (Opsional)

Fitur bonus baru boleh dikerjakan setelah seluruh fitur wajib selesai.

1. Notifikasi realtime ketika user di-tag pada grup yang sedang tidak dibuka.
2. Chat pribadi satu lawan satu dengan kontak.
3. Foto profil.
4. Foto grup.
5. Admin mengeluarkan anggota dari grup.
6. Admin menurunkan admin lain menjadi anggota biasa.
7. Anggota keluar dari grup sendiri.
8. Mengubah pesan milik sendiri.
9. Menghapus pesan milik sendiri.
10. Indikator sedang online.
11. Indikator sedang mengetik.
12. Penanda pesan belum dibaca per grup.
13. Mode gelap.
14. Pencarian pesan dalam grup.

**Prioritas:** jangan mulai bonus selama satu pun fitur wajib belum selesai atau belum diuji. Fitur wajib yang lengkap dan rapi lebih bernilai daripada banyak fitur bonus setengah jadi.

---

## 16. Kriteria Penilaian

Bobot berikut merupakan usulan awal pada dokumen tugas.

| Aspek | Bobot | Yang dinilai |
|---|---:|---|
| Fitur wajib berjalan | 50% | Sembilan fitur pada bagian 4 dapat digunakan dari UI tanpa error |
| Hak akses dan keamanan | 15% | Role admin per grup, endpoint terlindungi, password di-hash |
| Rancangan database dan API | 10% | Tabel/relasi masuk akal, endpoint rapi, kode status tepat |
| Tampilan dan kemudahan pakai | 10% | Alur jelas, pesan error mudah dipahami, tampilan konsisten |
| Kerapian kode dan Git | 5% | Struktur folder teratur, commit bertahap dengan pesan jelas |
| README dan presentasi | 10% | Cara menjalankan, keputusan bagian 11, kemampuan menjelaskan kode |
| Fitur bonus | Nilai tambah | Hanya dihitung setelah fitur wajib lengkap |

Total bobot aspek utama: **100%**. Bonus bersifat tambahan.

---

## 17. Checklist Pengujian dan Penerimaan

### 17.1 Register, login, dan profil

- [ ] Register menerima username, nama tampilan, email, dan password.
- [ ] Username duplikat ditolak.
- [ ] Email duplikat ditolak.
- [ ] Username yang mengandung spasi ditolak.
- [ ] Password di database berupa hash.
- [ ] Akun baru memiliki role global `user`.
- [ ] Login dapat menggunakan username atau email.
- [ ] Token dikirim pada request terlindungi.
- [ ] Halaman terlindungi mengarahkan user tanpa login ke login.
- [ ] Logout menghapus token.
- [ ] Profil sendiri menampilkan username, nama tampilan, dan bio.
- [ ] Nama tampilan dan bio dapat diubah.
- [ ] Profil pengguna lain hanya dapat dilihat.

### 17.2 Kontak dan grup

- [ ] Pencarian user melalui username berfungsi.
- [ ] Profil singkat hasil pencarian ditampilkan.
- [ ] Kontak dapat ditambahkan.
- [ ] Menambahkan diri sendiri ditolak.
- [ ] Kontak duplikat ditolak.
- [ ] Daftar kontak tampil.
- [ ] User login dapat membuat grup dengan minimal nama grup.
- [ ] Pembuat otomatis tercatat sebagai anggota dan admin.
- [ ] Daftar grup yang diikuti tampil di beranda.
- [ ] Daftar anggota hanya dapat diakses anggota grup.
- [ ] Label Admin/Anggota tampil untuk setiap anggota.
- [ ] Pengangkatan admin hanya berhasil untuk admin grup.

### 17.3 Pesan, WebSocket, dan mention

- [ ] Riwayat pesan diambil melalui REST.
- [ ] Pesan tersimpan di database.
- [ ] Pesan menampilkan pengirim, isi, dan waktu.
- [ ] Urutan pesan lama ke baru benar.
- [ ] Pesan baru tampil tanpa refresh.
- [ ] Dua akun di dua browser bisa saling mengirim pesan realtime.
- [ ] Nonanggota tidak bisa membaca riwayat.
- [ ] Nonanggota tidak bisa mengirim pesan.
- [ ] Nonanggota tidak bisa bergabung ke ruang WebSocket.
- [ ] Saran mention tampil ketika `@` diketik.
- [ ] Saran hanya berisi anggota grup.
- [ ] Mention ditampilkan dengan gaya khusus.
- [ ] Pengguna yang di-tag memperoleh penanda.
- [ ] Pesan kosong/spasi saja ditangani sesuai kebijakan.

### 17.4 Undangan

- [ ] Admin dapat membuat link undangan.
- [ ] Link dapat disalin dan dibagikan.
- [ ] User login dapat bergabung lewat link.
- [ ] User belum login diminta login/register dan proses undangan dilanjutkan.
- [ ] Link salah ditangani.
- [ ] Link tidak aktif/kedaluwarsa ditangani jika kebijakan itu diterapkan.
- [ ] Pengguna yang bergabung menjadi anggota biasa.
- [ ] Pengguna yang sudah menjadi anggota tidak dibuatkan keanggotaan duplikat.

### 17.5 Pengujian keamanan

- [ ] Akses grup milik orang lain lewat URL ditolak.
- [ ] Request Jadikan Admin oleh anggota biasa menghasilkan `403`.
- [ ] Token dihapus lalu halaman chat dibuka; pengguna diarahkan ke login.
- [ ] Password tidak tersimpan sebagai teks asli.
- [ ] Endpoint dan WebSocket memeriksa otorisasi di backend.

---

## 18. README dan Pengumpulan

### 18.1 Isi minimum README

README harus memuat:
- Cara menjalankan backend.
- Cara menjalankan frontend.
- Database yang digunakan dan cara menyiapkannya.
- Daftar fitur yang selesai.
- Jawaban seluruh pertanyaan keputusan pengembang pada bagian 11.
- Catatan penting konfigurasi yang dibutuhkan agar proyek bisa dijalankan.

### 18.2 Yang dikumpulkan

1. Link repositori Git yang berisi kode backend dan frontend.
2. `README.md` dengan petunjuk menjalankan, database, daftar fitur selesai, dan keputusan bisnis.
3. Demo langsung yang menunjukkan alur dari register sampai admin mengangkat anggota lain menjadi admin.

### 18.3 Kesiapan demo

Minimal demo menunjukkan:
1. Register akun.
2. Login.
3. Membuat grup.
4. Memastikan pembuat otomatis admin.
5. Menggunakan akun lain untuk bergabung lewat link undangan.
6. Mengirim pesan realtime dari dua akun/browser.
7. Menggunakan mention.
8. Menunjukkan daftar anggota dan label peran.
9. Admin mengangkat anggota menjadi admin.
10. Menunjukkan bahwa anggota biasa tidak dapat melakukan aksi admin.

### 18.4 Ketentuan kejujuran akademik

Dokumentasi, tutorial, teman, dan AI boleh digunakan untuk memahami konsep. Pengembang tetap harus dapat menjelaskan setiap bagian kode yang dikumpulkan. Contoh pertanyaan demo: **“Bagaimana backend tahu bahwa user ini admin di grup ini?”**

---

## 19. Catatan Batasan Spesifikasi

PRD ini merangkum dan menstrukturkan isi PDF tugas. Hal-hal berikut tidak ditentukan secara pasti oleh sumber dan tidak boleh dianggap sudah diputuskan tanpa persetujuan pengembang:

- Pilihan database dan ORM final.
- Desain visual, warna, typography, dan struktur folder.
- Detail skema request/response setiap endpoint.
- Bentuk payload setiap event WebSocket.
- Batas maksimal panjang pesan dan username.
- Kebijakan akhir undangan, kontak, penurunan admin, serta keluarnya admin.
- Pilihan penyimpanan token.
- Strategi pagination riwayat chat.
- Mekanisme deploy/hosting.
- Fitur bonus mana yang akhirnya akan dibuat.

Semua keputusan yang diminta secara eksplisit dalam tugas harus dicatat di `README.md`. Jangan menganggap fitur bonus sebagai fitur wajib.

---

## 20. Definisi Selesai (Definition of Done)

Proyek dapat dinyatakan selesai jika:

1. Sembilan fitur wajib telah tersedia dari antarmuka dan lolos uji.
2. Register, login, logout, dan perlindungan halaman berfungsi.
3. Password tersimpan dalam bentuk hash.
4. Profil dan kontak berjalan sesuai aturan.
5. Pembuatan grup mencatat pembuat sebagai admin sekaligus anggota.
6. Peran admin diperiksa pada backend dan berlaku per grup.
7. Pesan tersimpan, riwayat bisa dimuat, dan pesan baru berjalan realtime melalui WebSocket.
8. Mention hanya sah untuk anggota grup.
9. Link undangan bisa dipakai, menangani kondisi invalid, dan tidak membuat keanggotaan ganda.
10. Status HTTP untuk kesalahan umum sesuai.
11. Pengujian keamanan dasar selesai.
12. README menjelaskan cara menjalankan, database, fitur selesai, dan semua keputusan pengembang.
13. Repositori Git memuat kode frontend dan backend dengan riwayat commit yang rapi.
14. Demo alur utama dapat dilakukan dan pengembang mampu menjelaskan kode yang dibuat.

---

**Acuan utama:** *Tugas Project: Website Chat Room (Kelas 12)*, 13 halaman. Jika ada detail yang tidak tercantum dalam dokumen sumber, PRD ini menandainya sebagai keputusan implementasi, bukan menganggapnya sebagai ketentuan guru.

# Little Us — WebView

Little Us adalah prototipe web mobile-first untuk dunia MyWinter, Daisy, sinyal Kangen/Peluk/Kirim Daisy, dan tanggal hubungan 27 November 2025.

## Isi repository
- `index.html` — antarmuka web dan integrasi Supabase (URL/key masih placeholder).
- `supabase/schema.sql` — tabel, RLS, RPC PIN, pembatasan dua anggota, dan realtime.
- `.github/workflows/pages.yml` — deployment GitHub Pages.

## Jalankan lokal
Buka `index.html` di browser untuk melihat UI. Interaksi cloud tidak aktif sampai Supabase dikonfigurasi.

## Aktifkan cloud
1. Buat proyek di Supabase.
2. Jalankan seluruh `supabase/schema.sql` melalui SQL Editor.
3. Aktifkan Anonymous Sign-Ins di Authentication.
4. Ambil Project URL dan anon/publishable key dari Project Settings → API.
5. Ganti `PASTE_SUPABASE_PROJECT_URL_HERE` dan `PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY_HERE` di `index.html`.
6. Commit perubahan, lalu deploy ulang Pages.
7. Buka aplikasi dari dua perangkat dan masukkan PIN bersama `271125`.

**Jangan pernah memasukkan service_role key ke frontend atau repository.** PIN bersama ini nyaman untuk prototipe dua orang, bukan autentikasi kuat untuk data sensitif. RLS membatasi akses interaksi kepada anggota ruang; uji konfigurasi keamanan sebelum menyimpan data pribadi.

## GitHub Pages
Repository → Settings → Pages → Source: GitHub Actions. Workflow `pages.yml` akan menerbitkan halaman dari root repository setelah workflow dijalankan.

## Batasan saat ini
- Realtime memerlukan kedua perangkat online dan aplikasi terbuka.
- Push notification saat aplikasi tertutup belum dibuat.
- Memory Garden belum terhubung ke ekspor chat.
- Tidak ada autentikasi berbasis email/password; pengguna memakai anonymous auth dan PIN bersama.

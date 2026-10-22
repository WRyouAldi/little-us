# Little Us — Our Little Winter World

Proyek WebView mobile-first untuk Little Us.

## Struktur
- `index.html`: versi web untuk GitHub Pages.
- `app/`: Android WebView wrapper dan salinan UI yang dibundel untuk APK.
- `supabase/schema.sql`: skema backend cloud dan ruang pasangan.
- `.github/workflows/pages.yml`: deploy web ke GitHub Pages.
- `.github/workflows/android-apk.yml`: build APK Android melalui GitHub Actions.

## Build APK
1. Buka tab **Actions** pada repository.
2. Pilih **Build Little Us APK**.
3. Tekan **Run workflow** pada branch `main`.
4. Tunggu workflow berstatus sukses.
5. Buka hasil run, lalu unduh artifact `little-us-debug-apk`.
6. Ekstrak ZIP artifact dan pasang `app-debug.apk` pada perangkat Android.

APK yang dihasilkan adalah debug APK untuk pengujian, bukan APK rilis bertanda tangan untuk distribusi publik.

## Konfigurasi cloud
Cloud belum aktif sampai proyek Supabase dibuat, SQL di `supabase/schema.sql` dijalankan, Anonymous Sign-Ins diaktifkan, lalu URL dan anon/publishable key dimasukkan ke `index.html` dan `app/src/main/assets/index.html`. Jangan pernah memasukkan `service_role` key ke aplikasi.

## Batasan
- Push notification saat aplikasi tertutup belum dibuat.
- Uji koneksi dua perangkat baru bisa dilakukan setelah Supabase dikonfigurasi.
- PIN bersama `271125` memudahkan koneksi prototipe, tetapi bukan pengganti autentikasi kuat untuk data sensitif.

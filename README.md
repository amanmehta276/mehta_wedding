# 🪔 Sneha ❤️ Aman — Wedding Moments

A royal Indian wedding photo-sharing web app with live gallery, Supabase image storage, and MongoDB metadata.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📸 Photo Upload | Drag & drop or tap, with live preview |
| 🎉 Confetti | Gold & red burst on every upload |
| 🖼️ Live Gallery | Pinterest-style masonry grid, auto-refreshes every 30s |
| 💡 Lightbox | Click any photo to view full-size |
| 🎵 Background Music | Optional loop, gentle volume |
| 🌸 Floating Petals | Ambient rose petal animation |
| 🔐 Admin Panel | Password-protected, delete photos / clear gallery |
| 📱 Mobile-First | QR-code ready, works on all screen sizes |

---

## 🚀 Quick Start

### 1. Clone / Download
```bash
cd wedding-app
```

### 2. Install dependencies
```bash
pip3 install -r requirements.txt
```

### 3. Set up `.env`
```bash
cp .env.example .env
```
Edit `.env` with your credentials (see below).

### 4. Run
```bash
bash start.sh
# or
python3 app.py
```

App runs at **http://localhost:5000**

---

## 🗄️ MongoDB Setup

### Option A — Local MongoDB
```
MONGO_URI=mongodb://localhost:27017/
```
Install MongoDB from https://www.mongodb.com/try/download/community

### Option B — MongoDB Atlas (Cloud, Free)
1. Create account at https://cloud.mongodb.com
2. Create cluster → Connect → Get connection string
3. Set: `MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/`

---

## ☁️ Supabase Setup

1. Create free account at https://supabase.com
2. Create new project
3. Go to **Storage** → Create bucket named `wedding-photos`
4. Set bucket to **Public**
5. Go to **Settings → API** → Copy:
   - Project URL → `SUPABASE_URL`
   - `anon` public key → `SUPABASE_KEY`

```env
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_BUCKET=wedding-photos
```

> **Note:** If Supabase is not configured, images are stored as base64 in MongoDB (works fine for small events, not ideal for large ones).

---

## 🔐 Admin Panel

Visit `/admin` → default password is `sneha-aman-2024`

Change it in `.env`:
```env
ADMIN_PASSWORD=your-secret-password
```

Admin features:
- View all photos with guest names & timestamps
- Delete individual photos (from Supabase + MongoDB)
- Clear entire gallery with one click

---

## 📱 QR Code for Guests

Generate a QR code pointing to your server's IP, e.g.:
```
http://192.168.1.100:5000
```

Free QR generators: https://qr.io or https://qrcode-monkey.com

For public access, deploy to **Railway**, **Render**, or **Fly.io**.

---

## 🎵 Custom Music

Replace the music URL in `templates/index.html`:
```html
<source src="/static/assets/wedding-music.mp3" type="audio/mpeg" />
```
Place your MP3 at `static/assets/wedding-music.mp3`.

---

## 🛠️ Tech Stack

- **Backend:** Python Flask
- **Database:** MongoDB (pymongo)
- **Image Storage:** Supabase Storage
- **Frontend:** Vanilla HTML/CSS/JS
- **Fonts:** Playfair Display · Poppins · Great Vibes (Google Fonts)

---

## 📁 Project Structure

```
wedding-app/
├── app.py                  # Flask backend
├── requirements.txt
├── .env.example            # Copy to .env and fill in
├── start.sh                # Convenience startup script
├── templates/
│   ├── index.html          # Main wedding page
│   └── admin.html          # Admin panel
└── static/
    ├── css/
    │   ├── main.css        # Royal Indian theme
    │   └── admin.css       # Admin styles
    └── js/
        ├── app.js          # Gallery, upload, confetti
        └── admin.js        # Admin panel logic
```

---

## 🌐 Production Deployment

### Railway (Recommended)
```bash
# Install Railway CLI
npm i -g @railway/cli
railway login
railway init
railway up
```
Set env vars in Railway dashboard.

### Render
- Connect GitHub repo → New Web Service
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app`

---

*Made with ❤️ for Sneha & Aman's special day* 🪔

from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os
import uuid
import base64
import requests
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# ─── MongoDB Setup ───────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["wedding_db"]
photos_collection = db["photos"]

# ─── Supabase Setup ──────────────────────────────────────────────────────────
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "wedding-photos")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "sneha-aman-2024")


def upload_to_supabase(file_bytes: bytes, filename: str, content_type: str) -> str | None:
    """Upload image bytes to Supabase Storage and return public URL."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None

    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{filename}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    resp = requests.post(url, headers=headers, data=file_bytes)
    if resp.status_code in (200, 201):
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_BUCKET}/{filename}"
        return public_url
    return None


def delete_from_supabase(filename: str) -> bool:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return False
    url = f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_BUCKET}/{filename}"
    headers = {"Authorization": f"Bearer {SUPABASE_KEY}"}
    resp = requests.delete(url, headers=headers)
    return resp.status_code in (200, 204)


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/admin")
def admin():
    return render_template("admin.html")


@app.route("/api/photos", methods=["GET"])
def get_photos():
    """Return all photos sorted newest first."""
    photos = list(photos_collection.find({}, {"_id": 0}).sort("uploaded_at", -1))
    return jsonify({"photos": photos, "count": len(photos)})


@app.route("/api/upload", methods=["POST"])
def upload_photo():
    """Accept multipart file + guest_name, upload to Supabase, save to Mongo."""
    try:
        guest_name = request.form.get("guest_name", "Anonymous Guest").strip()
        if not guest_name:
            guest_name = "Anonymous Guest"

        file = request.files.get("photo")
        if not file:
            return jsonify({"error": "No photo provided"}), 400

        allowed = {"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}
        ct = file.content_type or "image/jpeg"
        if ct not in allowed:
            return jsonify({"error": "Invalid file type"}), 400

        ext = ct.split("/")[-1].replace("jpeg", "jpg")
        filename = f"{uuid.uuid4().hex}.{ext}"
        file_bytes = file.read()

        public_url = upload_to_supabase(file_bytes, filename, ct)

        # Fallback: store as base64 if Supabase not configured
        if not public_url:
            b64 = base64.b64encode(file_bytes).decode("utf-8")
            public_url = f"data:{ct};base64,{b64}"
            filename = f"local_{filename}"

        doc = {
            "id": uuid.uuid4().hex,
            "guest_name": guest_name,
            "filename": filename,
            "url": public_url,
            "uploaded_at": datetime.utcnow().isoformat() + "Z",
        }
        photos_collection.insert_one(doc)

        return jsonify({"success": True, "photo": {k: v for k, v in doc.items() if k != "_id"}})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/verify", methods=["POST"])
def verify_admin():
    data = request.get_json(force=True)
    if data.get("password") == ADMIN_PASSWORD:
        return jsonify({"success": True})
    return jsonify({"success": False}), 401


@app.route("/api/admin/delete/<photo_id>", methods=["DELETE"])
def delete_photo(photo_id):
    password = request.headers.get("X-Admin-Password", "")
    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 401

    photo = photos_collection.find_one({"id": photo_id})
    if not photo:
        return jsonify({"error": "Not found"}), 404

    if not photo["filename"].startswith("local_"):
        delete_from_supabase(photo["filename"])

    photos_collection.delete_one({"id": photo_id})
    return jsonify({"success": True})


@app.route("/api/admin/clear", methods=["DELETE"])
def clear_gallery():
    password = request.headers.get("X-Admin-Password", "")
    if password != ADMIN_PASSWORD:
        return jsonify({"error": "Unauthorized"}), 401

    photos = list(photos_collection.find({}, {"filename": 1}))
    for p in photos:
        if not p["filename"].startswith("local_"):
            delete_from_supabase(p["filename"])

    photos_collection.delete_many({})
    return jsonify({"success": True, "deleted": len(photos)})


if __name__ == "__main__":
    app.run(debug=True, port=5000)

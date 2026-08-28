# Lombok-Japan Family API

Flask backend for YouTube sync and video CMS.

## Setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
# Fill YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

python app.py
```

API base: http://localhost:5000

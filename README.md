# Lombok-Japan Family CMS

日本とインドネシアをつなぐファミリーチャンネル向けの公式サイト + 管理CMSです。

## Stack

- **Frontend**: React / TypeScript / Vite / Tailwind
- **Backend**: Flask / Gunicorn
- **Data**: Supabase (PostgreSQL + Auth + Storage)
- **Ops**: Docker / GitHub Actions / Sentry-ready

## Quick start (local)

```bash
# Frontend
cp .env.example .env
npm install
npm run dev

# Backend
cd backend
python -m venv .venv
.\.venv\Scripts\activate   # Windows
pip install -r requirements.txt
cp .env.example .env
python app.py
```

## Docker

```bash
cp .env.example .env
cp backend/.env.example backend/.env
# Fill secrets, then:
docker compose up --build
```

- Frontend: http://localhost:8080  
- Backend health: http://localhost:5000/health  

## Documentation

| Doc | Path |
|-----|------|
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Deployment | [docs/deployment.md](docs/deployment.md) |
| Environment | [docs/environment.md](docs/environment.md) |
| Security | [docs/security.md](docs/security.md) |
| Backup | [docs/backup.md](docs/backup.md) |
| Production checklist | [docs/production-checklist.md](docs/production-checklist.md) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production frontend build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript project build check |
| `cd backend && pytest` | Backend tests |
| `cd backend && ruff check .` | Backend lint |

## Security note

Never commit `.env`, service-role keys, SMTP passwords, or GA credentials.

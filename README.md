# Assignment Express Apps

## Setup

- Clone/open this folder.
- Install Node 18+.
- Install deps:

```bash
npm install
```

- Optional: copy `.env.example` to `.env` and adjust variables. If using Redis, set `REDIS_URL`.

## Run

```bash
npm start
```

Server runs on http://localhost:3000

## Features

- Registration form with validation and file uploads (single profile, multiple others)
- Shows validation errors preserving previous values
- Success page renders data and images; includes download links
- Login with file-backed sessions under `/file`
- Login with Redis sessions under `/redis`
- ERP Admin login under `/admin`

## Routes

- `GET /register` – render form
- `POST /register` – validate + upload
- `GET /download/:type/:filename` – download uploaded file (type=`profile|others`)
- `GET /file/login`, `POST /file/login`, `GET /file/dashboard`
- `GET /redis/login`, `POST /redis/login`, `GET /redis/dashboard`
- `GET /admin/login`, `POST /admin/login`, `GET /admin/dashboard`
# nodeassi2
# nodeassi2

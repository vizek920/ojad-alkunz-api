# اوجد الكنز — Backend API

Node/Express API for the "Ojad AlKunz" interactive quiz game.

## Stack
- **Runtime:** Node.js 18+
- **Framework:** Express 4
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Render

---

## Setup

### 1. Clone & install
```bash
npm install
```

### 2. Create `.env` from `.env.example`
```
SUPABASE_URL=https://iwoelnmnywjnvmylxizg.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
ADMIN_PASSWORD=kanz2024
PORT=3000
FRONTEND_URL=https://ojad-alkunz.vercel.app
```

### 3. Run Supabase schema
Go to **Supabase → SQL Editor**, paste `supabase/schema.sql`, and run it.

### 4. Start locally
```bash
npm run dev      # with nodemon
npm start        # production
```

---

## API Routes

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Verify admin password |
| GET  | `/api/auth/verify` | Admin | Check token |

### Categories
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/api/categories` | — | List all |
| POST   | `/api/categories` | Admin | Create |
| PUT    | `/api/categories/:id` | Admin | Update |
| DELETE | `/api/categories/:id` | Admin | Delete |

### Questions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/api/questions` | — | List (filter: ?category_id, difficulty, stage) |
| GET    | `/api/questions/for-stage/:stage` | — | Get questions for a stage |
| GET    | `/api/questions/:id` | — | Get one |
| POST   | `/api/questions` | Admin | Create |
| POST   | `/api/questions/bulk` | Admin | Bulk insert |
| PUT    | `/api/questions/:id` | Admin | Update |
| DELETE | `/api/questions/:id` | Admin | Delete |

### Sessions
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/api/sessions` | Admin | List all |
| GET    | `/api/sessions/:id` | — | Get session state (Big Screen) |
| POST   | `/api/sessions` | Admin | Create new session |
| PATCH  | `/api/sessions/:id/state` | Admin | Update live game state |
| PATCH  | `/api/sessions/:id/stage/:stage` | Admin | Update stage data |
| PATCH  | `/api/sessions/:id/team/:teamKey` | Admin | Update team score/lives |
| DELETE | `/api/sessions/:id` | Admin | Delete session |

---

## Admin Authentication
All admin routes require:
```
Authorization: Bearer kanz2024
```
or:
```
x-admin-password: kanz2024
```

---

## Deploy to Render
1. Push this repo to GitHub
2. Create a new **Web Service** on Render
3. Set environment variables from `.env.example`
4. Build command: `npm install`
5. Start command: `npm start`

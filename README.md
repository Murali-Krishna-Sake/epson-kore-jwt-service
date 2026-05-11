# Epson Kore JWT Service

JWT/JWE issuance service for the [Kore Web SDK](https://docs.kore.ai/). A browser
fingerprint is exchanged for a short-lived JWE that the Kore Web SDK can present
to `idproxy.kore.com`. Sessions are bound to fingerprints via Redis.

## Endpoints

| Method | Path            | Purpose                                                    |
| ------ | --------------- | ---------------------------------------------------------- |
| POST   | `/init-session` | Create a tab session; returns `{ sessionId }`              |
| POST   | `/get-jwt`      | Validate identity, refresh TTL, return `{ jwt }` (JWE)     |
| GET    | `/health`       | Liveness + Redis ping (`200 ok` / `503 degraded`)          |
| GET    | `/`             | Service info                                               |

### `POST /init-session`

Request: `{ "fp": "<64-char lowercase hex>" }`
Responses: `200 { sessionId }`, `400 MISSING_FP | INVALID_FP`, `500 INTERNAL_ERROR`.

### `POST /get-jwt`

Request: `{ "identity": "<sessionId>:<fp>" }`
Responses: `200 { jwt }`, `400 INVALID_IDENTITY`, `401 SESSION_EXPIRED | FP_MISMATCH`, `500 INTERNAL_ERROR`.

The JWE is `RSA-OAEP` / `A256GCM` over an HS256-signed JWT. Claims include
`sub` (device UUID), `iss`/`appId` (CLIENT_ID), `aud`
(`https://idproxy.kore.com/authorize`), `iat`, `exp` (now + 5 min), `jti`,
`isAnonymous: true`, and `sessionId`.

## Project layout

```text
src/
  server.ts              # entry, listen + graceful shutdown
  app.ts                 # Express app factory
  config.ts              # env loading + validation
  logger.ts              # zero-dep console logger
  redis.ts               # ioredis client + closeRedis()
  sessionStore.ts        # session:tab:<id> CRUD
  jwt.ts                 # Kore JWE issuance (cached key)
  routes/
    session.ts           # POST /init-session
    jwt.ts               # POST /get-jwt
  middleware/
    requestId.ts         # X-Request-Id + req.id
    accessLog.ts         # structured request log
    corsOptions.ts       # CORS origin rule
```

## Setup

Requires **Node 18+** and a running **Redis**.

```bash
npm install
cp .env.example .env       # then fill in real values
npm run dev                # ts-node-dev, hot reload
```

For production:

```bash
npm run build              # tsc -> dist/
npm start                  # node dist/server.js
```

Type-check only: `npm run typecheck`.

## Environment

| Variable          | Required | Default                    | Notes                                                            |
| ----------------- | -------- | -------------------------- | ---------------------------------------------------------------- |
| `CLIENT_ID`       | yes      | —                          | Kore client ID; used as `iss` and `appId`                        |
| `CLIENT_SECRET`   | yes      | —                          | HS256 signing key                                                |
| `KORE_JWK`        | yes      | —                          | Kore public JWK (single-line JSON, must include `kty` and `kid`) |
| `PORT`            | no       | `3001`                     |                                                                  |
| `REDIS_URL`       | no       | `redis://localhost:6379`   |                                                                  |
| `ALLOWED_ORIGINS` | no       | (empty)                    | Comma-separated. `localhost`/`127.0.0.1` always allowed          |
| `LOG_LEVEL`       | no       | `info`                     | Set to `debug` to enable `log.debug`                             |

Missing or malformed required vars cause the process to log and exit
immediately at startup.

## Session model

```text
session:tab:<sessionId>  ->  { fpHash, deviceUUID }   (TTL 30d, refreshed per /get-jwt)
```

`sessionId` and `deviceUUID` are independent UUIDv4s. `fpHash` is
`sha256(fp)`; the raw fingerprint is never stored.

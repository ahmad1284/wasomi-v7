Great question — email testing locally is one of those things that trips people up. You need to see emails without actually sending them.

---

## The right tool: Mailpit

Mailpit is the modern replacement for Mailhog (which is abandoned). It's a fake SMTP server with a beautiful web UI that catches all outgoing emails locally — nothing ever actually sends.Mailpit is a small, fast, zero-dependency email testing tool — it acts as a local SMTP server and provides a modern web UI to view and test captured emails, plus a REST API for automated integration testing. Nothing ever actually sends. Perfect for your workflow.

---

## Drop this into your Docker Compose

```yaml
services:

  pocketbase:
    # ... your existing config
    environment:
      - SMTP_HOST=mailpit        # ← internal Docker hostname
      - SMTP_PORT=1025
      - SMTP_AUTH_ENABLED=false

  minio:
    # ... your existing config

  frontend:
    # ... your existing config

  mailpit:
    image: axllent/mailpit
    container_name: mailpit
    restart: unless-stopped
    profiles: [dev]              # ← only runs locally, not prod
    volumes:
      - ./mailpit_data:/data
    ports:
      - "8025:8025"              # web UI → localhost:8025
      - "1025:1025"              # SMTP (internal only in prod)
    environment:
      MP_MAX_MESSAGES: 5000
      MP_DATABASE: /data/mailpit.db
      MP_SMTP_AUTH_ACCEPT_ANY: 1   # accepts any username/password
      MP_SMTP_AUTH_ALLOW_INSECURE: 1
```

The `profiles: [dev]` flag is the key detail — Mailpit only spins up when you explicitly load the dev profile: `docker compose --profile dev up`. Your production compose file simply omits the profile flag and Mailpit never starts.

---

## The environment switching pattern

This is where it gets clean. You use `.env` files to switch between local Mailpit and production Resend — **zero code changes**:

```
.env.local        ← gitignored, local dev
.env.production   ← gitignored, prod secrets
.env.example      ← committed, documents what's needed
```

**.env.local**
```env
# Email — local Mailpit
SMTP_HOST=mailpit
SMTP_PORT=1025
SMTP_TLS=false
SMTP_USERNAME=
SMTP_PASSWORD=

# OR if using Resend SDK directly in hooks:
RESEND_API_KEY=re_test_xxxx    # Resend has real test keys
```

**.env.production**
```env
# Email — Resend SMTP
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_TLS=true
SMTP_USERNAME=resend
SMTP_PASSWORD=re_live_xxxx

# OR Resend SDK:
RESEND_API_KEY=re_live_xxxx
```

PocketBase picks these up via its SMTP settings — same config, different values per environment. Your hooks just call `process.env.RESEND_API_KEY` — same code, right key per env.

---

## What Mailpit actually gives you

The web UI at `localhost:8025` shows formatted HTML preview, highlighted HTML source, plain text view, headers, raw source, MIME attachments with image thumbnails, HTML client compatibility scoring, and link checking to validate URLs in email content.

The iteration loop becomes:

```
1. Trigger an action in your app (submit thesis, approve, etc.)
2. Open localhost:8025
3. See the email appear in real time (WebSocket push)
4. Inspect HTML, check layout, verify links, check plain text
5. Edit your template
6. Repeat — takes seconds
```

There's also a "Chaos" feature — you can configure Mailpit to randomly return SMTP errors to test how your app handles email delivery failures. Useful for making sure your hooks don't crash the submission workflow if Resend has an outage.

---

## The full local ports at a glance

```
localhost:5173   → Vite React frontend
localhost:8090   → PocketBase API + admin (/_/)
localhost:9000   → MinIO S3 API
localhost:9001   → MinIO console UI
localhost:8025   → Mailpit web UI  ← your email inbox
```

One command to rule them all:
```bash
docker compose --profile dev up
```

Every email your app sends — verification, submission received, approval, password reset — lands in Mailpit. You see exactly what your users will see, in their inbox layout, before a single real email is ever sent.
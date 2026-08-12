# Deploy production

1. On the VPS, clone or upload this repository, then create the secret environment file:

   ```sh
   cp .env.production.example .env.production
   chmod 600 .env.production
   ```

2. Set a strong `POSTGRES_PASSWORD` and the real Google OAuth values (if used) in `.env.production`.

3. Start or update the stack:

   ```sh
   docker compose --env-file .env.production up -d --build
   ```

4. Verify it:

   ```sh
   docker compose ps
   curl -f http://127.0.0.1/api/superadmin/settings
   ```

Only port 80 is exposed. PostgreSQL and the API remain on Docker's internal network; pgAdmin is intentionally excluded from production.

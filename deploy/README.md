# Ruta Cinepolis deployment

Production runs as separate containers:

- `ruta-postgres`: PostgreSQL, internal Docker network only.
- `ruta-api`: Express API, exposed on `127.0.0.1:4000`.
- `ruta-frontend`: Vite build served by Nginx, exposed on `127.0.0.1:8080`.

The host Nginx receives public traffic on port 80 and proxies:

- `/api/*` to `127.0.0.1:4000`
- everything else to `127.0.0.1:8080`

## First deploy on VPS

```bash
cd /opt/RutaCinepolis
cp .env.prod.example .env.prod
nano .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Load initial levels, benefits, admin and cashier users:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml --profile seed run --rm seed
```

Configure host Nginx:

```bash
sudo cp deploy/nginx-ip.conf /etc/nginx/sites-available/ruta-cinepolis
sudo ln -s /etc/nginx/sites-available/ruta-cinepolis /etc/nginx/sites-enabled/ruta-cinepolis
sudo nginx -t
sudo systemctl reload nginx
```

When you add domains, replace `server_name _;` with your real hostnames and add TLS with Certbot.

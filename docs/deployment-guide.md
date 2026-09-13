# Digital Ocean Droplet & Linux VPS Deployment Guide

This guide walks you through deploying the **Rewaa Frontend** on a **Digital Ocean Droplet** (or any Ubuntu/Debian Linux VPS such as Hetzner, Linode, AWS EC2, or Vultr) using **Docker**, **GitHub Actions (CI/CD)**, and **Nginx**.

---

## 🏗️ Architecture Overview

```
[ Git Push to main ]
         │
         ▼
[ GitHub Actions Runner ] (Free tier: 2 vCPU / 7 GB RAM)
         │  1. Builds Next.js in standalone mode
         │  2. Packages into minimal Docker image
         │  3. Pushes to GitHub Container Registry (ghcr.io)
         │  4. Connects to your Droplet via SSH
         ▼
[ Digital Ocean Droplet / Linux VPS ]
         │
         ├──► [ Host Nginx ] (Ports 80 & 443 with Let's Encrypt SSL)
         │          │  - Serves static assets with 1-year caching
         │          │  - Proxies application requests to :3000
         │          ▼
         └──► [ Docker Container: rewaa-app ] (127.0.0.1:3000)
                    │  - Next.js 16 standalone server (~150-200 MB RAM)
                    ▼
              [ External Backend API ] (NEXT_PUBLIC_API_URL)
```

---

## 📋 System Requirements

| Specification | Minimum                  | Recommended      |
| ------------- | ------------------------ | ---------------- |
| **CPU**       | 1 vCPU                   | 1 vCPU or 2 vCPU |
| **RAM**       | 1 GB (+ swap)            | 2 GB             |
| **Disk**      | 15 GB SSD                | 25 GB+ SSD       |
| **OS**        | Ubuntu 22.04 / 24.04 LTS | Ubuntu 24.04 LTS |

---

## 🚀 Step-by-Step Deployment

### Phase 1: Initial Droplet / VPS Configuration

Connect to your server via SSH:

```bash
ssh root@YOUR_SERVER_IP
```

#### 1. Update Packages

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Configure Firewall (UFW)

Ensure SSH is allowed before enabling the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

#### 3. Configure Swap Space (Crucial for 1–2 GB RAM servers)

Swap provides virtual memory on disk to prevent the Linux kernel from killing processes under brief memory spikes:

```bash
# Check if swap already exists
free -h

# If no swap, create a 2 GB swapfile
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make swap permanent across reboots
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Optimize swappiness for servers
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

#### 4. Install Docker & Docker Compose Plugin

```bash
# Install prerequisites
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

#### 5. Install Nginx & Certbot (if not already installed)

If your droplet doesn't already have Nginx:

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo systemctl enable --now nginx
```

---

### Phase 2: Set Up Rewaa on the Droplet

#### 1. Create the Application Directory

```bash
sudo mkdir -p /opt/rewaa
cd /opt/rewaa
```

#### 2. Copy the Production Compose File

Create `/opt/rewaa/docker-compose.prod.yml`:

```bash
sudo nano /opt/rewaa/docker-compose.prod.yml
```

Paste the following content:

```yaml
services:
  app:
    image: ghcr.io/amrmohamed27/rewaa:latest
    container_name: rewaa-app
    restart: always
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - COOKIE_NAME=${COOKIE_NAME:-rewaa_auth}
    ports:
      - "127.0.0.1:${APP_PORT:-3000}:3000"
    deploy:
      resources:
        limits:
          memory: 1024M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

#### 3. (Optional) Create a Local `.env` File on the Droplet

If you want to customize the internal port or default cookie name:

```bash
sudo nano /opt/rewaa/.env
```

```env
APP_PORT=3000
COOKIE_NAME=rewaa_auth
```

---

### Phase 3: Configure Host Nginx & SSL

#### 1. Create Nginx Site Configuration

Create `/etc/nginx/sites-available/rewaa`:

```bash
sudo nano /etc/nginx/sites-available/rewaa
```

Paste the configuration (make sure to replace `yourdomain.com` with your actual domain):

```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript
        image/svg+xml;

    client_max_body_size 25M;

    # Next.js Static Assets (fingerprinted hashes, safe to cache for 1 year)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Public static files (icons, favicon, manifest, etc.)
    location ~* ^/(favicon\.ico|icon.*|apple-icon.*|robots\.txt|manifest\.json) {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 30d;
        access_log off;
        add_header Cache-Control "public, max-age=2592000";
    }

    # All application routes -> Next.js Standalone
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        # WebSocket / Upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Standard Proxy Headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    listen 80;
}
```

> **Note**: If you changed `APP_PORT` in `.env` (e.g., to `3005`), update `http://127.0.0.1:3000` to `http://127.0.0.1:3005` in all `proxy_pass` directives above.

#### 2. Enable Site and Test Configuration

```bash
sudo ln -s /etc/nginx/sites-available/rewaa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 3. Obtain Free Let's Encrypt SSL Certificate

Ensure your domain's DNS `A` records point to your droplet's IP, then run:

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Certbot will automatically configure HTTPS redirection and certificate auto-renewal.

---

### Phase 4: Configure GitHub Actions CI/CD

#### 1. Generate SSH Key for Deployment (if needed)

On your local machine (or droplet), generate an SSH key pair dedicated to GitHub Actions:

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions_rewaa
```

Add the **public key** (`~/.ssh/github_actions_rewaa.pub`) to your droplet:

```bash
cat ~/.ssh/github_actions_rewaa.pub | ssh root@YOUR_SERVER_IP "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

#### 2. Add Secrets in GitHub

Navigate to your repository on GitHub:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Add the following 4 secrets:

| Secret Name           | Value                             | Description                                                             |
| --------------------- | --------------------------------- | ----------------------------------------------------------------------- |
| `DROPLET_HOST`        | `164.92.xxx.xxx`                  | Public IP address of your server                                        |
| `DROPLET_USER`        | `root`                            | SSH user (or deploy user)                                               |
| `DROPLET_SSH_KEY`     | Contents of`github_actions_rewaa` | **Private** SSH key (starts with `-----BEGIN OPENSSH PRIVATE KEY-----`) |
| `NEXT_PUBLIC_API_URL` | `https://api.yourdomain.com`      | Production backend API endpoint                                         |

_(Optional: Add `DROPLET_SSH_PORT` if your SSH port is not 22)._

#### 3. Trigger Deployment

1. Push any commit to `main`, or:
2. Go to the **Actions** tab on GitHub, select **Build & Deploy to Digital Ocean**, and click **Run workflow**.

The workflow will:

1. Build the Next.js standalone container on a 7 GB runner.
2. Push the image to `ghcr.io/amrmohamed27/rewaa:latest`.
3. SSH into your droplet, run `docker compose pull`, and restart the container seamlessly.

---

## 🛠️ Server Management & Useful Commands

### Check Container Status

```bash
cd /opt/rewaa
docker compose -f docker-compose.prod.yml ps
```

### View Live Application Logs

```bash
cd /opt/rewaa
docker compose -f docker-compose.prod.yml logs -f app
```

### Restart the Application

```bash
cd /opt/rewaa
docker compose -f docker-compose.prod.yml restart app
```

### Monitor Memory & CPU Usage

```bash
docker stats
```

_(You will see `rewaa-app` using ~150–200 MB RAM and < 1% CPU when idle)._

### Manually Pull and Update

If you ever want to update manually without GitHub Actions:

```bash
cd /opt/rewaa
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
docker image prune -f
```

---

## ❓ Troubleshooting

| Issue                                              | Cause                                                         | Resolution                                                                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **502 Bad Gateway from Nginx**                     | Next.js container is not running or listening on another port | Run`docker ps` to verify `rewaa-app` is up. Check `docker compose logs app`. Verify `proxy_pass` port in Nginx matches `docker-compose.prod.yml`.                                           |
| **GitHub Actions SSH fails (`Permission denied`)** | Private key in GitHub Secrets doesn't match`authorized_keys`  | Ensure the entire private key (including header and footer lines) is copied into`DROPLET_SSH_KEY`, and the matching public key is in `/root/.ssh/authorized_keys`.                          |
| **Port 3000 already in use**                       | Your backend or another app is already using port 3000        | In`/opt/rewaa/.env`, set `APP_PORT=3005`. In `/etc/nginx/sites-available/rewaa`, change `127.0.0.1:3000` to `127.0.0.1:3005`. Run `sudo systemctl reload nginx` and `docker compose up -d`. |
| **Droplet disk filling up**                        | Old Docker images accumulating                                | Run`docker image prune -af` and `docker builder prune -f`. The deployment script automatically prunes dangling images on each deploy.                                                       |
| **Certbot SSL renewal failure**                    | Port 80 blocked or DNS mismatch                               | Ensure UFW allows port 80:`sudo ufw allow 80/tcp`. Test renewal with `sudo certbot renew --dry-run`.                                                                                        |

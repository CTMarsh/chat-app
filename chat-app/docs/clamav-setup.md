# ClamAV Anti-Virus Setup Guide

This guide explains how to set up ClamAV virus scanning for file uploads in the chat application.

## Architecture

```
User Upload → Edge Function (scan-file) → ClamAV REST API → Supabase Storage
                                              ↓
                                    (Block if infected)
```

## Prerequisites

- A VPS or server with Docker installed (DigitalOcean, Linode, Hetzner, AWS, etc.)
- Minimum 1GB RAM (2GB recommended for better performance)
- About 1GB disk space for virus definitions

## Step 1: Deploy ClamAV REST API

### Option A: Docker Compose (Recommended)

Create a `docker-compose.yml` file on your server:

```yaml
version: '3.8'

services:
  clamav:
    image: ajilach/clamav-rest:latest
    container_name: clamav-rest
    restart: unless-stopped
    ports:
      - "3310:8080"
    environment:
      - MAX_FILE_SIZE=52428800  # 50MB
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 120s
```

Start the service:

```bash
docker-compose up -d
```

### Option B: Docker Run

```bash
docker run -d \
  --name clamav-rest \
  --restart unless-stopped \
  -p 3310:8080 \
  -e MAX_FILE_SIZE=52428800 \
  ajilach/clamav-rest:latest
```

### Wait for Initialization

ClamAV takes 1-2 minutes to download virus definitions on first start. Check logs:

```bash
docker logs -f clamav-rest
```

Wait until you see: `ClamAV REST API is ready`

### Test the API

```bash
# Health check
curl http://localhost:3310/health

# Scan a file
curl -F "file=@/path/to/test-file.txt" http://localhost:3310/scan
```

Expected response for clean file:
```json
{"Status": "OK"}
```

## Step 2: Secure the API (Important!)

### Option A: Nginx Reverse Proxy with SSL

Install Nginx and Certbot:

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Create Nginx config (`/etc/nginx/sites-available/clamav`):

```nginx
server {
    listen 80;
    server_name clamav.yourdomain.com;

    location / {
        proxy_pass http://localhost:3310;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }
}
```

Enable and get SSL:

```bash
sudo ln -s /etc/nginx/sites-available/clamav /etc/nginx/sites-enabled/
sudo certbot --nginx -d clamav.yourdomain.com
sudo systemctl restart nginx
```

### Option B: Cloudflare Tunnel (Easier)

Use Cloudflare Tunnel to expose the API securely without opening ports:

```bash
cloudflared tunnel --url http://localhost:3310
```

## Step 3: Configure Supabase Edge Function

Set the environment variable in your Supabase project:

1. Go to Supabase Dashboard → Edge Functions → Settings
2. Add a new secret:
   - Name: `CLAMAV_API_URL`
   - Value: `https://clamav.yourdomain.com` (your ClamAV API URL)

Or via CLI:

```bash
supabase secrets set CLAMAV_API_URL=https://clamav.yourdomain.com
```

## Step 4: Test the Integration

1. Log into your chat application
2. Try uploading a clean file - it should upload successfully
3. Test with EICAR test file (harmless virus test signature):

Create a file named `eicar.txt` with this content:
```
X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*
```

Try uploading it - you should see an error: "File rejected: Threat detected"

## Monitoring

### View ClamAV Logs

```bash
docker logs -f clamav-rest
```

### Check Virus Definition Updates

Definitions update automatically every 4 hours. Check status:

```bash
docker exec clamav-rest freshclam --version
```

### Resource Usage

Monitor memory usage (expect 600-800MB):

```bash
docker stats clamav-rest
```

## Troubleshooting

### "Virus scan service unavailable"

- Check if ClamAV container is running: `docker ps`
- Check container logs: `docker logs clamav-rest`
- Verify the URL is correct in environment variable

### "File scan failed"

- Check Edge Function logs in Supabase Dashboard
- Verify network connectivity between Supabase and your ClamAV server
- Ensure SSL certificate is valid

### High Memory Usage

ClamAV requires significant memory for virus definitions. If running out of memory:

1. Add swap space:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

2. Or use a larger VPS instance

## Cost Estimate

| Provider | Smallest Suitable Plan | Monthly Cost |
|----------|----------------------|--------------|
| DigitalOcean | Basic Droplet (1GB) | ~$6 |
| Linode | Nanode (1GB) | ~$5 |
| Hetzner | CX11 (2GB) | ~$4 |
| Vultr | Cloud Compute (1GB) | ~$5 |

## Alternative: Disable Scanning

If you don't want to set up ClamAV, the application will skip scanning when `CLAMAV_API_URL` is not configured. Files will upload without virus scanning.

**Note:** This is not recommended for production applications with untrusted file uploads.

# 🚀 SJSU Parking Viz - Complete Deployment Guide

## 📋 **What You're Building:**

- **24/7 automatic** parking data collection every 3 minutes
- **No manual intervention** required after initial setup
- **Secure** - no public admin panels or vulnerabilities
- **Self-monitoring** - system status page for health checks
- **Dark/Light mode** - beautiful theme toggle for user preference

---

## 🔧 **Step 1: QStash Setup**

### 1.1 Create QStash Account

1. Go to [Upstash QStash Console](https://console.upstash.com/qstash)
2. Create a **free account** (no credit card required)
3. Copy these 3 tokens from your dashboard:
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`

### 1.2 What QStash Does

- **Automatic scheduling** - runs your scraper every 3 minutes
- **Retries on failure** - if SJSU website is down, it retries
- **Signature verification** - secures your API endpoints
- **Unlimited jobs** - no Vercel cron limit (1 job max)

---

## 🗄️ **Step 2: Database Setup**

You already have **Neon PostgreSQL** configured ✅

---

## 🚀 **Step 3: Deploy to Vercel**

### 3.1 Set Environment Variables in Vercel

Add these to your Vercel project settings:

```bash
# Database (you already have this)
DATABASE_URL=postgresql://neondb_owner:npg_YemgS86PqFLM@...

# QStash (get from Step 1)
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_current_key_here
QSTASH_NEXT_SIGNING_KEY=your_next_key_here

# Security & Config
CRON_SECRET=any-secure-random-string
SJSU_PARKING_URL=https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain
```

### 3.2 Deploy

```bash
vercel --prod
```

---

## ⚡ **Step 4: Start 24/7 Scheduler (ONE TIME ONLY)**

After deployment, run this **once** to start the automatic scraper:

```bash
curl -X POST https://your-app.vercel.app/api/setup-scheduler \
  -H "Authorization: Bearer your-cron-secret"
```

**That's it!** Your system now runs 24/7 automatically.

---

## 📊 **Step 5: Monitor & Verify**

### Check System Status

Visit: `https://your-app.vercel.app/status`

You should see:

- ✅ **QStash Configured**: Running
- ✅ **Schedule Active**: Every 3 minutes
- ✅ **Data Collection**: 480 scrapes/day

### Check Your Dashboard

Visit: `https://your-app.vercel.app`

You should see parking data updating every 3 minutes.

---

## 🔒 **Security Features**

### ✅ **What's Secure:**

- **No public admin panels** - removed the `/admin` route
- **API authentication** - QStash signature verification
- **Setup protection** - requires CRON_SECRET to start scheduler
- **Environment secrets** - all tokens in Vercel environment variables

### ❌ **What Was Fixed:**

- ~~Removed insecure `/admin` panel~~
- ~~Removed manual schedule management~~
- ~~Added proper authentication~~

---

## 📈 **System Specifications**

| Feature                | Value                  |
| ---------------------- | ---------------------- |
| **Scraping Frequency** | Every 3 minutes        |
| **Daily Collections**  | 480 scrapes            |
| **Uptime**             | 24/7 automatic         |
| **Retries**            | Automatic via QStash   |
| **Security**           | Signature verification |
| **Monitoring**         | Built-in status page   |

---

## 🛠️ **Troubleshooting**

### Problem: Status page shows "Not Running"

**Solution:** Run the setup command again:

```bash
curl -X POST https://your-app.vercel.app/api/setup-scheduler \
  -H "Authorization: Bearer your-cron-secret"
```

### Problem: "QStash not configured"

**Solution:** Check that these environment variables are set in Vercel:

- `QSTASH_TOKEN`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`

### Problem: Setup returns "Unauthorized"

**Solution:** Make sure you're using the correct `CRON_SECRET` value.

---

## 🎉 **Success!**

Your SJSU Parking Visualization system is now:

- ✅ Running automatically 24/7
- ✅ Collecting data every 3 minutes
- ✅ Secure with proper authentication
- ✅ Self-monitoring with status page
- ✅ Dark/light mode theme toggle
- ✅ Tracking analytics with Vercel
- ✅ Ready for thousands of student visitors!

**No more manual intervention required!** 🎊

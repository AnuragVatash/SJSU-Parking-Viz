# 🔧 QStash Setup Guide

## ❓ **Why No Logs in QStash Dashboard?**

QStash only shows activity **after** you create a schedule. The dashboard is empty until you programmatically create schedules via API.

---

## 🚀 **Complete Setup Process:**

### **Step 1: Get QStash Credentials**

1. Visit [Upstash QStash Console](https://console.upstash.com/qstash)
2. Create free account
3. Copy these 3 tokens:
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`

### **Step 2: Deploy to Vercel**

```bash
# Deploy your app
vercel --prod

# Note your deployed URL (e.g., https://your-app.vercel.app)
```

### **Step 3: Set Environment Variables in Vercel**

In Vercel dashboard → Settings → Environment Variables:

```bash
DATABASE_URL=postgresql://neondb_owner:npg_YemgS86PqFLM@...
QSTASH_TOKEN=your_qstash_token_here
QSTASH_CURRENT_SIGNING_KEY=your_current_key
QSTASH_NEXT_SIGNING_KEY=your_next_key
CRON_SECRET=your-secure-random-string
SJSU_PARKING_URL=https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain
```

### **Step 4: Create QStash Schedule (ONE TIME)**

```bash
curl -X POST https://your-app.vercel.app/api/setup-scheduler \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

**Expected Response:**

```json
{
  "success": true,
  "message": "SJSU Parking scraper now running 24/7 every 3 minutes!",
  "scheduleId": "scd_xxxxx",
  "cron": "*/3 * * * *",
  "frequency": "480 times per day"
}
```

---

## 📊 **What You'll See in QStash Dashboard:**

### **Before Setup:**

- ❌ No schedules
- ❌ No logs
- ❌ No activity

### **After Setup (within 5 minutes):**

- ✅ **Schedules Tab**: 1 active schedule running `*/3 * * * *`
- ✅ **Logs Tab**: HTTP calls every 3 minutes to your scraper
- ✅ **Stats**: Growing request count and success rate

---

## 🔍 **Monitoring Your System:**

### **QStash Dashboard** (https://console.upstash.com/qstash)

- **Schedules**: See your parking scraper schedule
- **Logs**: HTTP requests every 3 minutes
- **Stats**: Success rate and performance metrics

### **Your App Status Page**

- Visit: `https://your-app.vercel.app/status`
- Should show: "QStash Configured: Running"
- Schedule details and last execution times

### **Your Main Dashboard**

- Visit: `https://your-app.vercel.app`
- Should show: Live parking data updating every 3 minutes

---

## 🛠️ **Troubleshooting:**

### **Problem: "endpoint resolves to a loopback address"**

**Solution:** QStash can't call localhost. Deploy to Vercel first.

### **Problem: "Unauthorized"**

**Solution:** Check that `CRON_SECRET` matches between local and Vercel.

### **Problem: "QSTASH_TOKEN missing"**

**Solution:** Set environment variables in Vercel dashboard.

### **Problem: No activity in QStash dashboard**

**Solution:** Wait 3 minutes after setup - first request takes time.

---

## ✅ **Success Indicators:**

You'll know it's working when:

1. **Setup Command Returns:**

   ```json
   {
     "success": true,
     "scheduleId": "scd_xxxxx"
   }
   ```

2. **QStash Dashboard Shows:**

   - Active schedule in Schedules tab
   - HTTP requests every 3 minutes in Logs tab

3. **Your Dashboard Shows:**

   - Live parking data
   - "Last updated" time advancing every 3 minutes

4. **Database Contains:**
   - New garage readings every 3 minutes
   - Growing dataset for predictions

---

## 🎯 **Expected Timeline:**

- **T+0**: Run setup command → Schedule created
- **T+3min**: First scraper execution → Data collection starts
- **T+5min**: QStash logs show activity
- **T+10min**: Dashboard shows updated parking data
- **T+1hour**: Prediction system has enough data

---

## 🎉 **Final Result:**

Your SJSU Parking Visualization will:

- ✅ Collect data automatically 24/7
- ✅ Update every 3 minutes (480 times/day)
- ✅ Show logs in QStash dashboard
- ✅ Display live data to students
- ✅ Generate accurate predictions

**No more manual intervention needed!**

# SJSU Parking Visualization Dashboard

A comprehensive real-time parking visualization system for San José State University that scrapes garage data, stores it in a time-series database, and provides predictions based on historical patterns.

## 🚀 Features

- **Real-time Data Collection**: Scrapes SJSU parking data every 3 minutes
- **Time-Series Storage**: Uses TimescaleDB (PostgreSQL extension) for efficient time-series data management
- **Smart Forecasting**: Seasonal naive forecasting with fallback strategies
- **Interactive Dashboard**: Modern UI built with Next.js, React, and shadcn/ui
- **Trend Analysis**: Historical pattern analysis with peak/off-peak hour identification
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Auto-refresh**: Live updates every 5 minutes with manual refresh option
- **Analytics**: Vercel Analytics for visitor tracking and usage insights

## 🏗️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL with TimescaleDB extension
- **Charts**: Recharts for data visualization
- **Scraping**: Cheerio for HTML parsing
- **Scheduling**: Vercel Cron Jobs (or configurable alternatives)
- **Deployment**: Vercel-ready with production optimizations

## 📊 Architecture

### Data Pipeline

1. **Scraping**: Fetches data from SJSU parking status page every minute
2. **Processing**: Extracts garage information and utilization percentages
3. **Storage**: Stores in TimescaleDB with automatic hypertable partitioning
4. **Aggregation**: Continuous aggregates for 5-minute and hourly rollups
5. **Forecasting**: Generates predictions using seasonal patterns
6. **Visualization**: Real-time dashboard with charts and insights

### Database Schema

- `garage_readings`: Main hypertable for minute-level readings
- `garage_readings_5min`: 5-minute continuous aggregate
- `garage_readings_hourly`: Hourly continuous aggregate
- Automatic retention policies for data lifecycle management

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 14+ with TimescaleDB extension
- Git

### 1. Database Setup

#### Install TimescaleDB

```bash
# Ubuntu/Debian
sudo apt install postgresql-14 postgresql-14-timescaledb-2.11.0

# macOS
brew install timescaledb

# Enable extension in PostgreSQL
psql -d your_database -c "CREATE EXTENSION timescaledb CASCADE;"
```

#### Create Database

```sql
CREATE DATABASE parking_viz;
\c parking_viz;
CREATE EXTENSION timescaledb CASCADE;
```

### 2. Application Setup

```bash
# Clone and install dependencies
git clone <your-repo>
cd sjsu-parking-viz
pnpm install

# Configure environment variables
cp .env.local.example .env.local
```

### 3. Environment Configuration

Edit `.env.local`:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/parking_viz?sslmode=prefer"

# SJSU Parking Data Source
SJSU_PARKING_URL="https://sjsuparkingstatus.sjsu.edu/GarageStatusPlain"

# Cron Job Secret (generate a secure random string)
CRON_SECRET="your-secure-random-secret-here"
```

### 4. Initialize Database Schema

```bash
# Run the application once to initialize database
pnpm dev

# Or manually initialize (optional)
curl -X POST http://localhost:3000/api/scrape \
  -H "Authorization: Bearer your-cron-secret"
```

### 5. Development

```bash
# Start development server
pnpm dev

# Access dashboard
open http://localhost:3000
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Database Setup**: Use a cloud PostgreSQL service with TimescaleDB:

   - [Timescale Cloud](https://cloud.timescale.com/) (recommended)
   - [Neon](https://neon.tech/) with TimescaleDB
   - [Supabase](https://supabase.com/) with TimescaleDB extension

2. **Deploy to Vercel**:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel --prod
   ```

3. **Configure Environment Variables** in Vercel Dashboard:

   - `DATABASE_URL`: Your TimescaleDB connection string
   - `SJSU_PARKING_URL`: SJSU parking status URL
   - `CRON_SECRET`: Secure random string for cron job authentication

4. **Verify Cron Jobs**: Vercel will automatically set up cron jobs based on `vercel.json`

### Manual Deployment

For other platforms, ensure:

- PostgreSQL with TimescaleDB is available
- Environment variables are configured
- Cron jobs or scheduled tasks call `/api/scrape` every minute

## 📖 API Reference

### Core Endpoints

#### `GET /api/garages`

Returns current status of all garages.

**Response:**

```json
{
  "success": true,
  "timestamp": "2025-01-01T12:00:00.000Z",
  "garages": [
    {
      "garage_id": "south-garage",
      "garage_name": "South Garage",
      "address": "377 S. 7th St., San Jose, CA 95112",
      "occupied_percentage": 17.5,
      "capacity": 1200,
      "occupied_spaces": 210,
      "last_updated": "2025-01-01T11:59:00.000Z"
    }
  ]
}
```

#### `GET /api/forecast?garage_id=south-garage&minutes=60`

Returns utilization predictions for a specific garage.

#### `GET /api/trends?garage_id=south-garage&days=7`

Returns trend analysis and historical data.

#### `POST /api/scrape`

Triggers manual data collection (requires authentication).

### Data Collection

The system automatically:

- Scrapes data every minute via Vercel Cron
- Handles duplicate data with upsert operations
- Generates continuous aggregates for performance
- Manages data retention policies

## 🔍 Forecasting Methodology

### Seasonal Naive Approach

1. **Primary**: Uses same time last week (7 days ago)
2. **Fallback 1**: Same weekday and hour average
3. **Fallback 2**: Same hour across all days
4. **Final**: Overall historical average

### Future Enhancements

- TBATS for complex seasonal patterns
- Prophet for holiday/event detection
- Machine learning models for improved accuracy

## 🎯 Features in Dashboard

### Overview Tab

- Real-time garage status cards
- Utilization levels with color coding
- Trend indicators and next-hour predictions
- Quick stats and refresh controls

### Detailed View

- Interactive charts with historical data
- Prediction visualization
- Garage selection and comparison
- Time-series analysis

### Analytics Tab

- Trend analysis (increasing/decreasing/stable)
- Peak and off-peak hour identification
- Usage pattern insights
- Historical performance metrics

## 🛡️ Production Considerations

### Performance

- TimescaleDB continuous aggregates for fast queries
- Efficient data retention policies
- Optimized React components with proper memoization

### Reliability

- Error handling for scraping failures
- Database connection pooling
- Graceful degradation when data is unavailable

### Security

- API authentication for cron jobs
- Environment variable protection
- CORS configuration for production

### Monitoring

- Built-in health checks
- Error logging and tracking
- Performance metrics collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines

- Use TypeScript for type safety
- Follow existing code formatting
- Write descriptive commit messages
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

For issues, questions, or contributions:

1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include relevant error logs and environment details

## 🚀 Roadmap

- [ ] Enhanced forecasting with TBATS/Prophet
- [ ] Mobile app development
- [ ] Email/SMS notifications for full garages
- [ ] Historical data export functionality
- [ ] Multi-university support
- [ ] Machine learning model integration
- [ ] Real-time WebSocket updates

# 🏈 StatMind Sports - NFL Prediction Platform

An advanced NFL game prediction system powered by statistical analysis and machine learning algorithms. Features automated weekly predictions with 79.7% historical accuracy.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- PM2 (for production)

### Installation

1. **Clone the repository**
```bash
   git clone https://github.com/yourusername/statmind-sports.git
   cd statmind-sports
```

2. **Install backend dependencies**
```bash
   npm install
```

3. **Install frontend dependencies**
```bash
   cd frontend
   npm install
   cd ..
```

4. **Configure environment variables**
```bash
   cp .env.example .env
   # Edit .env with your database credentials
```

5. **Set up the database**
```bash
   psql -U postgres -f src/config/schema.sql
```

6. **Start the application**
   
   **Development:**
```bash
   # Backend
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
```
   
   **Production:**
```bash
   pm2 start ecosystem.config.cjs
```

## 📁 Project Structure

- `/src` - Backend API (Express.js)
- `/frontend` - Frontend UI (Next.js)
- `/docs` - Project documentation
- `/scripts` - Utility scripts

## 🔗 Important Links

- **Live Site**: https://statmindsports.com
- **API Documentation**: See `/docs` folder
- **Technical Specs**: See `docs/Technical Requirements Document.pdf`

## 📊 Tech Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL
- node-cron (scheduling)
- Winston (logging)

**Frontend:**
- Next.js 15
- React 19
- Tailwind CSS
- Recharts

## 🤝 Contributing

This is a private project. For questions or issues, contact the development team.

## 📝 License

Private - All Rights Reserved

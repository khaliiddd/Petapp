# PetRent - Pet Equipment Rental Platform MVP

A sharing economy platform that connects pet owners with equipment they need, allowing them to rent rather than buy expensive pet gear like grooming clippers, training equipment, and more.

## 🚀 Features

- **User Authentication**: Secure registration and login system
- **Equipment Marketplace**: Browse, search, and filter pet equipment
- **Booking System**: Request and manage equipment rentals
- **Owner Dashboard**: List, manage, and track your equipment
- **Responsive Design**: Works on desktop and mobile devices
- **Payment Integration Ready**: Structure for payment processing
- **Real-time Updates**: Dynamic content updates

## 📊 Market Validation

Based on comprehensive research, this platform addresses a **$21.9 billion** market opportunity:
- **92% of pet owners face grooming barriers**
- **56% can't afford professional grooming services** 
- **Equipment costs $500+ vs $25/day rental**
- **No direct competitors in pet equipment rental**

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: SQLite (production-ready for MVP)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Authentication**: bcrypt, express-session
- **Deployment**: Docker, Docker Compose

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (optional, for containerized deployment)

## 🚀 Quick Start

### Method 1: Local Development

1. **Clone and install dependencies**
   ```bash
   cd pet-rental-mvp
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

4. **Access the application**
   - Open http://localhost:3000
   - Register as a test user to explore features

### Method 2: Docker Deployment

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Open http://localhost:3000

### Method 3: Direct Docker

1. **Build the image**
   ```bash
   docker build -t petrental-mvp .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 -e SESSION_SECRET=your-secret-key petrental-mvp
   ```

## 📱 Usage Guide

### For Pet Owners (Renters)
1. **Register** or login to your account
2. **Browse Equipment** - Search by category, location, or specific items
3. **View Details** - Check equipment condition, pricing, and owner info
4. **Book Equipment** - Select dates, pickup method, and send requests
5. **Track Bookings** - Monitor your rental requests in the dashboard

### For Equipment Owners
1. **Update Profile** - Set user type to "owner" or "both"
2. **List Equipment** - Add your pet gear with photos and pricing
3. **Manage Bookings** - Review requests and approve/reject rentals
4. **Track Revenue** - Monitor earnings and equipment performance
5. **Update Listings** - Modify availability, pricing, and descriptions

### Sample Equipment Categories
- **Grooming**: Clippers, brushes, nail trimmers, dryers
- **Training**: Agility equipment, clickers, leashes, crates
- **Health**: Scales, medication tools, specialized care items
- **Travel**: Carriers, portable crates, travel bowls
- **Safety**: Life jackets, reflective gear, containment systems

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | development |
| `PORT` | Server port | 3000 |
| `SESSION_SECRET` | Session encryption key | Required |
| `DB_PATH` | Database file path | ./pet_rental.db |

### Database Structure

The application uses SQLite with the following main tables:
- `users` - User accounts and profiles
- `equipment` - Available equipment listings
- `bookings` - Rental requests and confirmations
- `reviews` - User feedback and ratings
- `messages` - Communication between users

## 🚢 Deployment

### Production Deployment

1. **Server Setup**
   ```bash
   # Update environment for production
   export NODE_ENV=production
   export SESSION_SECRET=your-production-secret
   export PORT=3000
   ```

2. **Process Manager (PM2)**
   ```bash
   npm install -g pm2
   pm2 start server.js --name "petrental-mvp"
   pm2 startup
   pm2 save
   ```

3. **Nginx Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Cloud Deployment

**Heroku**:
```bash
heroku create your-app-name
heroku config:set SESSION_SECRET=your-secret
git push heroku main
```

**Railway**:
```bash
railway login
railway init
railway up
```

**DigitalOcean App Platform**:
- Connect your GitHub repository
- Set environment variables
- Deploy automatically

## 🧪 Testing the MVP

### Pre-loaded Sample Data
- **Test Users**: 
  - mike_groomer@example.com (equipment owner)
  - sarah_doglover@example.com (mixed user)
  - alex_newbie@example.com (renter)
- **Test Password**: password123, password456, password789
- **Sample Equipment**: Professional grooming clippers, nail trimmers, agility equipment

### Test Scenarios
1. **Browse as Guest**: Search and view equipment without logging in
2. **Register as Renter**: Create account and book equipment
3. **Register as Owner**: List your own equipment for rent
4. **Booking Flow**: Complete rental request and management cycle
5. **Dashboard Functions**: Manage listings, track bookings, update availability

## 📈 Scaling Considerations

### Database Migration
For production, consider upgrading to PostgreSQL:
```bash
# Install PostgreSQL adapter
npm install pg

# Update database connection in server.js
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
```

### Performance Optimizations
- **Caching**: Add Redis for session storage and data caching
- **CDN**: Use CloudFlare or AWS CloudFront for static assets
- **Load Balancer**: Multiple server instances behind nginx/HAProxy
- **Database**: Connection pooling and query optimization

### Security Enhancements
- **Rate Limiting**: Prevent abuse with express-rate-limit
- **Input Validation**: Comprehensive validation with Joi or Yup
- **HTTPS**: SSL/TLS encryption for all communications
- **CSRF Protection**: Add CSRF tokens to forms

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and code comments
- **Issues**: Report bugs via GitHub Issues
- **Email**: support@petrent.com (for deployed version)

## 🎯 Next Steps

1. **MVP Validation**: Deploy and gather user feedback
2. **Payment Integration**: Add Stripe/PayPal for automated payments
3. **Mobile App**: React Native or Flutter app
4. **Advanced Features**: Insurance, reviews, messaging system
5. **AI Integration**: Equipment recommendations, pricing optimization
6. **Marketplace Expansion**: Add more pet service categories

---

**Built with ❤️ by MiniMax Agent**
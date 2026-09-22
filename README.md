# SocialGuard - Social Engineering Attack Simulator

&nbsp;

## 🚀 Deployment

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://social-guard-one.vercel.app/)

[![Live Project](https://img.shields.io/badge/Live%20Project-social--guard--one.vercel.app-green?style=for-the-badge&logo=vercel)](https://social-guard-one.vercel.app/)

## 🖼️ Prototype Screenshots

<table>
  <tr>
    <td align="center">
      <img src="Frontend/public/dashboard.png" alt="Homepage Screenshot" width="420"/>
      <br/>
      <b>Homepage View</b>
    </td>
    <td align="center">
      <img src="Frontend/public/analytics.png" alt="Analytics Screenshot" width="420"/>
      <br/>
      <b>Analytics View</b>
    </td>
  </tr>
</table>

## ⚡ Overview

SocialGuard is a comprehensive platform designed to help organizations defend against social engineering attacks through simulation, training, and analytics. The platform enables you to create realistic attack scenarios, train employees, and measure effectiveness through detailed reporting. With pre-built phishing templates, advanced tracking capabilities, and educational modules, SocialGuard provides a complete solution for social engineering defense.

## ✨ Features

- 🎯 **Attack Library** - Pre-configured social engineering attack scenarios
- 👥 **Employee Management** - Add and manage employees for targeted simulations
- 🔧 **Simulation Builder** - Create attack scenarios tailored to your organization with customizable templates
- 📚 **Training Modules** - Educational resources to help employees identify and respond to attacks
- 📊 **Analytics Dashboard** - Track simulation results and  with detailed metrics

## 📋 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Java 17 or higher
- Maven 3.8+
- npm or yarn
- Supabase account
- SendGrid account (for email functionality)
- Twilio account (for SMS functionality)

### Frontend Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shubhamaher8/SocialGuard.git
   cd SocialGuard
   ```

2. Install frontend dependencies:
   ```bash
   cd Frontend
   npm install
   ```

3. Set up frontend environment variables:
   Create a `.env` file in the `Frontend` directory:
   ```
   PARCEL_VITE_SUPABASE_URL=your_supabase_url
   PARCEL_VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:1234`

### Backend Installation

1. Navigate to the backend directory:
   ```bash
   cd ../Backend
   ```

2. Set these 7 environment variables before running:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_key
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender_email
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   ```

3. Build and run the backend:
   ```bash
   mvn clean package
   java -jar target/socialguard-backend-1.0.0.jar
   ```

   Or run directly with Maven:
   ```bash
   mvn spring-boot:run
   ```

4. The backend server starts on `http://localhost:8080`

### Deployment

The application is configured for deployment on Vercel and Render:

- Frontend: Deployed via Vercel's automatic build process using Parcel
- Backend: Deployed on Render

## 📊 Project Structure

```
SocialGuard/
├── Backend/                              # Spring Boot 3.2 (Java 17) API server
│   ├── pom.xml                           # Maven dependencies & build config
│   ├── Dockerfile                        # Docker container build
│   ├── src/main/java/com/socialguard/
│   │   ├── SocialGuardApplication.java   # Spring Boot entry point
│   │   ├── config/
│   │   │   ├── AppConfig.java            # WebClient builder with timeout
│   │   │   ├── CorsConfig.java           # CORS policy configuration
│   │   │   └── StaticConfig.java         # Static resource handler
│   │   ├── controller/
│   │   │   ├── MessagingController.java  # Email & SMS campaign endpoints
│   │   │   ├── PhishingController.java   # Phishing login pages & credential capture
│   │   │   └── PreviewController.java    # Template preview routes
│   │   ├── dto/
│   │   │   ├── ApiResponse.java          # Standard API response body
│   │   │   ├── Recipient.java            # Email recipient model
│   │   │   ├── SendEmailRequest.java     # Email request payload
│   │   │   └── SendSmsRequest.java       # SMS request payload
│   │   └── service/
│   │       ├── EmailService.java         # SendGrid email dispatch
│   │       ├── SmsService.java           # Twilio SMS dispatch
│   │       ├── GeoService.java           # ip-api.com geo-location lookup
│   │       ├── SupabaseService.java      # Supabase REST client for data logging
│   │       └── VisitorService.java       # Visitor & credential logging
│   └── src/main/resources/
│       ├── application.properties        # Server config & API keys
│       └── static/                       # Phishing page HTML & lure images
├── Frontend/               
│   ├── node_modules          
│   ├── public/            
│   ├── src/               
│   │   ├── app.js               # Main application logic
│   │   ├── request.js           # API request handling
│   │   ├── index.html           # Dashboard page
│   │   ├── login.html           # Authentication pages
│   │   ├── register.html  
│   │   ├── add_workers.html     # Employee management
│   │   ├── style.css            # Global styles
│   │   └── training_*.html      # Training module pages
│   ├── .env                     # Environment variables for frontend
│   └── package.json             # Node.js dependencies
└── README.md                    # Project documentation
```

## 🛠️ Tech Stack

### Frontend
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Parcel](https://img.shields.io/badge/Parcel-FFC0CB?style=for-the-badge&logo=parcel&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chart.js&logoColor=white)

### Backend
![Java](https://img.shields.io/badge/Java%2017-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot%203.2-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apache-maven&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![SendGrid](https://img.shields.io/badge/SendGrid-1A82E2?style=for-the-badge&logo=sendgrid&logoColor=white)
![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=for-the-badge&logo=twilio&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

### Deployment
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Render-000000?style=for-the-badge&logo=render&logoColor=white)

## 📝 Training Modules

SocialGuard includes comprehensive training modules to educate employees about various aspects of social engineering:

1. **Identifying Social Engineering** - Learn to recognize common social engineering tactics
2. **Email Security Best Practices** - Protect against phishing and other email-based attacks
3. **Phone & Text Message Security** - Defend against vishing and smishing attempts
4. **Physical Security Awareness** - Prevent tailgating and other in-person social engineering

## 🔒 Security Features

- Secure authentication via Supabase
- Realistic attack simulations without compromising actual security
- Detailed analytics to identify vulnerable areas in your organization

## ☑️ Use Cases

### For Security Teams
- Run realistic phishing campaigns to test employee awareness
- Generate detailed reports on security vulnerabilities
- Train employees based on targeted weaknesses

### For Employees
- Learn to identify social engineering attempts through interactive training
- Practice responding to phishing attempts in a safe environment
- Track personal improvement over time

### For Organizations
- Reduce vulnerability to costly social engineering attacks
- Demonstrate compliance with security training requirements
- Create a culture of security awareness

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License

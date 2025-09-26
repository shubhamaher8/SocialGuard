# 🛡️ SocialGuard

<div align="center">
  <img src="Frontend/public/socialguard.png" alt="SocialGuard Logo" width="200"/>
  <h3>Social Engineering Attack Simulator</h3>
  <p>Test and improve your organization's resilience against social engineering attacks</p>
</div>

## 📋 Overview

SocialGuard is a comprehensive platform designed to help organizations defend against social engineering attacks through simulation, training, and analytics. The platform enables you to create realistic attack scenarios, train employees, and measure effectiveness through detailed reporting.

## ✨ Features

- 🎯 **Attack Library** - Pre-configured social engineering attack scenarios
- 👥 **Employee Management** - Add and manage employee information for targeted simulations
- 🔧 **Simulation Builder** - Create custom attack scenarios tailored to your organization
- 📚 **Training Modules** - Educational resources to help employees identify and respond to attacks
- 📊 **Analytics Dashboard** - Track simulation results and training effectiveness
- 📝 **Detailed Reporting** - Generate comprehensive reports on organizational security posture

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shubhamaher8/SocialGuard.git
   cd SocialGuard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PARCEL_VITE_SUPABASE_URL=your_supabase_url
   PARCEL_VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:1234`

## 🏗️ Project Structure

```
SocialGuard/
├── public/            # Static assets
│   └── socialguard.png
├── src/               # Source files
│   ├── app.js         # Main application logic
│   ├── index.html     # Main dashboard page
│   ├── login.html     # Authentication page
│   ├── register.html  # User registration page
│   ├── add_workers.html # Employee management page
│   ├── style.css      # Global styles
│   └── training_*.html # Training module pages
└── package.json       # Project dependencies and scripts
```

## 💻 Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Build Tool**: Parcel
- **Authentication & Database**: Supabase
- **Data Visualization**: Chart.js

## 📈 Training Modules

SocialGuard includes comprehensive training modules to educate employees about various aspects of social engineering:

1. **Identifying Social Engineering** - Learn to recognize common social engineering tactics
2. **Email Security Best Practices** - Protect against phishing and other email-based attacks
3. **Phone & Text Message Security** - Defend against vishing and smishing attempts
4. **Physical Security Awareness** - Prevent tailgating and other in-person social engineering

## 🔒 Security Features

- Secure authentication via Supabase
- Realistic attack simulations without compromising actual security
- Detailed analytics to identify vulnerable areas in your organization

## 📱 Screenshots

<div align="center">
  <p><i>Dashboard view of the SocialGuard platform</i></p>
  <img src="https://via.placeholder.com/800x450.png?text=SocialGuard+Dashboard" alt="Dashboard Screenshot" width="80%"/>
</div>

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

Shubham Aher - [shubhamaher8](https://github.com/shubhamaher8)

Project Link: [https://github.com/shubhamaher8/SocialGuard](https://github.com/shubhamaher8/SocialGuard)

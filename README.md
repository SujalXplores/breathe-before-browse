# 🧘‍♀️ Breathe Before Browse

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)
![Bundle Size](https://img.shields.io/badge/bundle%20size-94.8KB-success.svg)
![Compression](https://img.shields.io/badge/gzip-70.2%25%20smaller-orange.svg)

*Mindful pause interventions for social media browsing*

**A beautiful Chrome extension that creates conscious moments before accessing social media**

[🚀 Installation](#installation) • [✨ Features](#features) • [🛠️ Development](#development) • [📊 Performance](#performance)

</div>

---

## 🌟 Overview

Breathe Before Browse is a thoughtfully designed Chrome extension that promotes mindful social media consumption. With its serene design and intelligent interventions, it encourages users to pause and reflect before diving into social platforms, fostering healthier digital habits.

### 🎯 Purpose

In our fast-paced digital world, this extension serves as a gentle reminder to:
- **Practice mindfulness** before engaging with social media
- **Reduce impulsive browsing** behavior
- **Promote digital wellness** through conscious interaction
- **Create peaceful moments** in your daily routine

---

## ✨ Features

### 🎨 **Beautiful, Calming Design**
- **Serene Color Palette**: Peaceful blue-teal primary colors with soft purple accents
- **Glass Morphism Effects**: Modern translucent card designs with subtle shadows
- **Smooth Animations**: Gentle floating animations and gradient transitions
- **Mindful Typography**: Clean, readable fonts that promote calm focus

### 🌊 **Thoughtful User Experience**
- **Intuitive Interface**: Tab-based navigation (Overview, Settings, Insights)
- **Responsive Design**: Works seamlessly across different screen sizes
- **Accessible**: Built with screen readers and keyboard navigation in mind
- **Minimal Distractions**: Clean, focused design that doesn't overwhelm

### ⚡ **Performance Optimized**
- **70.2% Bundle Size Reduction**: Advanced gzip compression and minification
- **Smart Code Splitting**: Optimized vendor chunks for faster loading
- **Modern Build Pipeline**: TypeScript, Vite, and advanced optimization
- **Efficient Resource Usage**: Minimal memory footprint and CPU usage

### 🛡️ **Privacy First**
- **No Data Collection**: Your browsing habits stay private
- **Local Storage Only**: All data remains on your device
- **Minimal Permissions**: Only requests necessary Chrome APIs
- **Open Source**: Transparent codebase for community review

---

## 🚀 Installation

### **From Chrome Web Store** *(Coming Soon)*
1. Visit the Chrome Web Store
2. Search for "Breathe Before Browse"
3. Click "Add to Chrome"
4. Follow the installation prompts

## 🛠️ Development

### **Prerequisites**
- Node.js (≥22.12.0)
- npm or pnpm
- Chrome browser

### **Quick Start**
```bash
# Clone and setup
git clone https://github.com/yourusername/breathe-before-browse.git
cd breathe-before-browse
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check
```

### **Project Structure**
```
breathe-before-browse/
├── src/
│   ├── components/          # React components
│   │   ├── insights/        # Analytics and insights
│   │   ├── overview/        # Main dashboard
│   │   ├── settings/        # Configuration
│   │   └── ui/             # Reusable UI components
│   ├── background/         # Service worker scripts
│   ├── content/           # Content scripts
│   ├── popup/            # Extension popup
│   ├── styles/          # Tailwind CSS styles
│   └── utils/          # Utility functions
├── public/             # Static assets
├── scripts/           # Build scripts
└── dist/             # Built extension
```

### **Tech Stack**
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives
- **Build**: Vite with advanced optimization
- **Compression**: Custom gzip pipeline
- **Code Quality**: ESLint, Prettier, TypeScript strict mode

---

## 📊 Performance

### **Bundle Optimization**
Our advanced build pipeline delivers exceptional performance:

| Asset Type | Original Size | Compressed | Reduction |
|------------|---------------|------------|-----------|
| **React Vendor** | 190.18 KB | 61.50 KB | **68%** |
| **Main Bundle** | 27.00 KB | 6.56 KB | **76%** |
| **CSS Styles** | 29.90 KB | 5.52 KB | **82%** |
| **UI Components** | 10.35 KB | 3.00 KB | **71%** |
| **Utils** | 25.90 KB | 7.86 KB | **70%** |

**Total Bundle Size**: 94.8 KB (70.2% reduction from 317.87 KB)

### **Optimization Features**
- ✅ **Advanced Terser Configuration** with 3-pass compression
- ✅ **Smart Code Splitting** for optimal caching
- ✅ **Tree Shaking** for dead code elimination
- ✅ **Gzip Compression** at level 9
- ✅ **CSS Minification** and purging
- ✅ **Asset Optimization** for images and fonts

---

## 🎨 Design System

### **Color Palette**
```css
/* Primary Colors */
--primary: 195 65% 45%;        /* Calming Blue */
--accent: 260 70% 68%;         /* Soft Purple */

/* Backgrounds */
--background: 210 20% 98%;     /* Clean Off-white */
--card: 210 20% 100%;          /* Pure White */

/* Supporting Colors */
--muted: 210 15% 94%;          /* Light Gray */
--border: 210 15% 88%;         /* Subtle Border */
```

### **Typography**
- **Font Family**: System font stack for optimal performance
- **Scale**: Harmonious type scale from 10px to 24px
- **Weight**: Regular (400) and Semibold (600)

### **Animations**
- **Duration**: 200-300ms for snappy interactions
- **Easing**: Custom curves for natural movement
- **Effects**: Floating, gradient shifts, smooth transitions

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get involved:

### **Getting Started**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Use conventional commit messages
- Write tests for new features
- Ensure accessibility compliance
- Maintain the existing code style

### **Areas for Contribution**
- 🎨 **UI/UX Improvements**
- 🧠 **Mindfulness Features**
- 📊 **Analytics & Insights**
- 🌐 **Internationalization**
- 📱 **Cross-platform Support**
- 🔧 **Performance Optimizations**

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **React Team** - For the amazing React framework
- **Radix UI** - For accessible component primitives
- **Tailwind CSS** - For the utility-first CSS framework
- **Vite** - For the lightning-fast build tool
- **Open Source Community** - For inspiration and contributions

---

<div align="center">

**Made with ❤️ for mindful browsing**

*Take a breath. Browse with intention.*

</div>

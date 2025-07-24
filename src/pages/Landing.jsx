import React, { useState, useEffect } from 'react';
import { Clock, Users, ChefHat, ArrowRight, Utensils, Star, Zap, Shield, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../components/Common/ThemeToggle';
import Footer from '../components/Common/Footer';

const Landing = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen modern-gradient relative overflow-hidden transition-colors duration-300">

      {/* Header */}
      <header 
        className="glass-morphism border-b border-black/10 dark:border-white/15 fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 mb-2 sm:mb-0">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center group"
            >
              <div className="w-14 h-14 sm:w-20 sm:h-20 flex items-center justify-center mr-3 sm:mr-4 group-hover:scale-110 transition-all duration-500 relative overflow-hidden glass-morphism rounded-xl sm:rounded-2xl">
                <Coffee className="w-7 h-7 sm:w-12 sm:h-12 text-orange-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text tracking-wider">ChummaOrder</span>
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-400 font-medium">They queue. We cruise</div>
              </div>
            </div>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16 relative z-10 pt-24 sm:pt-32">
        <div 
          className="text-center mb-12 sm:mb-20"
          style={{
            transform: `translateY(${scrollY * 0.05}px)`,
          }}
        >
          <div className="mb-8">
          </div>
          
          <h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-black dark:text-white mb-6 sm:mb-8 tracking-tight leading-tight"
          >
            Skip the Queue,<br />
            <span className="gradient-text text-5xl sm:text-6xl md:text-7xl">Order Smart</span>
          </h1>
          
          <p 
            className="text-lg sm:text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed px-4"
            style={{
              transform: `translateY(${scrollY * 0.03}px)`,
            }}
          >
            Experience premium cuisine with modern convenience. Pre-order your favorite meals 
            and skip the wait with our intelligent ordering platform.
          </p>

          {/* Feature tags - hidden on mobile, shown on larger screens */}
          <div 
            className="hidden sm:flex flex-row gap-6 justify-center items-center mb-10"
            style={{
              transform: `translateY(${scrollY * 0.02}px)`,
            }}
          >
            {[
              { icon: Clock, text: "Quick Service", color: "orange" },
              { icon: Shield, text: "Quality Assured", color: "red" },
              { icon: Zap, text: "Smart Ordering", color: "yellow" }
            ].map((item, index) => (
              <div 
                key={index}
                className="flex items-center space-x-3 glass-card px-5 py-3 rounded-xl hover-lift magnetic-hover"
                style={{
                  animationDelay: `${index * 0.2}s`,
                }}
              >
                <item.icon className={`w-5 h-5 ${
                  item.color === 'orange' ? 'text-orange-500' : 
                  item.color === 'red' ? 'text-red-500' : 'text-yellow-500'
                }`} />
                <span className="text-sm font-medium text-gray-800 dark:text-white">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Role Selection Cards */}
        <div 
          className="responsive-grid max-w-5xl mx-auto mb-16"
          style={{
            transform: `translateY(${scrollY * 0.01}px)`,
          }}
        >
          {/* Student Card */}
          <Link to="/auth/student" className="group block">
            <div 
              className="glass-card rounded-2xl p-8 hover-lift transition-all duration-500 relative overflow-hidden interactive-card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/15 to-orange-500/15 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 glass-morphism rounded-2xl mb-6 sm:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shimmer-effect" style={{ boxShadow: '0 0 20px rgba(220, 38, 38, 0.3)' }}>
                  <Users className="w-8 sm:w-10 h-8 sm:h-10 text-red-500" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-4 group-hover:text-red-500 transition-colors">Student Portal</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed text-base sm:text-lg">
                  Browse delicious menus, place orders instantly, and track your food in real-time. 
                  Perfect for students who value convenience and quality.
                </p>
                <div className="flex items-center text-red-500 font-semibold group-hover:text-red-400 transition-colors text-base sm:text-lg">
                  <Shield className="w-5 sm:w-6 h-5 sm:h-6 mr-3" />
                  <span>Enter Portal</span>
                  <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 ml-3 transform group-hover:translate-x-3 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </Link>

          {/* Staff Card */}
          <Link to="/auth/staff" className="group block">
            <div 
              className="glass-card rounded-2xl p-8 hover-lift transition-all duration-500 relative overflow-hidden interactive-card"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/15 to-yellow-500/15 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 glass-morphism rounded-2xl mb-6 sm:mb-8 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shimmer-effect" style={{ boxShadow: '0 0 20px rgba(249, 115, 22, 0.3)' }}>
                  <ChefHat className="w-8 sm:w-10 h-8 sm:h-10 text-orange-500" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-4 group-hover:text-orange-500 transition-colors">Staff Portal</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 leading-relaxed text-base sm:text-lg">
                  Manage orders efficiently, update menus in real-time, and streamline operations. 
                  Professional tools for modern restaurant management.
                </p>
                <div className="flex items-center text-orange-500 font-semibold group-hover:text-orange-400 transition-colors text-base sm:text-lg">
                  <Shield className="w-5 sm:w-6 h-5 sm:h-6 mr-3" />
                  <span>Enter Portal</span>
                  <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 ml-3 transform group-hover:translate-x-3 transition-transform duration-300" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Enhanced Features Section */}
        <div 
          className="responsive-grid mb-16"
          style={{
            transform: `translateY(${scrollY * -0.01}px)`,
          }}
        >
          {[
            {
              icon: Clock,
              title: "Fast Service",
              description: "Quick ordering system that saves time during busy hours.",
              color: "orange",
              delay: "0s"
            },
            {
              icon: Utensils,
              title: "Fresh Food",
              description: "Carefully prepared dishes using fresh, quality ingredients.",
              color: "red",
              delay: "0.2s"
            },
            {
              icon: Star,
              title: "Easy Tracking",
              description: "Real-time updates and simple order tracking.",
              color: "yellow",
              delay: "0.4s"
            }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="text-center group magnetic-hover" 
              style={{ animationDelay: feature.delay }}
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 glass-morphism rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 floating-element shimmer-effect`} style={{ 
                boxShadow: feature.color === 'orange' 
                  ? '0 0 20px rgba(249, 115, 22, 0.3)'
                  : feature.color === 'red'
                  ? '0 0 20px rgba(220, 38, 38, 0.3)'
                  : '0 0 20px rgba(245, 158, 11, 0.3)'
              }}>
                <feature.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${
                  feature.color === 'orange' ? 'text-orange-500' :
                  feature.color === 'red' ? 'text-red-500' : 'text-yellow-500'
                }`} />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4 group-hover:text-orange-500 transition-colors">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors text-sm sm:text-base">{feature.description}</p>
            </div>
          ))}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Landing;

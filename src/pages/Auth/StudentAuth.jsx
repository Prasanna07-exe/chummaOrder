import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Mail, Lock, User, Phone, CreditCard, Shield, UserCheck, Star, Sparkles, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../../components/Common/ThemeToggle';
import Footer from '../../components/Common/Footer';

const StudentAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [focusedField, setFocusedField] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    registrationNumber: '',
    mobileNumber: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
        navigate('/student/dashboard');
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          'student',
          formData.mobileNumber,
          formData.registrationNumber
        );
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen modern-gradient relative overflow-hidden">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Enhanced Background Effects */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(99, 102, 241, 0.15) 0%, transparent 50%)`,
          transition: 'background 0.3s ease',
        }}
      />
      
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute w-64 h-64 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl floating-element"
          style={{ 
            top: '10%', 
            left: '10%',
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.05}px)`,
          }}
        />
        <div 
          className="absolute w-96 h-96 bg-gradient-to-r from-blue-500/8 to-indigo-500/8 rounded-full blur-3xl floating-element"
          style={{ 
            top: '60%', 
            right: '10%',
            animationDelay: '-3s',
            transform: `translate(${scrollY * -0.08}px, ${scrollY * 0.03}px)`,
          }}
        />
        <div 
          className="absolute w-48 h-48 bg-gradient-to-r from-purple-500/12 to-pink-500/12 rounded-full blur-3xl floating-element"
          style={{ 
            bottom: '20%', 
            left: '20%',
            animationDelay: '-6s',
            transform: `translate(${scrollY * 0.06}px, ${scrollY * -0.04}px)`,
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          {/* Enhanced Header with Advanced Animations */}
          <div className="text-center mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-300 mb-6 transition-all duration-500 hover-lift group magnetic-hover"
              style={{
                transform: `translateY(${scrollY * 0.05}px)`,
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="relative">
                Back to Home
                <div className="absolute inset-0 bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2" />
              </span>
            </Link>
            
            <div 
              className="flex items-center justify-center mb-6"
              style={{
                transform: `translateY(${scrollY * 0.02}px)`,
              }}
            >
              <div className="w-20 h-20 glass-morphism rounded-2xl flex items-center justify-center mr-4 hover:scale-110 transition-all duration-500 group relative overflow-hidden shimmer-effect" style={{ boxShadow: '0 0 30px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' }}>
                <Users className="w-10 h-10 text-gray-800 dark:text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                <Star className="absolute top-2 right-2 w-4 h-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                <Sparkles className="absolute bottom-2 left-2 w-3 h-3 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
              <div>
                <span className="text-3xl sm:text-4xl font-bold gradient-text tracking-wide">Student Portal</span>
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center justify-center mt-1">
                  <Award className="w-4 h-4 mr-1 text-indigo-500" />
                  Academic Excellence Hub
                </div>
              </div>
            </div>
            
            <p 
              className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed"
              style={{
                transform: `translateY(${scrollY * 0.03}px)`,
              }}
            >
              <span className="text-gray-800 dark:text-gray-300">
                {isLogin ? 'Welcome back! Access your academic dining experience' : 'Join our academic community - Create your student account'}
              </span>
            </p>
          </div>

          {/* Enhanced Form Container with Advanced Glass Morphism */}
          <div 
            className="auth-form-container rounded-2xl p-8 relative overflow-hidden border-indigo-500/30 hover-lift magnetic-hover"
          >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 animate-gradient-shift" style={{ backgroundSize: '200% 200%' }} />
            </div>
            
            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-indigo-400 rounded-full opacity-20 floating-element"
                  style={{
                    top: `${20 + (i * 15)}%`,
                    left: `${10 + (i * 12)}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: `${4 + (i * 0.5)}s`,
                  }}
                />
              ))}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <div className="toast-error rounded-lg p-4 animate-in slide-in-from-top-2 duration-300 border border-red-500/30" style={{ boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)' }}>
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors duration-300">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'fullName' ? 'text-indigo-400 scale-110 rotate-12' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors duration-300">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    Registration Number
                  </label>
                  <div className="relative">
                    <CreditCard className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'registrationNumber' ? 'text-indigo-400 scale-110 rotate-12' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      required
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      onFocus={() => setFocusedField('registrationNumber')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your registration number"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors duration-300">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                    focusedField === 'email' ? 'text-indigo-400 scale-110 rotate-12' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors duration-300">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'mobileNumber' ? 'text-indigo-400 scale-110 rotate-12' : 'text-gray-400'
                    }`} />
                    <input
                      type="tel"
                      required
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                      onFocus={() => setFocusedField('mobileNumber')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="Enter your mobile number"
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors duration-300">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                    focusedField === 'password' ? 'text-indigo-400 scale-110 rotate-12' : 'text-gray-400'
                  }`} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors duration-300">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'confirmPassword' ? 'text-indigo-400 scale-110 rotate-12' : 'text-gray-400'
                    }`} />
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full modern-button text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2 group relative overflow-hidden transition-all duration-300 hover:scale-105 magnetic-hover enhanced-button"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)',
                  boxShadow: '0 0 30px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)' 
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Shield className="w-5 h-5 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10">{loading ? 'Please wait...' : isLogin ? 'Access Portal' : 'Join Community'}</span>
                {!loading && <UserCheck className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />}
                <Sparkles className="w-4 h-4 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-white/80" />
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium transition-all duration-300 hover:scale-105 relative group magnetic-hover"
              >
                <span className="relative z-10">
                  {isLogin ? "Don't have an account? Join the Community" : "Already have an account? Access Portal"}
                </span>
                <div className="absolute inset-0 bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -m-3" />
              </button>
            </div>

            {/* Enhanced Decorative Elements */}
            <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-400 rounded-full opacity-20 animate-pulse" />
            <div className="absolute bottom-4 left-4 w-1 h-1 bg-purple-400 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 right-2 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-25 animate-pulse" style={{ animationDelay: '2s' }} />
          </div>

          {/* Enhanced Footer Message */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-center space-x-2">
              <Star className="w-4 h-4 text-indigo-400" />
              <span>Secure • Fast • Reliable</span>
              <Star className="w-4 h-4 text-purple-400" />
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default StudentAuth;
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SignUpDialog } from '../../components/auth/signup-dialog';
import { LoginDialog } from '../../components/auth/login-dialog';
import { Card } from '@/components/ui/card';
import { Sparkles, Calendar, BarChart3, Users, Zap, Globe, TrendingUp, Clock, Target, Shield, Rocket, Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HomePage() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const fadeIn = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const slideInLeft = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6 }
  };

  const slideInRight = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6 }
  };

  const scaleIn = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
        <motion.div 
          animate={{ 
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
        <motion.div 
          animate={{ 
            x: [0, 50, 0],
            y: [0, 50, 0],
          }}
          transition={{ 
            duration: 18,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        />
        
        {/* Floating particles - with window check for SSR */}
        {typeof window !== 'undefined' && [...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            initial={{ 
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: 0.2 
            }}
            animate={{ 
              y: [null, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{ 
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
        className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-8 w-8 text-blue-600" />
              </motion.div>
              <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SocialAI
              </h1>
            </motion.div>
            

            <div className="space-x-4">
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className="inline-block"
              >
                <Button 
                  variant="outline" 
                  onClick={() => setShowLogin(true)} 
                  className="border-2 hover:border-blue-600 hover:text-blue-600 transition-all"
                >
                  Login
                </Button>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className="inline-block"
              >
                <Button 
                  onClick={() => setShowSignUp(true)} 
                  className="bg-linear-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all"
                >
                  Get Started Free
                  <Rocket className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <motion.main
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="relative"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div variants={fadeInUp} className="text-center">
            <motion.div
              variants={scaleIn}
              className="inline-block p-3 bg-blue-100 rounded-full mb-6"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Star className="h-6 w-6 text-blue-600" />
              </motion.div>
            </motion.div>
            
            <motion.h2 
              variants={fadeInUp}
              className="text-5xl font-bold text-gray-900 sm:text-7xl"
            >
              Manage Your Social Media
              <motion.span 
                variants={fadeInUp}
                className="block text-transparent bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text"
              >
                Smarter, Faster, Better
              </motion.span>
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto"
            >
              All-in-one social media management platform powered by AI. 
              Create, analyze, and optimize your content across all platforms.
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              variants={fadeInUp}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
               // whileHover="hover"
              >
                <Button 
                  size="lg" 
                  onClick={() => setShowSignUp(true)}
                  className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all group"
                >
                  Start Free Trial
                  <motion.span
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </motion.span>
                </Button>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  variant="outline"
                  className="px-8 py-6 text-lg rounded-full border-2 hover:bg-white/80 hover:border-blue-600 transition-all"
                >
                  Watch Demo
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Zap className="ml-2 h-5 w-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              variants={fadeInUp}
              className="mt-16 flex flex-wrap justify-center gap-8 items-center"
            >
              {['Trusted by', '5000+', 'Companies', 'Worldwide'].map((text, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.1 }}
                  className="text-gray-500 font-medium"
                >
                  {text}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            variants={staggerContainer}
            className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { 
                icon: Sparkles, 
                title: "AI-Powered", 
                desc: "Smart content generation and optimization",
                color: "from-blue-500 to-cyan-500",
                delay: 0
              },
              { 
                icon: Calendar, 
                title: "Smart Scheduling", 
                desc: "Post at optimal times for maximum engagement",
                color: "from-purple-500 to-pink-500",
                delay: 0.1
              },
              { 
                icon: BarChart3, 
                title: "Deep Analytics", 
                desc: "Comprehensive insights and performance tracking",
                color: "from-green-500 to-emerald-500",
                delay: 0.2
              },
              { 
                icon: Globe, 
                title: "Multi-Platform", 
                desc: "Manage all social accounts in one dashboard",
                color: "from-orange-500 to-red-500",
                delay: 0.3
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -10, scale: 1.03 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="group"
              >
                <Card className="p-6 h-full hover:shadow-2xl transition-all duration-300 bg-white/80 backdrop-blur-sm border-2 border-transparent hover:border-blue-200 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-linear-to-r from-blue-600/5 to-purple-600/5"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: 0 }}
                    transition={{ duration: 0.4 }}
                  />
                  
                  <motion.div 
                    whileHover={{ rotateY: 180 }}
                    transition={{ duration: 0.6 }}
                    className={`w-14 h-14 rounded-xl bg-linear-to-r ${feature.color} p-3 mb-4 relative z-10`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <feature.icon className="w-full h-full text-white" />
                  </motion.div>
                  
                  <h3 className="text-xl font-semibold mb-2 relative z-10">{feature.title}</h3>
                  <p className="text-gray-600 relative z-10">{feature.desc}</p>
                  
                  <motion.div
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="h-5 w-5 text-blue-600" />
                  </motion.div>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats Section */}
          <motion.div 
            variants={fadeInUp}
            className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {[
              { value: "10K+", label: "Active Users", icon: Users, suffix: "users" },
              { value: "1M+", label: "Posts Created", icon: Sparkles, suffix: "posts" },
              { value: "98%", label: "Satisfaction", icon: Star, suffix: "satisfied" },
              { value: "24/7", label: "Support", icon: Shield, suffix: "availability" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={slideInLeft}
                whileHover={{ scale: 1.1 }}
                className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200 hover:border-blue-400 transition-all cursor-default group"
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5
                  }}
                >
                  <stat.icon className="h-8 w-8 mx-auto mb-3 text-blue-600 group-hover:text-purple-600 transition-colors" />
                </motion.div>
                
                <motion.div 
                  className="text-4xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  {stat.value}
                </motion.div>
                
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Role-Based Features */}
          <motion.div 
            variants={staggerContainer}
            className="mt-32"
          >
            <motion.h3 
              variants={fadeInUp}
              className="text-3xl font-bold text-center mb-12"
            >
              Designed for{" "}
              <span className="text-transparent bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text">
                Every Role
              </span>
            </motion.h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  role: "Creators",
                  icon: Users,
                  features: ["Content Scheduling", "AI Post Ideas", "Hashtag Suggestions"],
                  color: "from-blue-500 to-cyan-500",
                  delay: 0
                },
                {
                  role: "Analysts",
                  icon: TrendingUp,
                  features: ["Performance Metrics", "Audience Insights", "ROI Tracking"],
                  color: "from-purple-500 to-pink-500",
                  delay: 0.1
                },
                {
                  role: "Admins",
                  icon: Shield,
                  features: ["Team Management", "Access Control", "Brand Safety"],
                  color: "from-green-500 to-emerald-500",
                  delay: 0.2
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  variants={slideInRight}
                  whileHover={{ y: -10 }}
                  className="group"
                >
                  <Card className="p-8 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`w-16 h-16 rounded-full bg-linear-to-r ${item.color} p-4 mb-6 mx-auto`}
                    >
                      <item.icon className="w-full h-full text-white" />
                    </motion.div>
                    
                    <h4 className="text-2xl font-semibold text-center mb-4">{item.role}</h4>
                    
                    <ul className="space-y-3">
                      {item.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className="flex items-center text-gray-600"
                        >
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                          >
                            <Star className="h-4 w-4 text-blue-600 mr-2 shrink-0" />
                          </motion.div>
                          {feature}
                        </motion.li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div 
            variants={fadeInUp}
            className="mt-32 text-center"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="p-16 bg-linear-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
                {/* Animated background circles */}
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    background: [
                      "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                      "radial-gradient(circle at 80% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                      "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                    ]
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
                
                <motion.h3 
                  variants={fadeInUp}
                  className="text-4xl font-bold mb-4 relative z-10"
                >
                  Ready to transform your social media?
                </motion.h3>
                
                <motion.p 
                  variants={fadeInUp}
                  className="text-xl mb-8 text-blue-100 relative z-10"
                >
                  Join thousands of creators, analysts, and teams already using SocialAI
                </motion.p>
                
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="inline-block relative z-10"
                >
                  <Button 
                    size="lg" 
                    onClick={() => setShowSignUp(true)}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg rounded-full shadow-lg group"
                  >
                    Get Started Now
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Target className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                    </motion.span>
                  </Button>
                </motion.div>

                {/* Floating elements */}
                <motion.div
                  className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full"
                  animate={{
                    y: [0, -20, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                <motion.div
                  className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full"
                  animate={{
                    y: [0, 20, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                />
              </Card>
            </motion.div>
          </motion.div>

          {/* Footer */}
         
        </div>
      </motion.main>

      {/* Auth Dialogs */}
      <SignUpDialog open={showSignUp} onOpenChange={setShowSignUp} />
      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
    </div>
  );
}
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SignUpDialog } from '../../components/auth/signup-dialog';
import { LoginDialog } from '../../components/auth/login-dialog';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const [showSignUp, setShowSignUp] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to- from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">SocialMediaTool</h1>
            <div className="space-x-4">
              <Button variant="outline" onClick={() => setShowLogin(true)}>
                Login
              </Button>
              <Button onClick={() => setShowSignUp(true)}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-6xl">
              Manage Your Social Media
              <span className="text-blue-600"> Smarter</span>
            </h2>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              All-in-one social media management tool for creators, analysts, and teams.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold">For Creators</h3>
              <p className="mt-2 text-gray-600">Create and schedule content across multiple platforms</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold">For Analysts</h3>
              <p className="mt-2 text-gray-600">Deep analytics and performance tracking</p>
            </Card>
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-semibold">For Admins</h3>
              <p className="mt-2 text-gray-600">Full control over team and settings</p>
            </Card>
          </div>
        </div>
      </main>

      {/* Auth Dialogs */}
      <SignUpDialog open={showSignUp} onOpenChange={setShowSignUp} />
      <LoginDialog open={showLogin} onOpenChange={setShowLogin} />
    </div>
  );
}
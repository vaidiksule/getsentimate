'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { VideoLibrary } from '../components/VideoLibrary';
import { ChannelList } from '../components/ChannelList';
import { UserProfile } from '../components/UserProfile';
import { 
  BarChart3, 
  Video, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Home,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type TabType = 'overview' | 'videos' | 'channels' | 'profile';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalVideos: 0,
    totalComments: 0,
    avgSentiment: 0,
    recentActivity: [] as Array<{type: string, message: string}>
  });
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = () => {
    logout();
  };

  // Fetch real dashboard data from MongoDB
  const fetchDashboardStats = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch user's videos and comments from MongoDB
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/mongo/user/${user.id}/stats/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats({
          totalVideos: data.total_videos || 0,
          totalComments: data.total_comments || 0,
          avgSentiment: data.avg_sentiment || 0,
          recentActivity: data.recent_activity || []
        });
      } else {
        console.log('No stats available yet - user is new');
        // Set default values for new users
        setDashboardStats({
          totalVideos: 0,
          totalComments: 0,
          avgSentiment: 0,
          recentActivity: []
        });
      }
    } catch (error) {
      console.log('Dashboard stats not available yet:', error);
      // Set default values for new users
      setDashboardStats({
        totalVideos: 0,
        totalComments: 0,
        avgSentiment: 0,
        recentActivity: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stats when component mounts or user changes
  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="section-title">Welcome back, {user?.name}!</h2>
                <p className="text-muted-foreground">Here's an overview of your YouTube analytics.</p>
              </div>
              <Button 
                onClick={fetchDashboardStats}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                <div className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}>
                  {isLoading ? '⟳' : '⟳'}
                </div>
                Refresh
              </Button>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Video className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Videos</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoading ? '...' : dashboardStats.totalVideos}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Comments</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoading ? '...' : dashboardStats.totalComments.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg. Sentiment</p>
                    <p className="text-2xl font-bold text-foreground">
                      {isLoading ? '...' : dashboardStats.avgSentiment > 0 ? `+${dashboardStats.avgSentiment.toFixed(2)}` : dashboardStats.avgSentiment.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="section-subtitle">Recent Activity</h3>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading activity...</p>
                  </div>
                ) : dashboardStats.recentActivity.length > 0 ? (
                  dashboardStats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'analysis' ? 'bg-green-500' : 
                        activity.type === 'comments' ? 'bg-blue-500' : 
                        'bg-purple-500'
                      }`}></div>
                      <p className="text-sm text-muted-foreground">{activity.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Video className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">Connect a YouTube channel to get started</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="section-subtitle">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setActiveTab('videos')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Analyze New Video
                </Button>
                <Button 
                  onClick={() => setActiveTab('channels')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Channels
                </Button>
              </div>
            </div>
          </div>
        );
      case 'videos':
        return <VideoLibrary />;
      case 'channels':
        return <ChannelList />;
      case 'profile':
        return <UserProfile />;
      default:
        return null;
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <div className="lg:hidden border-b border-border/50 bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span className="text-lg font-semibold text-foreground">GetSentimate</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        <div className="flex">
          {/* Sidebar */}
          <div className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}>
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center space-x-2 p-6 border-b border-border/50">
                <BarChart3 className="w-8 h-8 text-primary" />
                <span className="text-xl font-bold text-foreground">GetSentimate</span>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                <Button
                  variant={activeTab === 'overview' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('overview')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Overview
                </Button>
                
                <Button
                  variant={activeTab === 'videos' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('videos')}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Videos
                </Button>
                
                <Button
                  variant={activeTab === 'channels' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('channels')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Channels
                </Button>
                
                <Button
                  variant={activeTab === 'profile' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('profile')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </nav>

              <Separator />

              {/* User Info & Logout */}
              <div className="p-4 space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                    {user?.name?.[0] || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 lg:ml-0">
            <main className="p-6">
              {renderTabContent()}
            </main>
          </div>
        </div>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';

// Views
import LandingPageView from './views/LandingPageView';
import AuthView from './views/AuthView';
import CommandCenterOverview from './views/CommandCenterOverview';
import JDIntakeView from './views/JDIntakeView';
import EligibilityView from './views/EligibilityView';
import MatchingView from './views/MatchingView';
import SchedulingView from './views/SchedulingView';
import ExceptionRadarView from './views/ExceptionRadarView';
import AnalyticsView from './views/AnalyticsView';
import DriveReportsView from './views/DriveReportsView';
import NotificationsView from './views/NotificationsView';
import AuditTrailView from './views/AuditTrailView';

import { apiClient } from './api/client';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('campus_command_user');
      return saved ? JSON.parse(saved) : { name: 'TPO Lead', role: 'tpo', email: 'tpo@university.edu' };
    } catch {
      return { name: 'TPO Lead', role: 'tpo', email: 'tpo@university.edu' };
    }
  });

  const [currentView, setCurrentView] = useState('landing');
  const [drives, setDrives] = useState([]);
  const [selectedDriveId, setSelectedDriveId] = useState(null);
  const [openExceptionsCount, setOpenExceptionsCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadDrivesAndTelemetry();
  }, [refreshTrigger]);

  const loadDrivesAndTelemetry = async () => {
    try {
      const [drivesData, exceptionsData] = await Promise.all([
        apiClient.getDrives().catch(() => []),
        apiClient.getExceptions('OPEN').catch(() => [])
      ]);
      setDrives(drivesData || []);
      setOpenExceptionsCount(exceptionsData ? exceptionsData.length : 0);
      if (drivesData && drivesData.length > 0 && !selectedDriveId) {
        setSelectedDriveId(drivesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load system telemetry', err);
    }
  };

  const handleAuthenticate = (userData) => {
    setCurrentUser(userData);
    try {
      localStorage.setItem('campus_command_user', JSON.stringify(userData));
    } catch (e) {
      console.error(e);
    }
    setCurrentView('overview');
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('campus_command_user');
    } catch (e) {
      console.error(e);
    }
    setCurrentView('login');
  };

  const handleDriveCreatedOrUpdated = (newDriveId) => {
    setSelectedDriveId(newDriveId);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // 1. Landing Page View (Separated experience)
  if (currentView === 'landing') {
    return (
      <LandingPageView
        onSignIn={() => setCurrentView('login')}
        onGetStarted={() => setCurrentView('signup')}
      />
    );
  }

  // 2. Authentication Login Page View (Separated experience)
  if (currentView === 'login') {
    return (
      <AuthView
        initialMode="login"
        onAuthenticate={handleAuthenticate}
        onBackToLanding={() => setCurrentView('landing')}
      />
    );
  }

  // 3. Authentication Sign Up Page View (Separated experience)
  if (currentView === 'signup') {
    return (
      <AuthView
        initialMode="signup"
        onAuthenticate={handleAuthenticate}
        onBackToLanding={() => setCurrentView('landing')}
      />
    );
  }

  // 4. Main Authenticated Placement Dashboard (Strictly operational, NO social login buttons)
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Minimal Top Header */}
      <Header
        currentUser={currentUser}
        openExceptionsCount={openExceptionsCount}
        onOpenExceptions={() => setCurrentView('exceptions')}
        onSearch={(query) => console.log('Searching:', query)}
        onSignOut={handleSignOut}
        onSelectView={setCurrentView}
      />

      {/* Main Layout Body */}
      <div className="flex flex-1">
        {/* Sleek Minimal Sidebar */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          openExceptionsCount={openExceptionsCount}
        />

        {/* Dynamic Center View Container */}
        <main className="flex-1 overflow-y-auto min-h-[calc(100vh-56px)] p-6 lg:p-8 bg-slate-50/50">
          {currentView === 'overview' && (
            <CommandCenterOverview
              onSelectView={setCurrentView}
              onSelectDrive={setSelectedDriveId}
              onRefreshTrigger={refreshTrigger}
            />
          )}

          {currentView === 'jd_intake' && (
            <JDIntakeView
              selectedDriveId={selectedDriveId}
              onDriveCreatedOrUpdated={handleDriveCreatedOrUpdated}
              onSelectView={setCurrentView}
            />
          )}

          {currentView === 'eligibility' && (
            <EligibilityView
              selectedDriveId={selectedDriveId}
              drives={drives}
              onSelectDrive={setSelectedDriveId}
              onSelectView={setCurrentView}
            />
          )}

          {currentView === 'matching' && (
            <MatchingView
              selectedDriveId={selectedDriveId}
              drives={drives}
              onSelectDrive={setSelectedDriveId}
              onSelectView={setCurrentView}
            />
          )}

          {currentView === 'scheduling' && (
            <SchedulingView
              selectedDriveId={selectedDriveId}
              drives={drives}
              onSelectDrive={setSelectedDriveId}
              onSelectView={setCurrentView}
            />
          )}

          {currentView === 'exceptions' && (
            <ExceptionRadarView
              onRefreshTrigger={refreshTrigger}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsView />
          )}

          {currentView === 'reports' && (
            <DriveReportsView
              selectedDriveId={selectedDriveId}
              drives={drives}
              onSelectDrive={setSelectedDriveId}
            />
          )}

          {currentView === 'notifications' && (
            <NotificationsView
              selectedDriveId={selectedDriveId}
              drives={drives}
            />
          )}

          {currentView === 'audit' && (
            <AuditTrailView
              onRefreshTrigger={refreshTrigger}
            />
          )}
        </main>
      </div>
    </div>
  );
}

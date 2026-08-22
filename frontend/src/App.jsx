import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ContextRouterDrawer from './components/ContextRouterDrawer';

// Views
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
  const [currentView, setCurrentView] = useState('overview');
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
        apiClient.getDrives(),
        apiClient.getExceptions('OPEN')
      ]);
      setDrives(drivesData);
      setOpenExceptionsCount(exceptionsData.length);
      if (drivesData.length > 0 && !selectedDriveId) {
        setSelectedDriveId(drivesData[0].id);
      }
    } catch (err) {
      console.error('Failed to load system telemetry', err);
    }
  };

  const handleDriveCreatedOrUpdated = (newDriveId) => {
    setSelectedDriveId(newDriveId);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleManualRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#080B12] text-slate-100 flex flex-col font-sans">
      {/* Top Command Center Header */}
      <Header
        drives={drives}
        selectedDriveId={selectedDriveId}
        onSelectDrive={setSelectedDriveId}
        openExceptionsCount={openExceptionsCount}
        onRefresh={handleManualRefresh}
        onOpenExceptions={() => setCurrentView('exceptions')}
      />

      {/* Main Layout Body */}
      <div className="flex flex-1">
        {/* Left Sidebar Navigation */}
        <Sidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          openExceptionsCount={openExceptionsCount}
        />

        {/* Dynamic Center View Container */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto bg-[#080B12] min-h-[calc(100vh-57px)]">
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

      {/* Floating Context Router Live Event Drawer */}
      <ContextRouterDrawer />
    </div>
  );
}

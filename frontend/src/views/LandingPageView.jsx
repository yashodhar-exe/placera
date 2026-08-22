import React, { useState } from 'react';
import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import HumanControlSection from '../components/landing/HumanControlSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import PilotModal from '../components/landing/PilotModal';

export default function LandingPageView({ onSignIn, onGetStarted }) {
  const [isPilotModalOpen, setIsPilotModalOpen] = useState(false);

  const handleOpenPilotModal = () => {
    setIsPilotModalOpen(true);
  };

  const handleClosePilotModal = () => {
    setIsPilotModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white flex flex-col">
      {/* 1. Minimal Sticky Navbar */}
      <LandingNavbar
        onSignIn={onSignIn}
        onGetStarted={onGetStarted || handleOpenPilotModal}
      />

      {/* 2. Hero + Compact Interactive Dashboard Preview */}
      <HeroSection
        onLaunchConsole={onSignIn}
        onGetStarted={onGetStarted || handleOpenPilotModal}
      />

      {/* 3. One Compact Workflow Section */}
      <WorkflowSection />

      {/* 4. Human Control Section: "AI coordinates. Humans decide." */}
      <HumanControlSection />

      {/* 5. Compact Final CTA + Minimal Footer */}
      <FinalCTASection
        onSignIn={onSignIn}
        onGetStarted={onGetStarted || handleOpenPilotModal}
      />

      {/* Quick Institutional Pilot Modal */}
      <PilotModal
        isOpen={isPilotModalOpen}
        onClose={handleClosePilotModal}
        onLaunchConsole={onSignIn}
      />
    </div>
  );
}

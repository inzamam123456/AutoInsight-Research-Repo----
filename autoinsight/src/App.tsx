import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { TopNavbar } from './components/layout/TopNavbar';
import { OverviewView } from './components/views/OverviewView';
import { NewAnalysisView } from './components/views/NewAnalysisView';
import { DatasetWorkspaceView } from './components/views/DatasetWorkspaceView';
import { DashboardView } from './components/views/DashboardView';
import { AIAnalystView } from './components/views/AIAnalystView';
import { ProcessingHistoryView } from './components/views/ProcessingHistoryView';
import { SavedReportsView } from './components/views/SavedReportsView';
import { HelpDocView } from './components/views/HelpDocView';
import { SettingsProfileView } from './components/views/SettingsProfileView';
import { LandingPage } from './components/views/LandingPage';
import { AuthModal } from './components/auth/AuthModal';
import { QuickAIAnalystDrawer } from './components/common/QuickAIAnalystDrawer';

const AppContent: React.FC = () => {
  const { activeView, preferences } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [showLanding, setShowLanding] = useState(false);

  // If user explicitly toggled landing page
  if (showLanding) {
    return (
      <div className="relative">
        <LandingPage />
        <button
          onClick={() => setShowLanding(false)}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 text-xs font-bold bg-[#172554] text-white rounded-full shadow-lg hover:bg-blue-900 border border-white/20"
        >
          Return to Platform
        </button>
        <AuthModal />
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case 'overview':
        return <OverviewView />;
      case 'new_analysis':
        return <NewAnalysisView />;
      case 'datasets':
      case 'dataset_detail':
        return <DatasetWorkspaceView />;
      case 'dashboards':
        return <DashboardView />;
      case 'ai_analyst':
        return <AIAnalystView />;
      case 'processing_history':
        return <ProcessingHistoryView />;
      case 'saved_reports':
        return <SavedReportsView />;
      case 'help':
        return <HelpDocView />;
      case 'settings':
        return <SettingsProfileView initialTab="settings" />;
      case 'profile':
        return <SettingsProfileView initialTab="profile" />;
      default:
        return <OverviewView />;
    }
  };

  const fontSizeClass = preferences?.fontSize === 'small' ? 'text-xs' : preferences?.fontSize === 'large' ? 'text-base' : 'text-sm';

  return (
    <div className={`flex h-screen w-screen overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 font-sans ${fontSizeClass}`}>
      {/* Collapsible Left Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navbar */}
        <TopNavbar />

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950">
          {renderView()}
        </main>
      </div>

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Persistent Outside-of-Dashboard Quick AI Analyst Drawer */}
      <QuickAIAnalystDrawer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

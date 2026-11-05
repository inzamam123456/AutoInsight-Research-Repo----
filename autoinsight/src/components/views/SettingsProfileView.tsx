import React, { useState } from 'react';
import {
  User,
  Settings,
  Sun,
  Moon,
  Shield,
  Download,
  Trash2,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Palette
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

interface SettingsProfileViewProps {
  initialTab?: 'settings' | 'profile';
}

export const SettingsProfileView: React.FC<SettingsProfileViewProps> = ({ initialTab = 'settings' }) => {
  const { user, preferences, updatePreferences, logout, refreshDatasets } = useApp();
  const [activeTab, setActiveTab] = useState<'appearance' | 'accessibility' | 'privacy' | 'profile'>(
    initialTab === 'profile' ? 'profile' : 'appearance'
  );

  // Profile Form state
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    try {
      await api.updateProfile({ displayName, avatarUrl });
      setProfileMsg('Profile updated successfully.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: any) {
      setProfileErr(err.message || 'Failed to update profile.');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');
    if (!currentPassword || !newPassword) {
      setProfileErr('Please fill in both current and new password.');
      return;
    }
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setProfileMsg('Password changed successfully.');
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: any) {
      setProfileErr(err.message || 'Failed to change password.');
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = await api.exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autoinsight_personal_archive_${user?.id}.json`;
      a.click();
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>System Settings & Profile</span>
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Customize themes, display densities, accessibility features, data retention policies, and user account credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'appearance'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Appearance
        </button>
        <button
          onClick={() => setActiveTab('accessibility')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'accessibility'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Accessibility
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'privacy'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Data & Privacy
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'profile'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          User Profile
        </button>
      </div>

      {profileMsg && (
        <div className="p-3 text-xs text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{profileMsg}</span>
        </div>
      )}
      {profileErr && (
        <div className="p-3 text-xs text-rose-800 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{profileErr}</span>
        </div>
      )}

      {/* APPEARANCE TAB */}
      {activeTab === 'appearance' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Theme Mode
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <button
                onClick={() => updatePreferences({ theme: 'light' })}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  preferences?.theme === 'light'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Light Mode</span>
              </button>

              <button
                onClick={() => updatePreferences({ theme: 'dark' })}
                className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  preferences?.theme === 'dark'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Moon className="w-5 h-5 text-indigo-400" />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Display Density
            </h3>
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="density"
                  checked={preferences?.density === 'comfortable'}
                  onChange={() => updatePreferences({ density: 'comfortable' })}
                  className="text-blue-600"
                />
                <span className="text-slate-700 dark:text-slate-300">Comfortable (default)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="density"
                  checked={preferences?.density === 'compact'}
                  onChange={() => updatePreferences({ density: 'compact' })}
                  className="text-blue-600"
                />
                <span className="text-slate-700 dark:text-slate-300">Compact</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ACCESSIBILITY TAB */}
      {activeTab === 'accessibility' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Font Sizing
            </h3>
            <div className="flex items-center gap-3">
              {(['small', 'normal', 'large'] as const).map(size => (
                <button
                  key={size}
                  onClick={() => updatePreferences({ fontSize: size })}
                  className={`px-3 py-1.5 rounded-lg border capitalize ${
                    preferences?.fontSize === size
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-600 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {size} text
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  High Contrast Text & Borders
                </span>
                <span className="text-slate-400 text-[11px]">
                  Enhances color separation across chart axes, data cells, and borders.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences?.highContrast || false}
                onChange={(e) => updatePreferences({ highContrast: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  Reduced Motion
                </span>
                <span className="text-slate-400 text-[11px]">
                  Disables UI transition animations and smooth chart rendering physics.
                </span>
              </div>
              <input
                type="checkbox"
                checked={preferences?.reducedMotion || false}
                onChange={(e) => updatePreferences({ reducedMotion: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>
      )}

      {/* PRIVACY & DATA RETENTION TAB */}
      {activeTab === 'privacy' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Data Sovereignty & Privacy Principles
            </h3>
            <p className="text-slate-500 leading-relaxed">
              AutoInsight treats uploaded datasets as strictly untrusted tabular data. Raw files are stored immutably in isolated object storage per user. Calculations are performed deterministically in isolated execution sandboxes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 space-y-1">
            <span className="font-bold text-blue-900 dark:text-blue-300">
              External LLM Data Sharing Disclosure
            </span>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              When querying the AI Analyst, only aggregated statistical metrics and schema descriptions are sent to the LLM for natural-language synthesis. Entire raw dataset tables are never transmitted to external APIs.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Download Personal Data Archive
              </span>
              <span className="text-slate-400 text-[11px]">
                Export all your datasets, cleaning logs, and executive reports in JSON format.
              </span>
            </div>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export JSON Archive'}</span>
            </button>
          </div>
        </div>
      )}

      {/* USER PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Account Profile
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#2563EB] hover:bg-[#1d4ed8] text-white rounded-lg transition-colors"
            >
              Update Profile
            </button>
          </form>

          {/* Password update */}
          <form onSubmit={handlePasswordChange} className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Change Password
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-[#172554] hover:bg-[#1e3a8a] text-white rounded-lg transition-colors"
            >
              Change Password
            </button>
          </form>

          {/* Account Logout / Actions */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Session Control
              </span>
              <span className="text-slate-400 text-[11px]">
                Sign out on this device or terminate active sessions.
              </span>
            </div>
            <button
              onClick={logout}
              className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950/40 font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

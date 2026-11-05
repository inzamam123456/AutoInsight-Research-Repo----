import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserPreferences, Dataset, ProcessingJob, AppView, AnalysisHistoryRecord } from '../types';
import { api } from '../services/api';
import { auth, googleAuthProvider, db as firestoreDb } from '../lib/firebase';
import { signInWithPopup, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  preferences: UserPreferences | null;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  datasets: Dataset[];
  activeDatasetId: string | null;
  activeDataset: Dataset | null;
  setActiveDatasetId: (id: string | null) => void;
  activeJob: ProcessingJob | null;
  setActiveJob: (job: ProcessingJob | null) => void;
  isProcessing: boolean;
  refreshDatasets: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  loginWithOTP: (email: string, otp: string) => Promise<void>;
  sendOTP: (email: string) => Promise<{ success: boolean; message: string; previewOtp?: string }>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register' | 'otp';
  openAuthModal: (mode?: 'login' | 'register' | 'otp') => void;
  closeAuthModal: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  history: AnalysisHistoryRecord[];
  fetchHistory: () => Promise<void>;
  recordAnalysisHistory: (item: {
    datasetId?: string;
    datasetName: string;
    queryPrompt?: string;
    insightsCount?: number;
    qualityScore?: number;
    status?: 'completed' | 'in_progress' | 'failed';
    summary?: string;
  }) => Promise<void>;
  deleteHistoryItem: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [activeView, setActiveView] = useState<AppView>('overview');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<ProcessingJob | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'otp'>('otp');
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('autoinsight_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // Executive Dark Mode by default
  });
  const [history, setHistory] = useState<AnalysisHistoryRecord[]>([]);

  const refreshDatasets = useCallback(async () => {
    try {
      const list = await api.listDatasets();
      setDatasets(list);
      if (list.length > 0 && !activeDatasetId) {
        setActiveDatasetId(list[0].id);
      }
    } catch (err) {
      console.warn('Could not fetch datasets:', err);
    }
  }, [activeDatasetId]);

  const fetchHistory = useCallback(async () => {
    try {
      const list = await api.getHistory();
      setHistory(list);
    } catch (err) {
      console.warn('Could not load history from backend:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      // Ensure dark mode class is applied immediately
      const savedTheme = localStorage.getItem('autoinsight_theme') || 'dark';
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      const isLoggedOut = localStorage.getItem('autoinsight_logged_out') === 'true';
      const token = api.getToken();

      if (!token || isLoggedOut) {
        setUser(null);
        await refreshDatasets();
        return;
      }

      try {
        const data = await api.getCurrentUser();
        if (data && data.user) {
          setUser(data.user);
          setPreferences(data.preferences);
          if (data.preferences?.theme) {
            const prefTheme = data.preferences.theme;
            setTheme(prefTheme);
            localStorage.setItem('autoinsight_theme', prefTheme);
            if (prefTheme === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      }
      await refreshDatasets();
      await fetchHistory();
    };
    init();
  }, [refreshDatasets, fetchHistory]);

  // Apply theme class to document whenever theme state changes
  useEffect(() => {
    localStorage.setItem('autoinsight_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('autoinsight_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    if (user) {
      api.updatePreferences({ theme: next }).catch(() => {});
    }
  };

  // Sync Firebase Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Synchronize user document to Firestore
        try {
          const userRef = doc(firestoreDb, 'users', fbUser.uid);
          await setDoc(userRef, {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            role: 'user',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.warn('Firestore user profile sync error:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const sendOTP = async (email: string) => {
    return api.sendOTP(email);
  };

  const loginWithOTP = async (email: string, otp: string) => {
    localStorage.removeItem('autoinsight_logged_out');
    const data = await api.verifyOTP(email, otp);
    setUser(data.user);
    setPreferences(data.preferences);
    setAuthModalOpen(false);
    await refreshDatasets();
    await fetchHistory();
  };

  const loginWithGoogle = async () => {
    try {
      localStorage.removeItem('autoinsight_logged_out');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      if (fbUser.email) {
        // Also ensure local session
        const data = await api.verifyOTP(fbUser.email, 'GOOGLE_AUTH_BYPASS').catch(async () => {
          // If bypass fails, use standard register/login
          return api.register(fbUser.email!, 'GoogleAuth123!', fbUser.displayName || undefined).catch(() => {
            return api.login(fbUser.email!, 'GoogleAuth123!');
          });
        });
        if (data && 'user' in data) {
          setUser(data.user);
          setPreferences(data.preferences);
        }
      }
      setAuthModalOpen(false);
      await refreshDatasets();
      await fetchHistory();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      throw new Error(err.message || 'Google sign-in failed');
    }
  };

  const login = async (email: string, pass: string) => {
    localStorage.removeItem('autoinsight_logged_out');
    const data = await api.login(email, pass);
    setUser(data.user);
    setPreferences(data.preferences);
    setAuthModalOpen(false);
    await refreshDatasets();
    await fetchHistory();
  };

  const register = async (email: string, pass: string, name?: string) => {
    localStorage.removeItem('autoinsight_logged_out');
    const data = await api.register(email, pass, name);
    setUser(data.user);
    setPreferences(data.preferences);
    setAuthModalOpen(false);
    await refreshDatasets();
    await fetchHistory();
  };

  const logout = async () => {
    localStorage.setItem('autoinsight_logged_out', 'true');
    api.setToken(null);
    try {
      await fbSignOut(auth).catch(() => {});
      await api.logout();
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setUser(null);
    setPreferences(null);
    setActiveDatasetId(null);
    setDatasets([]);
    setHistory([]);
    setActiveView('overview');
  };

  const recordAnalysisHistory = async (item: {
    datasetId?: string;
    datasetName: string;
    queryPrompt?: string;
    insightsCount?: number;
    qualityScore?: number;
    status?: 'completed' | 'in_progress' | 'failed';
    summary?: string;
  }) => {
    try {
      // 1. Save to backend database
      const created = await api.saveHistory(item);
      setHistory(prev => [created, ...prev.filter(h => h.id !== created.id)]);

      // 2. Also sync to Firestore if user has Firebase UID
      if (auth.currentUser) {
        const historyRef = doc(firestoreDb, 'analysisHistory', created.id);
        await setDoc(historyRef, {
          id: created.id,
          userId: auth.currentUser.uid,
          datasetId: item.datasetId || '',
          datasetName: item.datasetName,
          queryPrompt: item.queryPrompt || '',
          insightsCount: item.insightsCount || 0,
          qualityScore: item.qualityScore || 100,
          status: item.status || 'completed',
          createdAt: new Date().toISOString(),
          summary: item.summary || ''
        });
      }
    } catch (err) {
      console.warn('Failed to record analysis history:', err);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      await api.deleteHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      if (auth.currentUser) {
        await deleteDoc(doc(firestoreDb, 'analysisHistory', id)).catch(() => {});
      }
    } catch (err) {
      console.warn('Failed to delete history item:', err);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    const updated = await api.updatePreferences(updates);
    setPreferences(updated);
    if (updated.theme) {
      setTheme(updated.theme === 'dark' ? 'dark' : 'light');
    }
  };

  const openAuthModal = (mode: 'login' | 'register' | 'otp' = 'otp') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  // Load initial history on boot
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const activeDataset = datasets.find(d => d.id === activeDatasetId) || (datasets.length > 0 ? datasets[0] : null);
  const isProcessing = activeJob?.status === 'running' || activeDataset?.processingStatus === 'cleaning' || activeDataset?.processingStatus === 'profiling';

  return (
    <AppContext.Provider
      value={{
        user,
        preferences,
        activeView,
        setActiveView,
        datasets,
        activeDatasetId: activeDataset?.id || null,
        activeDataset,
        setActiveDatasetId,
        activeJob,
        setActiveJob,
        isProcessing,
        refreshDatasets,
        login,
        loginWithOTP,
        sendOTP,
        loginWithGoogle,
        register,
        logout,
        updatePreferences,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        searchTerm,
        setSearchTerm,
        theme,
        toggleTheme,
        history,
        fetchHistory,
        recordAnalysisHistory,
        deleteHistoryItem
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
};

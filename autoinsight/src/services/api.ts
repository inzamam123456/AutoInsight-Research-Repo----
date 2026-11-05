import {
  User,
  UserPreferences,
  Dataset,
  DatasetVersion,
  DashboardConfig,
  ProcessingJob,
  SavedReport,
  Conversation,
  ChatMessage,
  VerificationEvidence,
  AnalysisHistoryRecord
} from '../types';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('autoinsight_token');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('autoinsight_token', token);
    } else {
      localStorage.removeItem('autoinsight_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorMsg = `Request failed: ${res.statusText}`;
      try {
        const data = await res.json();
        if (data && data.error) errorMsg = data.error;
      } catch (e) {
        // ignore
      }
      throw new Error(errorMsg);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  public async login(email: string, password: string) {
    const data = await this.request<{ user: User; token: string; preferences: UserPreferences }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  public async register(email: string, password: string, displayName?: string) {
    const data = await this.request<{ user: User; token: string; preferences: UserPreferences }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName })
    });
    this.setToken(data.token);
    return data;
  }

  public async getCurrentUser() {
    return this.request<{ user: User; preferences: UserPreferences }>('/api/auth/me');
  }

  public async updateProfile(updates: { displayName?: string; avatarUrl?: string }) {
    return this.request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/api/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // Email OTP Flow
  public async sendOTP(email: string) {
    return this.request<{ success: boolean; message: string; previewOtp?: string }>('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  public async verifyOTP(email: string, otp: string) {
    const data = await this.request<{ success: boolean; user: User; token: string; preferences: UserPreferences }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
    this.setToken(data.token);
    return data;
  }

  public async logout() {
    try {
      await this.request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    this.setToken(null);
  }

  // History Tracking (Database Persistence)
  public async getHistory() {
    return this.request<AnalysisHistoryRecord[]>('/api/history');
  }

  public async saveHistory(item: {
    datasetId?: string;
    datasetName: string;
    queryPrompt?: string;
    insightsCount?: number;
    qualityScore?: number;
    status?: 'completed' | 'in_progress' | 'failed';
    summary?: string;
  }) {
    return this.request<AnalysisHistoryRecord>('/api/history', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }

  public async deleteHistory(id: string) {
    return this.request<{ success: boolean }>(`/api/history/${id}`, {
      method: 'DELETE'
    });
  }

  // Preferences
  public async getPreferences() {
    return this.request<UserPreferences>('/api/preferences');
  }

  public async updatePreferences(prefs: Partial<UserPreferences>) {
    return this.request<UserPreferences>('/api/preferences', {
      method: 'PUT',
      body: JSON.stringify(prefs)
    });
  }

  // Datasets
  public async listDatasets() {
    return this.request<Dataset[]>('/api/datasets');
  }

  public async getDataset(id: string) {
    return this.request<{ dataset: Dataset; versions: DatasetVersion[]; currentVersionData?: DatasetVersion }>(`/api/datasets/${id}`);
  }

  public async uploadDataset(file: File, name?: string, description?: string, autoProcess = false) {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (description) formData.append('description', description);
    formData.append('autoProcess', String(autoProcess));

    return this.request<{ dataset: Dataset; qualityReport: any; previewRows: any[] }>('/api/datasets/upload', {
      method: 'POST',
      body: formData
    });
  }

  public async processDataset(id: string) {
    return this.request<{ job: ProcessingJob; dataset: Dataset; dashboard?: DashboardConfig }>(`/api/datasets/${id}/process`, {
      method: 'POST'
    });
  }

  public async getDatasetRows(id: string, version?: number, page = 1, limit = 50) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit)
    });
    if (version) params.append('version', String(version));
    return this.request<{ rows: any[]; total: number; page: number; limit: number; totalPages: number; version: number }>(
      `/api/datasets/${id}/rows?${params.toString()}`
    );
  }

  public async getCleaningActions(id: string) {
    return this.request<any[]>(`/api/datasets/${id}/actions`);
  }

  public async restoreDatasetVersion(id: string, version: number) {
    return this.request<{ message: string; dataset: Dataset; dashboard: DashboardConfig }>(`/api/datasets/${id}/restore`, {
      method: 'POST',
      body: JSON.stringify({ version })
    });
  }

  public async deleteDataset(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/datasets/${id}`, {
      method: 'DELETE'
    });
  }

  // Dashboard
  public async getDashboard(datasetId: string) {
    return this.request<DashboardConfig>(`/api/datasets/${datasetId}/dashboard`);
  }

  public async explainChart(chartData: {
    chartId: string;
    chartTitle: string;
    chartData: any;
    analyticalExplanation?: any;
  }) {
    return this.request<{
      explanation: string;
      keyPoints: string[];
      potentialDrivers: string[];
      suggestedNextSteps: string[];
    }>('/api/datasets/explain/chart', { // fallback route or use endpoint
      method: 'POST',
      body: JSON.stringify(chartData)
    });
  }

  // AI Analyst Chat
  public async getConversation(datasetId: string) {
    return this.request<Conversation>(`/api/datasets/${datasetId}/conversation`);
  }

  public async sendChatMessage(datasetId: string, question: string, chartContextId?: string) {
    return this.request<{
      message: ChatMessage;
      evidence: VerificationEvidence;
      suggestedFollowUps: string[];
    }>(`/api/datasets/${datasetId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ question, chartContextId })
    });
  }

  // Jobs
  public async listJobs() {
    return this.request<ProcessingJob[]>('/api/jobs');
  }

  public async getJob(id: string) {
    return this.request<ProcessingJob>(`/api/jobs/${id}`);
  }

  public async deleteJob(id: string) {
    return this.request<{ success: boolean; message: string }>(`/api/jobs/${id}`, {
      method: 'DELETE'
    });
  }

  public async clearJobs() {
    return this.request<{ success: boolean; count: number; message: string }>('/api/jobs', {
      method: 'DELETE'
    });
  }

  // Saved Reports
  public async listReports() {
    return this.request<SavedReport[]>('/api/reports');
  }

  public async createReport(reportData: {
    datasetId: string;
    title: string;
    summary: string;
    kpis?: any[];
    charts?: any[];
    keyFindings?: string[];
  }) {
    return this.request<SavedReport>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
  }

  public async deleteReport(id: string) {
    return this.request<{ success: boolean }>(`/api/reports/${id}`, {
      method: 'DELETE'
    });
  }

  public async exportUserData() {
    return this.request<any>('/api/users/export-data');
  }
}

export const api = new ApiService();

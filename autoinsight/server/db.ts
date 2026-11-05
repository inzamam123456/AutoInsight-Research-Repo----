import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  UserPreferences,
  Dataset,
  DatasetVersion,
  CleaningActionItem,
  ProcessingJob,
  DashboardConfig,
  Conversation,
  ChatMessage,
  SavedReport,
  VerificationEvidence,
  AnalysisHistoryRecord
} from './types';

interface OTPRecord {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
}

interface DatabaseSchema {
  users: Record<string, User>;
  preferences: Record<string, UserPreferences>;
  datasets: Record<string, Dataset>;
  datasetVersions: Record<string, DatasetVersion[]>; // datasetId -> versions
  datasetRows: Record<string, Record<number, any[]>>; // datasetId -> versionNumber -> rows
  originalFiles: Record<string, { fileName: string; content: string; format: string }>;
  cleaningActions: Record<string, CleaningActionItem[]>; // datasetId -> actions
  jobs: Record<string, ProcessingJob>;
  dashboards: Record<string, DashboardConfig>; // datasetId -> dashboard
  conversations: Record<string, Conversation>;
  savedReports: Record<string, SavedReport>;
  verifications: Record<string, VerificationEvidence>;
  history: Record<string, AnalysisHistoryRecord>;
  otps: Record<string, OTPRecord>;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

class DatabaseService {
  private db: DatabaseSchema = {
    users: {},
    preferences: {},
    datasets: {},
    datasetVersions: {},
    datasetRows: {},
    originalFiles: {},
    cleaningActions: {},
    jobs: {},
    dashboards: {},
    conversations: {},
    savedReports: {},
    verifications: {},
    history: {},
    otps: {}
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
      } catch (err) {
        console.error('Error loading db.json, creating new database', err);
        this.save();
      }
    } else {
      this.save();
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to save db.json', err);
    }
  }

  // Password hashing
  public hashPassword(password: string): string {
    const salt = 'autoinsight_salt_2026';
    return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  }

  public verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }

  // User methods
  public getUserById(id: string): User | undefined {
    return this.db.users[id];
  }

  public getUserByEmail(email: string): User | undefined {
    return Object.values(this.db.users).find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const id = 'usr_' + crypto.randomUUID().slice(0, 8);
    const newUser: User = {
      ...user,
      id,
      createdAt: new Date().toISOString()
    };
    this.db.users[id] = newUser;

    // Default preferences
    this.db.preferences[id] = {
      userId: id,
      theme: 'light',
      accentColor: 'navy',
      fontSize: 'normal',
      density: 'comfortable',
      highContrast: false,
      reducedMotion: false,
      dateFormat: 'YYYY-MM-DD',
      numberFormat: 'standard',
      sidebarCollapsed: false,
      defaultCleaningStrategy: 'auto',
      retentionDays: 90
    };

    this.save();
    return newUser;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.db.users[id];
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  public getPreferences(userId: string): UserPreferences {
    if (!this.db.preferences[userId]) {
      this.db.preferences[userId] = {
        userId,
        theme: 'light',
        accentColor: 'navy',
        fontSize: 'normal',
        density: 'comfortable',
        highContrast: false,
        reducedMotion: false,
        dateFormat: 'YYYY-MM-DD',
        numberFormat: 'standard',
        sidebarCollapsed: false,
        defaultCleaningStrategy: 'auto',
        retentionDays: 90
      };
      this.save();
    }
    return this.db.preferences[userId];
  }

  public updatePreferences(userId: string, updates: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences(userId);
    this.db.preferences[userId] = { ...current, ...updates };
    this.save();
    return this.db.preferences[userId];
  }

  // Dataset methods
  public createDataset(dataset: Dataset, originalContent: string, initialRows: any[]): Dataset {
    this.db.datasets[dataset.id] = dataset;
    this.db.datasetVersions[dataset.id] = [];
    if (!this.db.datasetRows[dataset.id]) {
      this.db.datasetRows[dataset.id] = {};
    }
    this.db.datasetRows[dataset.id][1] = initialRows;
    this.db.originalFiles[dataset.id] = {
      fileName: dataset.originalFileName,
      content: originalContent,
      format: dataset.fileFormat
    };
    this.db.cleaningActions[dataset.id] = [];
    this.save();
    return dataset;
  }

  public getDataset(id: string): Dataset | undefined {
    return this.db.datasets[id];
  }

  public listDatasets(ownerId: string): Dataset[] {
    return Object.values(this.db.datasets)
      .filter(d => d.ownerId === ownerId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public updateDataset(id: string, updates: Partial<Dataset>): Dataset | undefined {
    const ds = this.db.datasets[id];
    if (!ds) return undefined;
    Object.assign(ds, { ...updates, updatedAt: new Date().toISOString() });
    this.save();
    return ds;
  }

  public deleteDataset(id: string): boolean {
    if (!this.db.datasets[id]) return false;
    delete this.db.datasets[id];
    delete this.db.datasetVersions[id];
    delete this.db.datasetRows[id];
    delete this.db.originalFiles[id];
    delete this.db.cleaningActions[id];
    delete this.db.dashboards[id];
    
    // delete related conversations & saved reports
    for (const cid in this.db.conversations) {
      if (this.db.conversations[cid].datasetId === id) {
        delete this.db.conversations[cid];
      }
    }
    for (const rid in this.db.savedReports) {
      if (this.db.savedReports[rid].datasetId === id) {
        delete this.db.savedReports[rid];
      }
    }
    this.save();
    return true;
  }

  // Versions and Rows
  public getDatasetRows(datasetId: string, versionNumber?: number): any[] {
    const ds = this.getDataset(datasetId);
    if (!ds) return [];
    const v = versionNumber ?? ds.currentVersion;
    return this.db.datasetRows[datasetId]?.[v] || [];
  }

  public setDatasetRows(datasetId: string, versionNumber: number, rows: any[]) {
    if (!this.db.datasetRows[datasetId]) {
      this.db.datasetRows[datasetId] = {};
    }
    this.db.datasetRows[datasetId][versionNumber] = rows;
    this.save();
  }

  public addDatasetVersion(version: DatasetVersion) {
    if (!this.db.datasetVersions[version.datasetId]) {
      this.db.datasetVersions[version.datasetId] = [];
    }
    this.db.datasetVersions[version.datasetId].push(version);
    this.save();
  }

  public getDatasetVersions(datasetId: string): DatasetVersion[] {
    return this.db.datasetVersions[datasetId] || [];
  }

  public getDatasetVersion(datasetId: string, versionNumber: number): DatasetVersion | undefined {
    return this.getDatasetVersions(datasetId).find(v => v.versionNumber === versionNumber);
  }

  // Original raw file
  public getOriginalFile(datasetId: string) {
    return this.db.originalFiles[datasetId];
  }

  // Cleaning Actions
  public addCleaningAction(action: CleaningActionItem) {
    if (!this.db.cleaningActions[action.datasetId]) {
      this.db.cleaningActions[action.datasetId] = [];
    }
    this.db.cleaningActions[action.datasetId].push(action);
    this.save();
  }

  public getCleaningActions(datasetId: string): CleaningActionItem[] {
    return this.db.cleaningActions[datasetId] || [];
  }

  // Jobs
  public createJob(job: ProcessingJob): ProcessingJob {
    this.db.jobs[job.id] = job;
    this.save();
    return job;
  }

  public getJob(id: string): ProcessingJob | undefined {
    return this.db.jobs[id];
  }

  public updateJob(id: string, updates: Partial<ProcessingJob>): ProcessingJob | undefined {
    const job = this.db.jobs[id];
    if (!job) return undefined;
    Object.assign(job, updates);
    this.save();
    return job;
  }

  public listJobs(ownerId: string): ProcessingJob[] {
    return Object.values(this.db.jobs)
      .filter(j => j.ownerId === ownerId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  public deleteJob(id: string): boolean {
    if (this.db.jobs[id]) {
      delete this.db.jobs[id];
      this.save();
      return true;
    }
    return false;
  }

  public clearJobs(ownerId: string): number {
    const jobKeys = Object.keys(this.db.jobs).filter(k => this.db.jobs[k].ownerId === ownerId);
    jobKeys.forEach(k => delete this.db.jobs[k]);
    this.save();
    return jobKeys.length;
  }

  // Dashboards
  public setDashboard(config: DashboardConfig) {
    this.db.dashboards[config.datasetId] = config;
    this.save();
  }

  public getDashboard(datasetId: string): DashboardConfig | undefined {
    return this.db.dashboards[datasetId];
  }

  // Conversations
  public getOrCreateConversation(ownerId: string, datasetId: string): Conversation {
    const existing = Object.values(this.db.conversations).find(
      c => c.ownerId === ownerId && c.datasetId === datasetId
    );
    if (existing) return existing;

    const id = 'conv_' + crypto.randomUUID().slice(0, 8);
    const newConv: Conversation = {
      id,
      ownerId,
      datasetId,
      title: 'Data Analysis Conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    this.db.conversations[id] = newConv;
    this.save();
    return newConv;
  }

  public addMessage(conversationId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const conv = this.db.conversations[conversationId];
    if (!conv) throw new Error('Conversation not found');
    const msg: ChatMessage = {
      ...message,
      id: 'msg_' + crypto.randomUUID().slice(0, 8),
      timestamp: new Date().toISOString()
    };
    conv.messages.push(msg);
    conv.updatedAt = new Date().toISOString();
    this.save();
    return msg;
  }

  public getConversation(id: string): Conversation | undefined {
    return this.db.conversations[id];
  }

  // Saved Reports
  public createSavedReport(report: SavedReport): SavedReport {
    this.db.savedReports[report.id] = report;
    this.save();
    return report;
  }

  public listSavedReports(ownerId: string): SavedReport[] {
    return Object.values(this.db.savedReports)
      .filter(r => r.ownerId === ownerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public deleteSavedReport(id: string): boolean {
    if (!this.db.savedReports[id]) return false;
    delete this.db.savedReports[id];
    this.save();
    return true;
  }

  // Verification records
  public addVerification(evidence: VerificationEvidence) {
    this.db.verifications[evidence.id] = evidence;
    this.save();
  }

  public getVerification(id: string): VerificationEvidence | undefined {
    return this.db.verifications[id];
  }

  // OTP Management
  public setOTP(email: string, code: string, ttlMs = 10 * 60 * 1000): OTPRecord {
    const record: OTPRecord = {
      email: email.toLowerCase().trim(),
      code,
      expiresAt: Date.now() + ttlMs,
      attempts: 0
    };
    if (!this.db.otps) this.db.otps = {};
    this.db.otps[record.email] = record;
    this.save();
    return record;
  }

  public verifyOTP(email: string, code: string): { valid: boolean; reason?: string } {
    if (!this.db.otps) return { valid: false, reason: 'No OTP generated' };
    const normalized = email.toLowerCase().trim();
    const record = this.db.otps[normalized];
    if (!record) {
      return { valid: false, reason: 'No OTP requested for this email' };
    }
    if (Date.now() > record.expiresAt) {
      delete this.db.otps[normalized];
      this.save();
      return { valid: false, reason: 'OTP has expired. Please request a new code.' };
    }
    if (record.attempts >= 5) {
      delete this.db.otps[normalized];
      this.save();
      return { valid: false, reason: 'Too many incorrect attempts. Please request a new code.' };
    }
    if (record.code !== code.trim()) {
      record.attempts += 1;
      this.save();
      return { valid: false, reason: 'Invalid OTP code. Please check and try again.' };
    }

    // Success - consume OTP
    delete this.db.otps[normalized];
    this.save();
    return { valid: true };
  }

  // Analysis History Management
  public addHistory(record: Omit<AnalysisHistoryRecord, 'id' | 'createdAt'>): AnalysisHistoryRecord {
    if (!this.db.history) this.db.history = {};
    const id = 'hist_' + crypto.randomUUID().slice(0, 8);
    const item: AnalysisHistoryRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString()
    };
    this.db.history[id] = item;
    this.save();
    return item;
  }

  public getHistoryByUser(userId: string): AnalysisHistoryRecord[] {
    if (!this.db.history) return [];
    return Object.values(this.db.history)
      .filter(h => h.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public deleteHistory(id: string): boolean {
    if (!this.db.history || !this.db.history[id]) return false;
    delete this.db.history[id];
    this.save();
    return true;
  }
}

export const db = new DatabaseService();

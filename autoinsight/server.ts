import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { db } from './server/db';
import { DataEngine } from './server/dataEngine';
import { AnalyticsEngine } from './server/analyticsEngine';
import { WorkflowOrchestrator } from './server/orchestrator';
import { AIAnalyst } from './server/aiAnalyst';
import { seedSampleDatasets } from './server/sampleData';
import { Dataset } from './server/types';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer storage for uploaded raw datasets
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit
});

// Seed default demo user if needed
let demoUser = db.getUserByEmail('demo@autoinsight.io');
if (!demoUser) {
  demoUser = db.createUser({
    email: 'demo@autoinsight.io',
    displayName: 'Alex Morgan',
    passwordHash: db.hashPassword('Password123!'),
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
  });
}
// Seed sample dataset for demo user
seedSampleDatasets(demoUser.id);

// Auth Middleware (extracts Bearer token or fallback to demoUser for instant seamless UX)
interface AuthenticatedRequest extends Request {
  user?: any;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Token can be the user's ID
    const user = db.getUserById(token);
    if (user) {
      req.user = user;
      return next();
    }
  }
  // Default to demo user if not logged in
  req.user = demoUser;
  next();
};

/* ========================================================================= */
/* AUTHENTICATION & PROFILE ROUTES                                           */
/* ========================================================================= */

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const newUser = db.createUser({
      email,
      displayName: displayName || email.split('@')[0],
      passwordHash: db.hashPassword(password)
    });

    // Seed sample dataset for the newly registered user too!
    seedSampleDatasets(newUser.id);

    return res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        createdAt: newUser.createdAt
      },
      token: newUser.id,
      preferences: db.getPreferences(newUser.id)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.getUserByEmail(email);
    if (!user || !db.verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      },
      token: user.id,
      preferences: db.getPreferences(user.id)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token && token !== 'null' && token !== 'undefined') {
      const user = db.getUserById(token);
      if (user) {
        return res.json({
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt
          },
          preferences: db.getPreferences(user.id)
        });
      }
    }
  }
  return res.status(401).json({ error: 'Not authenticated', user: null, preferences: null });
});

app.put('/api/auth/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { displayName, avatarUrl } = req.body;
    const updated = db.updateUser(req.user.id, {
      ...(displayName ? { displayName } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {})
    });
    return res.json({ user: updated });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/password', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!db.verifyPassword(currentPassword, req.user.passwordHash)) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    db.updateUser(req.user.id, {
      passwordHash: db.hashPassword(newPassword)
    });
    return res.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Email OTP Authentication
app.post('/api/auth/send-otp', (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Generate secure 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    db.setOTP(normalizedEmail, code);

    console.log(`[AUTH] Generated OTP for ${normalizedEmail}: ${code}`);

    return res.json({
      success: true,
      message: `Verification code sent to ${normalizedEmail}`,
      // Provided for immediate frictionless testing in AI Studio preview environment
      previewOtp: code
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/verify-otp', (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const verification = db.verifyOTP(normalizedEmail, String(otp).trim());
    if (!verification.valid) {
      return res.status(400).json({ error: verification.reason || 'Invalid OTP code' });
    }

    // Find or automatically provision user profile
    let user = db.getUserByEmail(normalizedEmail);
    if (!user) {
      const displayName = normalizedEmail.split('@')[0];
      user = db.createUser({
        email: normalizedEmail,
        displayName: displayName.charAt(0).toUpperCase() + displayName.slice(1),
        passwordHash: db.hashPassword('OTP_AUTH_' + crypto.randomUUID())
      });
      seedSampleDatasets(user.id);
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt
      },
      token: user.id,
      preferences: db.getPreferences(user.id)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Signed out successfully' });
});

/* ========================================================================= */
/* ANALYSIS HISTORY ROUTES                                                   */
/* ========================================================================= */

app.get('/api/history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const history = db.getHistoryByUser(req.user.id);
    return res.json(history);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/history', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { datasetId, datasetName, queryPrompt, insightsCount, qualityScore, status, summary } = req.body;
    if (!datasetName) {
      return res.status(400).json({ error: 'datasetName is required' });
    }
    const item = db.addHistory({
      userId: req.user.id,
      datasetId,
      datasetName,
      queryPrompt: queryPrompt || '',
      insightsCount: Number(insightsCount) || 0,
      qualityScore: Number(qualityScore) || 100,
      status: status || 'completed',
      summary: summary || ''
    });
    return res.status(201).json(item);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/history/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const success = db.deleteHistory(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'History record not found' });
    }
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ========================================================================= */
/* PREFERENCES & SETTINGS ROUTES                                             */
/* ========================================================================= */

app.get('/api/preferences', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const prefs = db.getPreferences(req.user.id);
  return res.json(prefs);
});

app.put('/api/preferences', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const updated = db.updatePreferences(req.user.id, req.body);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/* ========================================================================= */
/* DATASET ROUTES                                                            */
/* ========================================================================= */

// List datasets
app.get('/api/datasets', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const datasets = db.listDatasets(req.user.id);
  return res.json(datasets);
});

// Get dataset
app.get('/api/datasets/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const dataset = db.getDataset(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
  if (dataset.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized access' });

  const versions = db.getDatasetVersions(dataset.id);
  const currentVersionData = db.getDatasetVersion(dataset.id, dataset.currentVersion);

  return res.json({
    dataset,
    versions,
    currentVersionData
  });
});

// Upload dataset
app.post('/api/datasets/upload', authMiddleware, upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase().replace('.', '');
    const validFormats = ['csv', 'xlsx', 'xls', 'json', 'pdf'];

    if (!validFormats.includes(ext)) {
      return res.status(400).json({ error: `Unsupported format: .${ext}. Supported: PDF, CSV, XLSX, XLS, JSON.` });
    }

    const name = req.body.name || path.basename(originalName, path.extname(originalName));
    const description = req.body.description || '';

    // Parse file into rows (supports PDF, CSV, Excel, JSON)
    const rows = await DataEngine.parseFile(req.file.buffer, ext, originalName);
    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'File contains 0 records or could not be parsed into tabular format.' });
    }

    const datasetId = 'ds_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
    const newDataset: Dataset = {
      id: datasetId,
      ownerId: req.user.id,
      name,
      description,
      originalFileName: originalName,
      fileFormat: ext as any,
      fileSize: req.file.size,
      rowCount: rows.length,
      columnCount: Object.keys(rows[0] || {}).length,
      currentVersion: 1,
      processingStatus: 'uploaded',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store raw file string/buffer
    const rawContent = ext === 'csv' || ext === 'json' ? req.file.buffer.toString('utf-8') : req.file.buffer.toString('base64');
    db.createDataset(newDataset, rawContent, rows);

    // Profile raw data immediately
    const qualityReport = DataEngine.profileDataset(datasetId, 1, rows);
    const v1 = {
      id: 'ver_' + datasetId + '_1',
      datasetId,
      versionNumber: 1,
      description: 'Original Raw Upload',
      rowCount: rows.length,
      columnCount: qualityReport.totalColumns,
      qualityScore: qualityReport.overallQualityScore,
      createdAt: newDataset.createdAt,
      qualityReport
    };
    db.addDatasetVersion(v1);

    // Auto-run pipeline if user requested immediate auto-clean
    const autoProcess = req.body.autoProcess === 'true' || req.body.autoProcess === true;
    if (autoProcess) {
      WorkflowOrchestrator.runFullWorkflow(datasetId, req.user.id).catch(err => {
        console.error('Async processing error:', err);
      });
    }

    return res.status(201).json({
      dataset: newDataset,
      qualityReport,
      previewRows: rows.slice(0, 15)
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: err.message || 'File processing failed' });
  }
});

// Run full pipeline on dataset
app.post('/api/datasets/:id/process', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = db.getDataset(req.params.id);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
    if (dataset.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const job = await WorkflowOrchestrator.runFullWorkflow(dataset.id, req.user.id);
    const updated = db.getDataset(dataset.id);
    const dashboard = db.getDashboard(dataset.id);

    return res.json({
      job,
      dataset: updated,
      dashboard
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Get rows for a dataset & version (paginated)
app.get('/api/datasets/:id/rows', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const dataset = db.getDataset(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
  if (dataset.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  const version = req.query.version ? Number(req.query.version) : dataset.currentVersion;
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 50;

  const rows = db.getDatasetRows(dataset.id, version);
  const total = rows.length;
  const startIndex = (page - 1) * limit;
  const paginated = rows.slice(startIndex, startIndex + limit);

  return res.json({
    rows: paginated,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    version
  });
});

// Get cleaning actions
app.get('/api/datasets/:id/actions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const actions = db.getCleaningActions(req.params.id);
  return res.json(actions);
});

// Restore dataset to a previous version
app.post('/api/datasets/:id/restore', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = db.getDataset(req.params.id);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
    if (dataset.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const targetVersion = Number(req.body.version);
    const versionObj = db.getDatasetVersion(dataset.id, targetVersion);
    if (!versionObj) return res.status(404).json({ error: 'Target version not found' });

    db.updateDataset(dataset.id, {
      currentVersion: targetVersion,
      rowCount: versionObj.rowCount,
      columnCount: versionObj.columnCount
    });

    // Re-generate dashboard for this restored version
    const rows = db.getDatasetRows(dataset.id, targetVersion);
    const newDash = AnalyticsEngine.generateDashboard(
      dataset.id,
      targetVersion,
      dataset.name,
      rows,
      versionObj.qualityReport
    );
    db.setDashboard(newDash);

    return res.json({
      message: `Restored dataset to Version ${targetVersion}`,
      dataset: db.getDataset(dataset.id),
      dashboard: newDash
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete dataset
app.delete('/api/datasets/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const dataset = db.getDataset(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
  if (dataset.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  db.deleteDataset(dataset.id);
  return res.json({ success: true, message: 'Dataset and all associated versions removed.' });
});

/* ========================================================================= */
/* DASHBOARD & EXPLANATION ROUTES                                            */
/* ========================================================================= */

app.get('/api/datasets/:id/dashboard', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const dataset = db.getDataset(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
  if (dataset.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  let dashboard = db.getDashboard(dataset.id);
  if (!dashboard) {
    // Generate now if not present
    const rows = db.getDatasetRows(dataset.id, dataset.currentVersion);
    const version = db.getDatasetVersion(dataset.id, dataset.currentVersion);
    if (version) {
      dashboard = AnalyticsEngine.generateDashboard(
        dataset.id,
        dataset.currentVersion,
        dataset.name,
        rows,
        version.qualityReport
      );
      db.setDashboard(dashboard);
    }
  }

  return res.json(dashboard);
});

app.post('/api/datasets/:id/explain-chart', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const { chartId, chartTitle, chartData, analyticalExplanation } = req.body;
  const explanation = AIAnalyst.explainChart(chartId, chartTitle, chartData, analyticalExplanation);
  return res.json(explanation);
});

/* ========================================================================= */
/* AI ANALYST & CHAT ROUTES                                                  */
/* ========================================================================= */

app.get('/api/datasets/:id/conversation', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const dataset = db.getDataset(req.params.id);
  if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
  if (dataset.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

  const conv = db.getOrCreateConversation(req.user.id, dataset.id);
  return res.json(conv);
});

app.post('/api/datasets/:id/chat', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const dataset = db.getDataset(req.params.id);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });
    if (dataset.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });

    const { question, chartContextId } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Question text is required' });
    }

    const conv = db.getOrCreateConversation(req.user.id, dataset.id);

    // Save user message
    db.addMessage(conv.id, {
      conversationId: conv.id,
      role: 'user',
      content: question,
      chartContextId
    });

    const rows = db.getDatasetRows(dataset.id, dataset.currentVersion);
    const versionObj = db.getDatasetVersion(dataset.id, dataset.currentVersion);
    const qualityReport = versionObj?.qualityReport || DataEngine.profileDataset(dataset.id, dataset.currentVersion, rows);

    // Run AI Analyst & Answer Verification
    const analysis = await AIAnalyst.answerQuestion({
      question,
      datasetId: dataset.id,
      datasetName: dataset.name,
      versionNumber: dataset.currentVersion,
      rows,
      qualityReport
    });

    // Save verification record
    db.addVerification(analysis.evidence);

    // Save assistant message with attached evidence
    const assistantMsg = db.addMessage(conv.id, {
      conversationId: conv.id,
      role: 'assistant',
      content: analysis.answer,
      evidence: analysis.evidence,
      suggestedFollowUps: analysis.suggestedFollowUps,
      chartContextId
    });

    return res.json({
      message: assistantMsg,
      evidence: analysis.evidence,
      suggestedFollowUps: analysis.suggestedFollowUps
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: err.message || 'Analysis failed' });
  }
});

/* ========================================================================= */
/* PROCESSING JOBS & REPORTS                                                 */
/* ========================================================================= */

app.get('/api/jobs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const jobs = db.listJobs(req.user.id);
  return res.json(jobs);
});

app.get('/api/jobs/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const job = db.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  return res.json(job);
});

app.delete('/api/jobs/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const job = db.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.ownerId !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
  db.deleteJob(req.params.id);
  return res.json({ success: true, message: 'Job removed' });
});

app.delete('/api/jobs', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const count = db.clearJobs(req.user.id);
  return res.json({ success: true, count, message: 'All pipeline jobs cleared.' });
});

app.get('/api/reports', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const reports = db.listSavedReports(req.user.id);
  return res.json(reports);
});

app.post('/api/reports', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { datasetId, title, summary, kpis, charts, keyFindings } = req.body;
    const dataset = db.getDataset(datasetId);
    if (!dataset) return res.status(404).json({ error: 'Dataset not found' });

    const newReport = db.createSavedReport({
      id: 'rep_' + Date.now().toString(36),
      ownerId: req.user.id,
      datasetId,
      datasetName: dataset.name,
      title: title || `${dataset.name} Analysis Summary`,
      summary: summary || 'Executive summary report',
      kpis: kpis || [],
      charts: charts || [],
      keyFindings: keyFindings || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return res.status(201).json(newReport);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete('/api/reports/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  db.deleteSavedReport(req.params.id);
  return res.json({ success: true });
});

// Personal data export
app.get('/api/users/export-data', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user.id;
  const datasets = db.listDatasets(userId);
  const reports = db.listSavedReports(userId);
  const jobs = db.listJobs(userId);
  const preferences = db.getPreferences(userId);

  return res.json({
    user: { id: req.user.id, email: req.user.email, displayName: req.user.displayName },
    preferences,
    datasets,
    savedReports: reports,
    processingHistory: jobs,
    exportedAt: new Date().toISOString()
  });
});

/* ========================================================================= */
/* VITE DEV / PRODUCTION STATIC SERVER                                       */
/* ========================================================================= */

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true }
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoInsight server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  accentColor: 'navy' | 'blue' | 'teal' | 'indigo' | 'emerald';
  fontSize: 'small' | 'normal' | 'large';
  density: 'comfortable' | 'compact';
  highContrast: boolean;
  reducedMotion: boolean;
  dateFormat: string;
  numberFormat: string;
  sidebarCollapsed: boolean;
  defaultCleaningStrategy: 'auto' | 'conservative' | 'aggressive';
  retentionDays: number;
}

export interface Dataset {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  originalFileName: string;
  fileFormat: 'csv' | 'xlsx' | 'xls' | 'json' | 'pdf';
  fileSize: number;
  rowCount: number;
  columnCount: number;
  currentVersion: number;
  processingStatus: 'uploaded' | 'profiling' | 'cleaning' | 'validating' | 'dashboard_generation' | 'ready_for_analysis' | 'failed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export type ColumnType = 'integer' | 'float' | 'date' | 'categorical' | 'boolean' | 'text' | 'id';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  rawType: string;
  totalCount: number;
  nonNullCount: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  isUnique: boolean;
  isConstant: boolean;
  sampleValues: any[];
  // Numeric stats
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  q1?: number;
  q3?: number;
  iqr?: number;
  outlierCount?: number;
  // Categorical stats
  topCategories?: { value: string; count: number; percentage: number }[];
  // Quality issues
  issues: string[];
}

export interface DataQualityReport {
  datasetId: string;
  version: number;
  totalRows: number;
  totalColumns: number;
  duplicateRows: number;
  duplicateRowsPercentage: number;
  emptyColumns: string[];
  constantColumns: string[];
  columnsWithNulls: { column: string; count: number; percentage: number }[];
  columnsWithOutliers: { column: string; count: number }[];
  typeMismatchColumns: string[];
  overallQualityScore: number; // 0 to 100
  summaryFriendly: string;
  columnProfiles: Record<string, ColumnProfile>;
  warnings: string[];
  detectedDateColumns: string[];
  detectedNumericColumns: string[];
  detectedCategoricalColumns: string[];
}

export interface CleaningActionItem {
  id: string;
  datasetId: string;
  version: number;
  timestamp: string;
  column: string;
  operation: 'remove_duplicates' | 'trim_whitespace' | 'convert_type' | 'impute_missing' | 'handle_outliers' | 'drop_constant_column' | 'standardize_dates';
  parameters: Record<string, any>;
  affectedRows: number;
  affectedValues: number;
  beforeCount?: number;
  afterCount?: number;
  reason: string;
  validationOutcome: string;
  isApproved: boolean;
  isAutomatic: boolean;
}

export interface CleaningPlanRecommendation {
  id: string;
  targetColumn: string;
  issueType: string;
  recommendedOperation: 'remove_duplicates' | 'trim_whitespace' | 'convert_type' | 'impute_missing' | 'handle_outliers' | 'drop_constant_column' | 'standardize_dates';
  parameters: Record<string, any>;
  reason: string;
  expectedEffect: string;
  confidence: number;
  requiresApproval: boolean;
}

export interface BeforeAfterReport {
  originalRowCount: number;
  finalRowCount: number;
  originalColumnCount: number;
  finalColumnCount: number;
  missingValuesBefore: number;
  missingValuesAfter: number;
  duplicateRowsBefore: number;
  duplicateRowsAfter: number;
  typeConversionsCount: number;
  invalidValuesResolved: number;
  rowsRemovedCount: number;
  rowsRemovedReasons: string[];
  remainingIssues: string[];
  warnings: string[];
  appliedActions: CleaningActionItem[];
}

export interface DatasetVersion {
  id: string;
  datasetId: string;
  versionNumber: number;
  description: string;
  rowCount: number;
  columnCount: number;
  qualityScore: number;
  createdAt: string;
  qualityReport: DataQualityReport;
  beforeAfterReport?: BeforeAfterReport;
}

export interface KPICardDef {
  id: string;
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  format?: 'currency' | 'number' | 'percentage' | 'text';
  changePercentage?: number;
  changeTrend?: 'up' | 'down' | 'neutral';
  explanation: string;
  formula: string;
  assumptions?: string;
  sourceColumn: string;
}

export interface ChartDef {
  id: string;
  title: string;
  description: string;
  chartType: 'bar' | 'line' | 'pie' | 'doughnut' | 'scatter' | 'histogram' | 'boxplot' | 'heatmap';
  xAxisColumn?: string;
  yAxisColumn?: string;
  categoryColumn?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  data: any[];
  echartsOption: Record<string, any>;
  analyticalExplanation: {
    summary: string;
    keyObservations: string[];
    potentialDrivers: string[];
    suggestedInvestigation: string[];
    metricDefinition: string;
  };
}

export interface DashboardConfig {
  id: string;
  datasetId: string;
  versionNumber: number;
  title: string;
  kpis: KPICardDef[];
  charts: ChartDef[];
  availableFilters: {
    column: string;
    type: 'categorical' | 'date' | 'numeric';
    options?: string[];
    min?: number | string;
    max?: number | string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingJob {
  id: string;
  datasetId: string;
  ownerId: string;
  jobType: 'profile' | 'clean' | 'dashboard' | 'analysis';
  currentStage: string;
  status: 'queued' | 'running' | 'completed' | 'completed_with_warnings' | 'failed' | 'cancelled';
  progressPercentage: number;
  startTime: string;
  endTime?: string;
  durationMs?: number;
  metrics: {
    fileReadingMs?: number;
    profilingMs?: number;
    cleaningMs?: number;
    validationMs?: number;
    dashboardGenMs?: number;
    llmResponseMs?: number;
    totalMs?: number;
    rowsProcessed?: number;
    rowsPerSecond?: number;
    valuesChanged?: number;
  };
  errorDetails?: string;
  logs: ProcessingLogItem[];
}

export interface ProcessingLogItem {
  id: string;
  jobId: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  eventType: string;
  message: string;
  metadata?: Record<string, any>;
}

export type VerificationStatus = 'verified_calculation' | 'partially_verified' | 'unverified_explanation' | 'verification_failed';

export interface VerificationEvidence {
  id: string;
  analysisRunId: string;
  claim: string;
  datasetId: string;
  datasetName: string;
  datasetVersion: number;
  sourceColumns: string[];
  metricDefinition: string;
  filtersApplied: Record<string, any>;
  calculationQuery: string;
  intermediateSteps: { step: string; result: any }[];
  resultValue: any;
  recordsIncludedCount: number;
  recordsExcludedCount: number;
  exclusionReason?: string;
  linkedChartId?: string;
  sampleRecordIds?: any[];
  verificationStatus: VerificationStatus;
  statusExplanation: string;
  checksPerformed: { checkName: string; passed: boolean; details: string }[];
  knownLimitations: string[];
  reproducibilityToken: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  evidence?: VerificationEvidence;
  suggestedFollowUps?: string[];
  chartContextId?: string;
}

export interface Conversation {
  id: string;
  ownerId: string;
  datasetId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface SavedReport {
  id: string;
  ownerId: string;
  datasetId: string;
  datasetName: string;
  title: string;
  summary: string;
  kpis: KPICardDef[];
  charts: ChartDef[];
  keyFindings: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisHistoryRecord {
  id: string;
  userId: string;
  datasetId?: string;
  datasetName: string;
  queryPrompt?: string;
  insightsCount: number;
  qualityScore: number;
  status: 'completed' | 'in_progress' | 'failed';
  summary?: string;
  createdAt: string;
}


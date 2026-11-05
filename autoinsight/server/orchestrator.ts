import crypto from 'crypto';
import { db } from './db';
import { DataEngine } from './dataEngine';
import { AnalyticsEngine } from './analyticsEngine';
import { ProcessingJob, ProcessingLogItem } from './types';

export class WorkflowOrchestrator {
  /**
   * Run end-to-end dataset processing workflow
   */
  public static async runFullWorkflow(
    datasetId: string,
    ownerId: string,
    onProgress?: (job: ProcessingJob) => void
  ): Promise<ProcessingJob> {
    const dataset = db.getDataset(datasetId);
    if (!dataset) throw new Error(`Dataset not found: ${datasetId}`);

    const jobId = 'job_' + crypto.randomUUID().slice(0, 8);
    const startTime = new Date().toISOString();
    const startMs = Date.now();

    const job: ProcessingJob = {
      id: jobId,
      datasetId,
      ownerId,
      jobType: 'clean',
      currentStage: 'Profiling',
      status: 'running',
      progressPercentage: 10,
      startTime,
      metrics: {
        totalMs: 0,
        rowsProcessed: dataset.rowCount,
        valuesChanged: 0
      },
      logs: []
    };

    db.createJob(job);

    const addLog = (severity: ProcessingLogItem['severity'], eventType: string, message: string, meta?: any) => {
      const logItem: ProcessingLogItem = {
        id: 'log_' + crypto.randomUUID().slice(0, 6),
        jobId,
        timestamp: new Date().toISOString(),
        severity,
        eventType,
        message,
        metadata: meta
      };
      job.logs.push(logItem);
      db.updateJob(jobId, { logs: job.logs });
      if (onProgress) onProgress(job);
    };

    try {
      addLog('info', 'WORKFLOW_STARTED', `Initiated automated analysis pipeline for "${dataset.name}".`);

      // 1. Stage: Profiling (Version 1 / Raw)
      db.updateDataset(datasetId, { processingStatus: 'profiling' });
      job.currentStage = 'Profiling data quality';
      job.progressPercentage = 25;
      db.updateJob(jobId, { currentStage: job.currentStage, progressPercentage: job.progressPercentage });

      const profileStartMs = Date.now();
      const rawRows = db.getDatasetRows(datasetId, 1);
      addLog('info', 'PROFILING_START', `Analyzing ${rawRows.length} raw records for schema, nulls, outliers, and duplicates...`);

      const rawReport = DataEngine.profileDataset(datasetId, 1, rawRows);
      const profileMs = Date.now() - profileStartMs;
      job.metrics.profilingMs = profileMs;

      addLog(
        rawReport.overallQualityScore >= 80 ? 'info' : 'warning',
        'PROFILING_COMPLETE',
        `Profiling finished in ${profileMs}ms. Score: ${rawReport.overallQualityScore}/100. Issues detected: ${rawReport.duplicateRows} duplicates, ${rawReport.columnsWithNulls.length} columns with missing data.`
      );

      // Save version 1 (Raw) if not saved
      let v1 = db.getDatasetVersion(datasetId, 1);
      if (!v1) {
        v1 = {
          id: 'ver_' + datasetId + '_1',
          datasetId,
          versionNumber: 1,
          description: 'Original Raw Upload',
          rowCount: rawRows.length,
          columnCount: rawReport.totalColumns,
          qualityScore: rawReport.overallQualityScore,
          createdAt: dataset.createdAt,
          qualityReport: rawReport
        };
        db.addDatasetVersion(v1);
      }

      // 2. Stage: Generate & Execute Cleaning Plan
      db.updateDataset(datasetId, { processingStatus: 'cleaning' });
      job.currentStage = 'Executing automated cleaning plan';
      job.progressPercentage = 50;
      db.updateJob(jobId, { currentStage: job.currentStage, progressPercentage: job.progressPercentage });

      const cleanStartMs = Date.now();
      const cleaningPlan = DataEngine.generateCleaningPlan(rawReport);
      addLog('info', 'CLEANING_PLAN_GENERATED', `Generated structured plan with ${cleaningPlan.length} safe deterministic transformations.`);

      const cleaningResult = DataEngine.executeCleaning(datasetId, 1, rawRows, cleaningPlan);
      const cleanMs = Date.now() - cleanStartMs;
      job.metrics.cleaningMs = cleanMs;
      job.metrics.valuesChanged = cleaningResult.beforeAfterReport.typeConversionsCount + cleaningResult.beforeAfterReport.invalidValuesResolved;

      // Save cleaned actions
      cleaningResult.appliedActions.forEach(a => db.addCleaningAction(a));
      // Store cleaned rows as Version 2
      db.setDatasetRows(datasetId, 2, cleaningResult.cleanedRows);

      addLog(
        'success',
        'CLEANING_COMPLETE',
        `Cleaned dataset in ${cleanMs}ms. Removed ${cleaningResult.beforeAfterReport.rowsRemovedCount} rows, resolved ${cleaningResult.beforeAfterReport.invalidValuesResolved} invalid values, converted ${cleaningResult.beforeAfterReport.typeConversionsCount} types.`
      );

      // 3. Stage: Validating Cleaned Data
      db.updateDataset(datasetId, { processingStatus: 'validating' });
      job.currentStage = 'Validating cleaned dataset';
      job.progressPercentage = 75;
      db.updateJob(jobId, { currentStage: job.currentStage, progressPercentage: job.progressPercentage });

      const validStartMs = Date.now();
      const cleanedReport = DataEngine.profileDataset(datasetId, 2, cleaningResult.cleanedRows);
      const validMs = Date.now() - validStartMs;
      job.metrics.validationMs = validMs;

      // Save version 2
      const v2 = {
        id: 'ver_' + datasetId + '_2',
        datasetId,
        versionNumber: 2,
        description: 'Auto-Cleaned & Validated Version',
        rowCount: cleaningResult.cleanedRows.length,
        columnCount: cleanedReport.totalColumns,
        qualityScore: cleanedReport.overallQualityScore,
        createdAt: new Date().toISOString(),
        qualityReport: cleanedReport,
        beforeAfterReport: cleaningResult.beforeAfterReport
      };
      db.addDatasetVersion(v2);
      db.updateDataset(datasetId, {
        currentVersion: 2,
        rowCount: cleaningResult.cleanedRows.length,
        columnCount: cleanedReport.totalColumns
      });

      addLog('success', 'VALIDATION_PASSED', `Validation passed in ${validMs}ms. Quality score increased from ${rawReport.overallQualityScore} to ${cleanedReport.overallQualityScore}/100.`);

      // 4. Stage: Dashboard Generation
      db.updateDataset(datasetId, { processingStatus: 'dashboard_generation' });
      job.currentStage = 'Generating interactive dashboard';
      job.progressPercentage = 90;
      db.updateJob(jobId, { currentStage: job.currentStage, progressPercentage: job.progressPercentage });

      const dashStartMs = Date.now();
      const dashboard = AnalyticsEngine.generateDashboard(
        datasetId,
        2,
        dataset.name,
        cleaningResult.cleanedRows,
        cleanedReport
      );
      const dashMs = Date.now() - dashStartMs;
      job.metrics.dashboardGenMs = dashMs;

      db.setDashboard(dashboard);
      addLog('success', 'DASHBOARD_READY', `Generated executive dashboard with ${dashboard.kpis.length} KPIs and ${dashboard.charts.length} interactive charts in ${dashMs}ms.`);

      // 5. Completed
      const totalDuration = Date.now() - startMs;
      job.metrics.totalMs = totalDuration;
      job.metrics.rowsPerSecond = Math.round((dataset.rowCount / (totalDuration / 1000)) * 10) / 10;
      job.status = 'completed';
      job.currentStage = 'Completed';
      job.progressPercentage = 100;
      job.endTime = new Date().toISOString();
      job.durationMs = totalDuration;

      db.updateDataset(datasetId, { processingStatus: 'ready_for_analysis' });
      db.updateJob(jobId, job);

      addLog('success', 'PIPELINE_COMPLETE', `Workflow completed successfully in ${totalDuration}ms (${job.metrics.rowsPerSecond} rows/sec).`);

      return job;
    } catch (err: any) {
      console.error('Workflow error:', err);
      job.status = 'failed';
      job.currentStage = 'Failed';
      job.errorDetails = err.message || String(err);
      job.endTime = new Date().toISOString();
      job.durationMs = Date.now() - startMs;

      addLog('error', 'WORKFLOW_FAILED', `Execution failed: ${job.errorDetails}`);
      db.updateDataset(datasetId, { processingStatus: 'failed' });
      db.updateJob(jobId, job);
      throw err;
    }
  }
}

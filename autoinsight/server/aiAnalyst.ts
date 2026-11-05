import { GoogleGenAI } from '@google/genai';
import { AnalyticsEngine } from './analyticsEngine';
import { Verifier } from './verifier';
import { VerificationEvidence, ChatMessage, DataQualityReport } from './types';
import { DataEngine } from './dataEngine';

export class AIAnalyst {
  /**
   * Process a question about a dataset
   */
  public static async answerQuestion(params: {
    question: string;
    datasetId: string;
    datasetName: string;
    versionNumber: number;
    rows: any[];
    qualityReport: DataQualityReport;
    chartContext?: any;
  }): Promise<{
    answer: string;
    evidence: VerificationEvidence;
    suggestedFollowUps: string[];
  }> {
    const { question, datasetId, datasetName, versionNumber, rows, qualityReport } = params;

    const apiKey = process.env.GEMINI_API_KEY;
    const hasValidKey = apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0;

    // First, determine if we can process via Gemini or deterministic smart engine
    let analyticalPlan = this.parseQuestionIntent(question, qualityReport, rows);

    // Execute the deterministic query plan
    const queryResult = AnalyticsEngine.executeAnalyticalQuery(rows, analyticalPlan.query);

    let answerText = '';
    let suggestedFollowUps: string[] = [];

    if (hasValidKey) {
      try {
        const ai = new GoogleGenAI();
        const prompt = `
You are AutoInsight's Data Analyst. A user asked: "${question}"
Dataset: "${datasetName}" (Version ${versionNumber}, ${rows.length} rows).

The deterministic data engine executed the following calculation:
- Query: ${queryResult.calculationDetails}
- Result: ${JSON.stringify(queryResult.result)}
- Records Included: ${queryResult.recordsIncluded}
- Records Excluded: ${queryResult.recordsExcluded}
- Steps: ${JSON.stringify(queryResult.intermediateSteps)}

Column Schema & Types:
${Object.entries(qualityReport.columnProfiles).map(([c, p]) => `- ${c} (${p.type}, nulls: ${p.nullCount})`).join('\n')}

INSTRUCTIONS:
1. Provide a direct, plain-English, non-technical explanation answering the user's question.
2. You MUST cite the exact calculated numbers from the Result (${typeof queryResult.result === 'number' ? queryResult.result : JSON.stringify(queryResult.result)}). Do NOT invent or alter the numbers.
3. If the user asks for causes or "why", explain that this is an observed trend/correlation and cannot definitively prove causation without a controlled test.
4. Keep the response concise, clear, and actionable.
5. At the end, output on a new line "FOLLOW_UPS:" followed by 3 short follow-up questions separated by "|"
`;

        const generatePromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt
        });
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('LLM response timeout')), 8000)
        );

        const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

        const rawText = response.text || '';
        if (rawText.includes('FOLLOW_UPS:')) {
          const parts = rawText.split('FOLLOW_UPS:');
          answerText = parts[0].trim();
          suggestedFollowUps = parts[1].split('|').map((s: string) => s.trim()).filter(Boolean);
        } else {
          answerText = rawText.trim();
        }
      } catch (err) {
        console.warn('Gemini API call skipped or encountered error, falling back to deterministic generation:', err);
      }
    }

    // Fallback or default deterministic explanation if Gemini didn't generate
    if (!answerText) {
      const generated = this.generateDeterministicAnswer(
        question,
        analyticalPlan,
        queryResult,
        qualityReport,
        rows.length
      );
      answerText = generated.text;
      suggestedFollowUps = generated.followUps;
    }

    // Phase 5: Verification of the answer
    const evidence = Verifier.verifyClaim({
      claim: question,
      datasetId,
      datasetName,
      datasetVersion: versionNumber,
      sourceColumns: analyticalPlan.sourceColumns,
      metricDefinition: analyticalPlan.metricDefinition,
      filtersApplied: analyticalPlan.query.filters ? { filters: analyticalPlan.query.filters } : {},
      calculationQuery: queryResult.calculationDetails,
      calculationResult: queryResult.result,
      recordsIncludedCount: queryResult.recordsIncluded,
      recordsExcludedCount: queryResult.recordsExcluded,
      intermediateSteps: queryResult.intermediateSteps,
      sampleRows: rows.slice(0, 5),
      answerText
    });

    return {
      answer: answerText,
      evidence,
      suggestedFollowUps: suggestedFollowUps.length > 0 ? suggestedFollowUps : [
        'What are the key drivers behind these numbers?',
        'How does this break down by category?',
        'Are there any unusual outliers affecting this result?'
      ]
    };
  }

  /**
   * Determine query intent from natural language
   */
  private static parseQuestionIntent(
    question: string,
    report: DataQualityReport,
    rows: any[]
  ): {
    query: Parameters<typeof AnalyticsEngine.executeAnalyticalQuery>[1];
    sourceColumns: string[];
    metricDefinition: string;
  } {
    const q = question.toLowerCase();
    const numCols = report.detectedNumericColumns;
    const catCols = report.detectedCategoricalColumns;

    // Check if correlation question
    if (q.includes('correlation') || q.includes('relationship') || q.includes('related')) {
      if (numCols.length >= 2) {
        return {
          query: {
            operation: 'correlation',
            targetColumn: numCols[0],
            secondaryColumn: numCols[1]
          },
          sourceColumns: [numCols[0], numCols[1]],
          metricDefinition: `Pearson correlation coefficient between ${numCols[0]} and ${numCols[1]}`
        };
      }
    }

    // Check for "highest", "top", "best", "most", "lowest", "worst", "product", "category"
    if (q.includes('highest') || q.includes('top') || q.includes('best') || q.includes('most') || q.includes('lowest') || q.includes('worst') || q.includes('category') || q.includes('contribute')) {
      // Find matching categorical column
      const matchedCat = catCols.find(c => q.includes(c.toLowerCase())) || catCols[0] || Object.keys(rows[0] || {})[0];
      const matchedNum = numCols.find(c => q.includes(c.toLowerCase())) || numCols[0];

      return {
        query: {
          operation: 'top_n',
          groupByColumn: matchedCat,
          targetColumn: matchedNum,
          limit: 10
        },
        sourceColumns: matchedNum ? [matchedCat, matchedNum] : [matchedCat],
        metricDefinition: matchedNum
          ? `SUM(${matchedNum}) grouped by ${matchedCat}, sorted descending`
          : `COUNT(*) grouped by ${matchedCat}`
      };
    }

    // Check for "average" or "mean"
    if (q.includes('average') || q.includes('mean') || q.includes('avg')) {
      const matchedNum = numCols.find(c => q.includes(c.toLowerCase())) || numCols[0];
      return {
        query: {
          operation: 'avg',
          targetColumn: matchedNum
        },
        sourceColumns: [matchedNum],
        metricDefinition: `Arithmetic mean: SUM(${matchedNum}) / COUNT(*)`
      };
    }

    // Check for "total" or "sum" or "revenue" or "sales"
    if (q.includes('total') || q.includes('sum') || q.includes('revenue') || q.includes('sales')) {
      const matchedNum = numCols.find(c => q.includes(c.toLowerCase())) || numCols[0];
      return {
        query: {
          operation: 'sum',
          targetColumn: matchedNum
        },
        sourceColumns: [matchedNum],
        metricDefinition: `Cumulative sum: SUM(${matchedNum})`
      };
    }

    // Check for "how many", "count", "number of records"
    if (q.includes('how many') || q.includes('count') || q.includes('number of')) {
      return {
        query: {
          operation: 'count'
        },
        sourceColumns: ['ALL_ROWS'],
        metricDefinition: 'Total count of rows in current dataset'
      };
    }

    // Default: Summary of primary metric or count
    const defaultNum = numCols[0];
    if (defaultNum) {
      return {
        query: {
          operation: 'sum',
          targetColumn: defaultNum
        },
        sourceColumns: [defaultNum],
        metricDefinition: `Cumulative sum: SUM(${defaultNum})`
      };
    }

    return {
      query: { operation: 'count' },
      sourceColumns: ['ALL_ROWS'],
      metricDefinition: 'COUNT(*)'
    };
  }

  /**
   * Deterministic answer generator when offline or no API key
   */
  private static generateDeterministicAnswer(
    question: string,
    plan: ReturnType<typeof AIAnalyst.parseQuestionIntent>,
    calc: ReturnType<typeof AnalyticsEngine.executeAnalyticalQuery>,
    report: DataQualityReport,
    totalRows: number
  ): { text: string; followUps: string[] } {
    const q = question.toLowerCase();

    if (plan.query.operation === 'sum') {
      const num = Number(calc.result);
      const formatted = num.toLocaleString();
      return {
        text: `Based on an exact calculation across all ${calc.recordsIncluded} verified records, the total ${plan.sourceColumns[0]} is **${formatted}**. ${calc.recordsExcluded > 0 ? `Note that ${calc.recordsExcluded} records were excluded due to missing or invalid entries.` : 'All rows were completely valid.'}`,
        followUps: [
          `What is the average ${plan.sourceColumns[0]}?`,
          `Which category contributes the most to ${plan.sourceColumns[0]}?`,
          `How has this total changed over time?`
        ]
      };
    }

    if (plan.query.operation === 'avg') {
      const avg = Number(calc.result);
      return {
        text: `The calculated average for ${plan.sourceColumns[0]} is **${avg.toLocaleString()}** (computed across ${calc.recordsIncluded} records). This represents the central tendency of the metric.`,
        followUps: [
          `What are the minimum and maximum values for ${plan.sourceColumns[0]}?`,
          `Are there any statistical outliers pulling this average?`,
          `How does the average differ across segments?`
        ]
      };
    }

    if (plan.query.operation === 'top_n' || plan.query.operation === 'group_by') {
      const list = calc.result as { group: string; count: number; sum?: number; avg?: number }[];
      if (!list || list.length === 0) {
        return {
          text: `No categorized records were found matching your criteria.`,
          followUps: ['Show overall summary statistics']
        };
      }
      const top = list[0];
      const hasMetric = top.sum !== undefined;
      const topVal = hasMetric ? `$${top.sum?.toLocaleString()}` : `${top.count} records`;

      const listFormatted = list
        .slice(0, 5)
        .map((item, idx) => `${idx + 1}. **${item.group}**: ${hasMetric ? item.sum?.toLocaleString() : `${item.count} rows`}`)
        .join('\n');

      return {
        text: `The highest performing segment is **${top.group}** with a total of **${topVal}**.\n\nTop 5 ranked groups:\n${listFormatted}\n\nThis distribution reflects verified aggregations from ${calc.recordsIncluded} records.`,
        followUps: [
          `What percentage does ${top.group} represent of the total?`,
          `Are there outliers within ${top.group}?`,
          `What is the trend for the lowest performing category?`
        ]
      };
    }

    if (plan.query.operation === 'correlation') {
      const r = Number(calc.result);
      let desc = 'weak or negligible correlation';
      if (Math.abs(r) > 0.7) desc = r > 0 ? 'strong positive correlation' : 'strong negative correlation';
      else if (Math.abs(r) > 0.4) desc = r > 0 ? 'moderate positive correlation' : 'moderate negative correlation';

      return {
        text: `The Pearson correlation coefficient between **${plan.sourceColumns[0]}** and **${plan.sourceColumns[1]}** is **${r}**, indicating a ${desc} across ${calc.recordsIncluded} paired observations.\n\n*Important:* A statistical correlation demonstrates an association, but does not prove direct causation without an experimental test.`,
        followUps: [
          'Show the scatter plot for this relationship',
          'Which category has the highest values for both columns?',
          'Are there extreme outliers influencing this correlation?'
        ]
      };
    }

    return {
      text: `There are **${calc.recordsIncluded}** total valid records in this dataset version. Data profiling reveals an overall quality score of ${report.overallQualityScore}/100 across ${report.totalColumns} attributes.`,
      followUps: [
        'What is the highest revenue product or category?',
        'Are there any missing values remaining?',
        'Show the key trends over time'
      ]
    };
  }

  /**
   * Explain a specific chart based on underlying data facts
   */
  public static explainChart(
    chartId: string,
    chartTitle: string,
    chartData: any,
    analyticalExplanation: any
  ): {
    explanation: string;
    keyPoints: string[];
    potentialDrivers: string[];
    suggestedNextSteps: string[];
  } {
    if (analyticalExplanation) {
      return {
        explanation: analyticalExplanation.summary || `Analysis for ${chartTitle}`,
        keyPoints: analyticalExplanation.keyObservations || [],
        potentialDrivers: analyticalExplanation.potentialDrivers || [],
        suggestedNextSteps: analyticalExplanation.suggestedInvestigation || []
      };
    }

    return {
      explanation: `This chart presents the aggregated distribution for "${chartTitle}".`,
      keyPoints: [
        'Data represents verified observations from the active dataset version.',
        'Values have been normalized and cleaned to prevent skew.'
      ],
      potentialDrivers: [
        'Underlying business seasonality and transactional distribution.'
      ],
      suggestedNextSteps: [
        'Drill into specific sub-periods or filter by top categories to isolate variance.'
      ]
    };
  }
}

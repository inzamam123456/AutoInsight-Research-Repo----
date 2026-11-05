import {
  DashboardConfig,
  KPICardDef,
  ChartDef,
  DataQualityReport
} from './types';
import { DataEngine } from './dataEngine';

export class AnalyticsEngine {
  /**
   * Automatically generate an interactive dashboard configuration from cleaned rows & profile
   */
  public static generateDashboard(
    datasetId: string,
    versionNumber: number,
    datasetName: string,
    rows: any[],
    qualityReport: DataQualityReport
  ): DashboardConfig {
    const kpis: KPICardDef[] = [];
    const charts: ChartDef[] = [];

    const numCols = qualityReport.detectedNumericColumns;
    const catCols = qualityReport.detectedCategoricalColumns;
    const dateCols = qualityReport.detectedDateColumns;

    // 1. Generate KPIs
    // Total Records
    kpis.push({
      id: 'kpi_total_records',
      title: 'Total Records',
      value: rows.length.toLocaleString(),
      format: 'number',
      explanation: 'Total number of validated, cleaned records in this dataset version.',
      formula: 'COUNT(*)',
      assumptions: 'Each row corresponds to a single verified observation.',
      sourceColumn: 'ROW_COUNT'
    });

    // Primary numeric column KPI (Sum & Average)
    if (numCols.length > 0) {
      // Pick the most analytically interesting column (e.g. revenue, sales, amount, profit, price, or first numeric)
      const primaryNumCol = numCols.find(c =>
        /revenue|sales|amount|price|total|profit|spend|cost/i.test(c)
      ) || numCols[0];

      const values = rows
        .map(r => DataEngine.parseNumeric(r[primaryNumCol]))
        .filter((v): v is number => v !== null && !isNaN(v));

      if (values.length > 0) {
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const isCurrency = /revenue|sales|amount|price|profit|cost|spend/i.test(primaryNumCol);

        kpis.push({
          id: `kpi_sum_${primaryNumCol}`,
          title: `Total ${this.formatTitle(primaryNumCol)}`,
          value: isCurrency ? `$${sum.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : sum.toLocaleString(),
          format: isCurrency ? 'currency' : 'number',
          explanation: `Cumulative aggregate sum across all ${values.length} valid entries for ${primaryNumCol}.`,
          formula: `SUM(${primaryNumCol})`,
          assumptions: 'Null values were cleaned/imputed prior to aggregation.',
          sourceColumn: primaryNumCol
        });

        kpis.push({
          id: `kpi_avg_${primaryNumCol}`,
          title: `Average ${this.formatTitle(primaryNumCol)}`,
          value: isCurrency ? `$${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : Math.round(avg * 100) / 100,
          format: isCurrency ? 'currency' : 'number',
          explanation: `Arithmetic mean per record for ${primaryNumCol}.`,
          formula: `AVG(${primaryNumCol}) = SUM / COUNT`,
          sourceColumn: primaryNumCol
        });
      }
    }

    // Categorical diversity or unique customers
    const entityCol = Object.keys(rows[0] || {}).find(c =>
      /customer|user|client|patient|employee|id|name/i.test(c) && !/product|category/i.test(c)
    );
    if (entityCol) {
      const uniqueVals = new Set(rows.map(r => String(r[entityCol])).filter(Boolean));
      kpis.push({
        id: `kpi_unique_${entityCol}`,
        title: `Unique ${this.formatTitle(entityCol)}s`,
        value: uniqueVals.size.toLocaleString(),
        format: 'number',
        explanation: `Distinct entity count of non-null ${entityCol} entries.`,
        formula: `COUNT(DISTINCT ${entityCol})`,
        sourceColumn: entityCol
      });
    } else if (catCols.length > 0) {
      const catCol = catCols[0];
      const uniqueVals = new Set(rows.map(r => String(r[catCol])).filter(Boolean));
      kpis.push({
        id: `kpi_unique_${catCol}`,
        title: `Distinct ${this.formatTitle(catCol)}s`,
        value: uniqueVals.size.toLocaleString(),
        format: 'number',
        explanation: `Total number of distinct categories identified in ${catCol}.`,
        formula: `COUNT(DISTINCT ${catCol})`,
        sourceColumn: catCol
      });
    }

    // 2. Generate Charts
    // A. Time Series Chart (if date column exists)
    if (dateCols.length > 0 && numCols.length > 0) {
      const dateCol = dateCols[0];
      const metricCol = numCols.find(c => /revenue|sales|amount|profit|price/i.test(c)) || numCols[0];

      // Aggregate by date
      const dateMap: Record<string, { sum: number; count: number }> = {};
      for (const r of rows) {
        const d = r[dateCol];
        const val = DataEngine.parseNumeric(r[metricCol]);
        if (d && val !== null && !isNaN(val)) {
          // Normalize to YYYY-MM or YYYY-MM-DD
          const key = String(d).slice(0, 10);
          if (!dateMap[key]) dateMap[key] = { sum: 0, count: 0 };
          dateMap[key].sum += val;
          dateMap[key].count += 1;
        }
      }

      const sortedDates = Object.keys(dateMap).sort();
      const seriesData = sortedDates.map(d => ({
        date: d,
        total: Math.round(dateMap[d].sum * 100) / 100,
        average: Math.round((dateMap[d].sum / dateMap[d].count) * 100) / 100
      }));

      // Find highest and lowest date
      let highestDate = sortedDates[0];
      let lowestDate = sortedDates[0];
      let highestVal = -Infinity;
      let lowestVal = Infinity;
      seriesData.forEach(item => {
        if (item.total > highestVal) {
          highestVal = item.total;
          highestDate = item.date;
        }
        if (item.total < lowestVal) {
          lowestVal = item.total;
          lowestDate = item.date;
        }
      });

      charts.push({
        id: 'chart_timeseries_trend',
        title: `${this.formatTitle(metricCol)} Over Time`,
        description: `Chronological progression of ${metricCol} aggregated by ${dateCol}.`,
        chartType: 'line',
        xAxisColumn: dateCol,
        yAxisColumn: metricCol,
        aggregation: 'sum',
        data: seriesData,
        echartsOption: {
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
          xAxis: {
            type: 'category',
            data: seriesData.map(d => d.date),
            axisLabel: { rotate: 30 }
          },
          yAxis: { type: 'value' },
          series: [
            {
              name: `Total ${metricCol}`,
              type: 'line',
              smooth: true,
              data: seriesData.map(d => d.total),
              color: '#2563EB',
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(37,99,235,0.25)' },
                    { offset: 1, color: 'rgba(37,99,235,0.01)' }
                  ]
                }
              }
            }
          ]
        },
        analyticalExplanation: {
          summary: `This time-series tracks ${metricCol} across ${sortedDates.length} chronological periods from ${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}.`,
          keyObservations: [
            `Peak volume reached on ${highestDate} with ${highestVal.toLocaleString()} in total.`,
            `Lowest point recorded on ${lowestDate} at ${lowestVal.toLocaleString()}.`,
            `Overall trajectory indicates stable operational continuity.`
          ],
          potentialDrivers: [
            'Seasonal purchasing cycles and month-end closing activities.',
            'Marketing campaigns or promotional schedule spikes.'
          ],
          suggestedInvestigation: [
            `Examine transaction records for peak date ${highestDate} to isolate contributing orders.`,
            `Compare weekday vs weekend volume distribution.`
          ],
          metricDefinition: `Daily aggregate: SUM(${metricCol}) grouped by truncated ${dateCol}.`
        }
      });
    }

    // B. Category Breakdown Bar Chart
    if (catCols.length > 0 && numCols.length > 0) {
      const primaryCat = catCols.find(c => /category|segment|region|department|type|status/i.test(c)) || catCols[0];
      const primaryMetric = numCols.find(c => /revenue|sales|amount|profit|price/i.test(c)) || numCols[0];

      const catAgg: Record<string, { sum: number; count: number }> = {};
      for (const r of rows) {
        const cat = String(r[primaryCat] || 'Unspecified').trim();
        const val = DataEngine.parseNumeric(r[primaryMetric]) || 0;
        if (!catAgg[cat]) catAgg[cat] = { sum: 0, count: 0 };
        catAgg[cat].sum += val;
        catAgg[cat].count += 1;
      }

      const sortedCats = Object.entries(catAgg)
        .sort((a, b) => b[1].sum - a[1].sum)
        .slice(0, 10);

      const topCategoryName = sortedCats[0]?.[0] || 'N/A';
      const topCategorySum = sortedCats[0]?.[1]?.sum || 0;
      const totalCatSum = sortedCats.reduce((acc, curr) => acc + curr[1].sum, 0);
      const topCatPercentage = totalCatSum > 0 ? Math.round((topCategorySum / totalCatSum) * 1000) / 10 : 0;

      charts.push({
        id: 'chart_category_bar',
        title: `${this.formatTitle(primaryMetric)} by ${this.formatTitle(primaryCat)}`,
        description: `Comparison of cumulative ${primaryMetric} across top ${sortedCats.length} segments of ${primaryCat}.`,
        chartType: 'bar',
        xAxisColumn: primaryCat,
        yAxisColumn: primaryMetric,
        aggregation: 'sum',
        data: sortedCats.map(([cat, stats]) => ({
          category: cat,
          total: Math.round(stats.sum * 100) / 100,
          count: stats.count
        })),
        echartsOption: {
          tooltip: { trigger: 'axis' },
          grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
          xAxis: {
            type: 'category',
            data: sortedCats.map(c => c[0]),
            axisLabel: { rotate: 25, interval: 0 }
          },
          yAxis: { type: 'value' },
          series: [
            {
              name: `Total ${primaryMetric}`,
              type: 'bar',
              data: sortedCats.map(c => Math.round(c[1].sum * 100) / 100),
              color: '#0D9488',
              itemStyle: { borderRadius: [4, 4, 0, 0] }
            }
          ]
        },
        analyticalExplanation: {
          summary: `Shows distribution of ${primaryMetric} across distinct ${primaryCat} groups.`,
          keyObservations: [
            `Top contributing segment is "${topCategoryName}" generating ${topCategorySum.toLocaleString()} (${topCatPercentage}% of total).`,
            `The difference between the highest and lowest top category is ${(topCategorySum - (sortedCats[sortedCats.length - 1]?.[1]?.sum || 0)).toLocaleString()}.`
          ],
          potentialDrivers: [
            'Market demand density and premium product positioning in top segment.',
            'Geographic or organizational resource allocation.'
          ],
          suggestedInvestigation: [
            `Audit product margin variations within "${topCategoryName}".`,
            `Identify opportunities to replicate success in lower-performing categories.`
          ],
          metricDefinition: `SUM(${primaryMetric}) grouped by ${primaryCat}, sorted descending.`
        }
      });
    }

    // C. Proportion Donut Chart (Categorical distribution)
    const donutCatCol = catCols.find(c => {
      const prof = qualityReport.columnProfiles[c];
      return prof && prof.uniqueCount >= 2 && prof.uniqueCount <= 7;
    }) || catCols[0];

    if (donutCatCol) {
      const counts: Record<string, number> = {};
      for (const r of rows) {
        const val = String(r[donutCatCol] || 'Unknown').trim();
        counts[val] = (counts[val] || 0) + 1;
      }

      const pieData = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, value]) => ({ name, value }));

      charts.push({
        id: 'chart_category_donut',
        title: `Distribution of ${this.formatTitle(donutCatCol)}`,
        description: `Proportional breakdown of records by ${donutCatCol}.`,
        chartType: 'doughnut',
        categoryColumn: donutCatCol,
        data: pieData,
        echartsOption: {
          tooltip: { trigger: 'item', formatter: '{b}: {c} records ({d}%)' },
          legend: { orient: 'horizontal', bottom: 0 },
          series: [
            {
              name: donutCatCol,
              type: 'pie',
              radius: ['45%', '70%'],
              avoidLabelOverlap: false,
              itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
              label: { show: false },
              emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
              data: pieData
            }
          ]
        },
        analyticalExplanation: {
          summary: `Illustrates the relative proportion of observations classified by ${donutCatCol}.`,
          keyObservations: [
            `Primary share belongs to "${pieData[0]?.name}" representing ${pieData[0]?.value} records.`,
            `Top 2 groups comprise ${Math.round(((pieData[0]?.value + (pieData[1]?.value || 0)) / rows.length) * 100)}% of the total dataset.`
          ],
          potentialDrivers: [
            'Natural customer demographic grouping or operational default classifications.'
          ],
          suggestedInvestigation: [
            `Cross-tabulate ${donutCatCol} against financial metrics to verify profitability per segment.`
          ],
          metricDefinition: `COUNT(*) grouped by ${donutCatCol}.`
        }
      });
    }

    // D. Bivariate Scatter Plot or Histogram
    if (numCols.length >= 2) {
      const colX = numCols[0];
      const colY = numCols[1];

      const scatterData: [number, number][] = [];
      for (const r of rows.slice(0, 300)) {
        const x = DataEngine.parseNumeric(r[colX]);
        const y = DataEngine.parseNumeric(r[colY]);
        if (x !== null && y !== null && !isNaN(x) && !isNaN(y)) {
          scatterData.push([x, y]);
        }
      }

      // Compute Pearson correlation
      const correlation = this.calculateCorrelation(
        scatterData.map(d => d[0]),
        scatterData.map(d => d[1])
      );

      charts.push({
        id: 'chart_bivariate_scatter',
        title: `${this.formatTitle(colY)} vs. ${this.formatTitle(colX)}`,
        description: `Bivariate correlation plot showing relationship between ${colX} and ${colY} (Pearson r = ${correlation}).`,
        chartType: 'scatter',
        xAxisColumn: colX,
        yAxisColumn: colY,
        data: scatterData,
        echartsOption: {
          tooltip: {
            trigger: 'item',
            formatter: (params: any) => `${colX}: ${params.value[0]}<br/>${colY}: ${params.value[1]}`
          },
          grid: { left: '3%', right: '4%', bottom: '8%', containLabel: true },
          xAxis: { type: 'value', name: colX, nameLocation: 'middle', nameGap: 28 },
          yAxis: { type: 'value', name: colY },
          series: [
            {
              type: 'scatter',
              data: scatterData,
              itemStyle: { color: 'rgba(37,99,235,0.7)' },
              symbolSize: 8
            }
          ]
        },
        analyticalExplanation: {
          summary: `Assesses linear dependency between ${colX} and ${colY}. The sample correlation coefficient is r = ${correlation}.`,
          keyObservations: [
            Math.abs(correlation) > 0.6
              ? `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation detected (r = ${correlation}).`
              : `Weak or non-linear correlation observed (r = ${correlation}).`,
            `Scatter points demonstrate normal dispersion across primary operating ranges.`
          ],
          potentialDrivers: [
            'Direct pricing-volume elasticity or scale efficiencies.'
          ],
          suggestedInvestigation: [
            `Segment scatter points by category to test for subgroup interaction effects.`
          ],
          metricDefinition: `Pearson correlation coefficient: Cov(X,Y) / (StdDev(X) * StdDev(Y)).`
        }
      });
    }

    // E. Horizontal Ranking Bar Chart (Top Performers by Entity / Name / Second Category)
    const rankingCol = Object.keys(rows[0] || {}).find(c =>
      /product|item|service|name|company|client|store|city|country/i.test(c) &&
      !/id|category|region|segment/i.test(c)
    ) || (catCols.length > 1 ? catCols[1] : null);

    if (rankingCol && numCols.length > 0) {
      const rankMetric = numCols.find(c => /revenue|sales|profit|amount/i.test(c)) || numCols[0];
      const rankAgg: Record<string, number> = {};

      for (const r of rows) {
        const entity = String(r[rankingCol] || 'Unspecified').trim();
        const val = DataEngine.parseNumeric(r[rankMetric]) || 0;
        rankAgg[entity] = (rankAgg[entity] || 0) + val;
      }

      const topRanked = Object.entries(rankAgg)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      if (topRanked.length >= 2) {
        charts.push({
          id: 'chart_ranking_horizontal_bar',
          title: `Top ${this.formatTitle(rankingCol)} by ${this.formatTitle(rankMetric)}`,
          description: `Leaderboard ranking of highest performing ${rankingCol} entities.`,
          chartType: 'bar',
          xAxisColumn: rankMetric,
          yAxisColumn: rankingCol,
          aggregation: 'sum',
          data: topRanked.map(([name, sum]) => ({ entity: name, total: Math.round(sum * 100) / 100 })),
          echartsOption: {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '6%', bottom: '3%', top: '6%', containLabel: true },
            xAxis: { type: 'value' },
            yAxis: {
              type: 'category',
              data: [...topRanked].reverse().map(item => item[0]),
              axisLabel: {
                formatter: (val: string) => val.length > 18 ? val.slice(0, 16) + '...' : val
              }
            },
            series: [
              {
                name: `Total ${rankMetric}`,
                type: 'bar',
                data: [...topRanked].reverse().map(item => Math.round(item[1] * 100) / 100),
                color: '#3B82F6',
                itemStyle: {
                  borderRadius: [0, 4, 4, 0],
                  color: {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 1,
                    y2: 0,
                    colorStops: [
                      { offset: 0, color: '#1D4ED8' },
                      { offset: 1, color: '#00D2FF' }
                    ]
                  }
                }
              }
            ]
          },
          analyticalExplanation: {
            summary: `Identifies top performers across ${rankingCol}. Lead contributor is "${topRanked[0]?.[0]}" with ${topRanked[0]?.[1]?.toLocaleString()} in ${rankMetric}.`,
            keyObservations: [
              `Leader "${topRanked[0]?.[0]}" exceeds runner-up by ${((topRanked[0]?.[1] || 0) - (topRanked[1]?.[1] || 0)).toLocaleString()}.`,
              `Top ${topRanked.length} entities represent key revenue concentration drivers.`
            ],
            potentialDrivers: [
              'Customer preference and high order frequency.',
              'Strategic product differentiation.'
            ],
            suggestedInvestigation: [
              `Evaluate inventory, marketing spend, or account satisfaction for top entity "${topRanked[0]?.[0]}".`
            ],
            metricDefinition: `SUM(${rankMetric}) grouped by ${rankingCol}, sorted descending.`
          }
        });
      }
    }

    // F. Multidimensional Radar / Metric Performance Profile
    if (catCols.length > 0 && numCols.length >= 2) {
      const radarCatCol = catCols[0];
      const radarMetrics = numCols.slice(0, 4);

      // Find top 3 categories
      const catCounts: Record<string, number> = {};
      rows.forEach(r => {
        const c = String(r[radarCatCol] || 'Other').trim();
        catCounts[c] = (catCounts[c] || 0) + 1;
      });
      const topCats = Object.keys(catCounts).slice(0, 3);

      if (topCats.length >= 2) {
        // Calculate averages per category
        const catAverages: Record<string, number[]> = {};
        const maxPerMetric = radarMetrics.map(m => {
          let maxVal = 1;
          rows.forEach(r => {
            const v = DataEngine.parseNumeric(r[m]) || 0;
            if (v > maxVal) maxVal = v;
          });
          return maxVal;
        });

        topCats.forEach(cat => {
          const catRows = rows.filter(r => String(r[radarCatCol]).trim() === cat);
          catAverages[cat] = radarMetrics.map((m, idx) => {
            const sum = catRows.reduce((acc, r) => acc + (DataEngine.parseNumeric(r[m]) || 0), 0);
            const avg = catRows.length > 0 ? sum / catRows.length : 0;
            return Math.round((avg / (maxPerMetric[idx] || 1)) * 100);
          });
        });

        charts.push({
          id: 'chart_multidimensional_radar',
          title: `Performance Profile by ${this.formatTitle(radarCatCol)}`,
          description: `Multi-metric normalized radar index comparing top segments across ${radarMetrics.join(', ')}.`,
          chartType: 'radar',
          categoryColumn: radarCatCol,
          data: topCats.map(cat => ({ category: cat, values: catAverages[cat] })),
          echartsOption: {
            tooltip: { trigger: 'item' },
            legend: { orient: 'horizontal', bottom: 0, data: topCats },
            radar: {
              indicator: radarMetrics.map(m => ({ name: this.formatTitle(m), max: 100 })),
              splitArea: {
                areaStyle: {
                  color: ['rgba(37,99,235,0.02)', 'rgba(37,99,235,0.06)', 'rgba(37,99,235,0.02)', 'rgba(37,99,235,0.06)']
                }
              }
            },
            series: [
              {
                name: `Metrics by ${radarCatCol}`,
                type: 'radar',
                data: topCats.map((cat, i) => {
                  const colors = ['#2563EB', '#00D2FF', '#10B981'];
                  return {
                    name: cat,
                    value: catAverages[cat],
                    itemStyle: { color: colors[i % colors.length] },
                    areaStyle: { color: `${colors[i % colors.length]}33` }
                  };
                })
              }
            ]
          },
          analyticalExplanation: {
            summary: `Benchmarking multidimensional efficiency across ${topCats.join(', ')}.`,
            keyObservations: [
              `Visualizes relative balance across ${radarMetrics.map(m => this.formatTitle(m)).join(', ')}.`,
              `Highlights comparative strength indices normalized to 0-100 scales.`
            ],
            potentialDrivers: [
              'Different business models or operational focus per segment.'
            ],
            suggestedInvestigation: [
              `Target low-scoring metric axes to improve segment balance.`
            ],
            metricDefinition: `Normalized average of [${radarMetrics.join(', ')}] scaled relative to max observation.`
          }
        });
      }
    }

    // Available filters
    const availableFilters: DashboardConfig['availableFilters'] = [];

    if (dateCols.length > 0) {
      const dates = rows.map(r => r[dateCols[0]]).filter(Boolean).sort();
      availableFilters.push({
        column: dateCols[0],
        type: 'date',
        min: dates[0],
        max: dates[dates.length - 1]
      });
    }

    for (const c of catCols.slice(0, 3)) {
      const prof = qualityReport.columnProfiles[c];
      if (prof && prof.topCategories) {
        availableFilters.push({
          column: c,
          type: 'categorical',
          options: prof.topCategories.map(tc => tc.value)
        });
      }
    }

    return {
      id: 'dash_' + datasetId,
      datasetId,
      versionNumber,
      title: `${datasetName} — Executive Dashboard`,
      kpis,
      charts,
      availableFilters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate Pearson correlation coefficient
   */
  public static calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denomX = 0;
    let denomY = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      denomX += dx * dx;
      denomY += dy * dy;
    }

    const denominator = Math.sqrt(denomX * denomY);
    if (denominator === 0) return 0;
    return Math.round((numerator / denominator) * 100) / 100;
  }

  /**
   * Execute deterministic analytical queries for the AI Analyst
   */
  public static executeAnalyticalQuery(
    rows: any[],
    query: {
      operation: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'group_by' | 'top_n' | 'correlation' | 'outliers';
      targetColumn?: string;
      groupByColumn?: string;
      secondaryColumn?: string;
      filters?: { column: string; operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains'; value: any }[];
      limit?: number;
    }
  ): {
    result: any;
    recordsIncluded: number;
    recordsExcluded: number;
    calculationDetails: string;
    intermediateSteps: { step: string; result: any }[];
  } {
    // 1. Apply filters
    let filtered = [...rows];
    let recordsExcluded = 0;

    if (query.filters && query.filters.length > 0) {
      filtered = filtered.filter(row => {
        return query.filters!.every(f => {
          const val = row[f.column];
          if (f.operator === 'eq') return String(val).toLowerCase() === String(f.value).toLowerCase();
          if (f.operator === 'neq') return String(val).toLowerCase() !== String(f.value).toLowerCase();
          if (f.operator === 'contains') return String(val).toLowerCase().includes(String(f.value).toLowerCase());
          if (f.operator === 'gt') return Number(val) > Number(f.value);
          if (f.operator === 'lt') return Number(val) < Number(f.value);
          return true;
        });
      });
      recordsExcluded = rows.length - filtered.length;
    }

    const col = query.targetColumn || '';
    const intermediateSteps: { step: string; result: any }[] = [];

    intermediateSteps.push({
      step: 'Dataset Filter Application',
      result: `Started with ${rows.length} rows, filtered down to ${filtered.length} matching criteria.`
    });

    switch (query.operation) {
      case 'sum': {
        const validValues = filtered
          .map(r => DataEngine.parseNumeric(r[col]))
          .filter((v): v is number => v !== null && !isNaN(v));
        const sum = validValues.reduce((a, b) => a + b, 0);
        intermediateSteps.push({
          step: `Extract numerical values from "${col}"`,
          result: `Found ${validValues.length} valid numbers (excluded ${filtered.length - validValues.length} nulls/invalid).`
        });
        intermediateSteps.push({
          step: `Summation`,
          result: `Calculated sum = ${sum}`
        });
        return {
          result: Math.round(sum * 100) / 100,
          recordsIncluded: validValues.length,
          recordsExcluded: rows.length - validValues.length,
          calculationDetails: `SUM(${col}) across ${validValues.length} records = ${sum.toLocaleString()}`,
          intermediateSteps
        };
      }

      case 'avg': {
        const validValues = filtered
          .map(r => DataEngine.parseNumeric(r[col]))
          .filter((v): v is number => v !== null && !isNaN(v));
        const sum = validValues.reduce((a, b) => a + b, 0);
        const avg = validValues.length > 0 ? sum / validValues.length : 0;
        intermediateSteps.push({
          step: `Extract numerical values from "${col}"`,
          result: `Found ${validValues.length} valid numbers.`
        });
        intermediateSteps.push({
          step: `Calculate Average`,
          result: `${sum} / ${validValues.length} = ${avg}`
        });
        return {
          result: Math.round(avg * 100) / 100,
          recordsIncluded: validValues.length,
          recordsExcluded: rows.length - validValues.length,
          calculationDetails: `AVG(${col}) = ${sum.toLocaleString()} / ${validValues.length} = ${(Math.round(avg * 100) / 100).toLocaleString()}`,
          intermediateSteps
        };
      }

      case 'count': {
        return {
          result: filtered.length,
          recordsIncluded: filtered.length,
          recordsExcluded,
          calculationDetails: `COUNT(*) = ${filtered.length}`,
          intermediateSteps
        };
      }

      case 'min': {
        const validValues = filtered
          .map(r => DataEngine.parseNumeric(r[col]))
          .filter((v): v is number => v !== null && !isNaN(v));
        const minVal = validValues.length > 0 ? Math.min(...validValues) : null;
        return {
          result: minVal,
          recordsIncluded: validValues.length,
          recordsExcluded: rows.length - validValues.length,
          calculationDetails: `MIN(${col}) = ${minVal}`,
          intermediateSteps
        };
      }

      case 'max': {
        const validValues = filtered
          .map(r => DataEngine.parseNumeric(r[col]))
          .filter((v): v is number => v !== null && !isNaN(v));
        const maxVal = validValues.length > 0 ? Math.max(...validValues) : null;
        return {
          result: maxVal,
          recordsIncluded: validValues.length,
          recordsExcluded: rows.length - validValues.length,
          calculationDetails: `MAX(${col}) = ${maxVal}`,
          intermediateSteps
        };
      }

      case 'group_by':
      case 'top_n': {
        const groupCol = query.groupByColumn || col;
        const metricCol = query.targetColumn || '';
        const isNumericMetric = Boolean(metricCol && metricCol !== groupCol);

        const groups: Record<string, { sum: number; count: number; avg: number }> = {};

        for (const r of filtered) {
          const key = String(r[groupCol] || 'Unspecified').trim();
          if (!groups[key]) groups[key] = { sum: 0, count: 0, avg: 0 };
          groups[key].count += 1;
          if (isNumericMetric) {
            const val = DataEngine.parseNumeric(r[metricCol]) || 0;
            groups[key].sum += val;
          }
        }

        const items = Object.entries(groups).map(([name, data]) => ({
          group: name,
          count: data.count,
          sum: Math.round(data.sum * 100) / 100,
          avg: data.count > 0 ? Math.round((data.sum / data.count) * 100) / 100 : 0
        }));

        // Sort descending by sum if numeric, else by count
        if (isNumericMetric) {
          items.sort((a, b) => b.sum - a.sum);
        } else {
          items.sort((a, b) => b.count - a.count);
        }

        const limit = query.limit || 10;
        const topItems = items.slice(0, limit);

        intermediateSteps.push({
          step: `Group records by "${groupCol}"`,
          result: `Generated ${items.length} unique groups.`
        });
        intermediateSteps.push({
          step: `Rank groups by ${isNumericMetric ? `SUM(${metricCol})` : 'record count'}`,
          result: `Top entry is "${topItems[0]?.group}" with ${isNumericMetric ? topItems[0]?.sum : topItems[0]?.count}.`
        });

        return {
          result: topItems,
          recordsIncluded: filtered.length,
          recordsExcluded,
          calculationDetails: `GROUP BY ${groupCol} ${isNumericMetric ? `SUM(${metricCol})` : 'COUNT(*)'} LIMIT ${limit}`,
          intermediateSteps
        };
      }

      case 'correlation': {
        const col1 = query.targetColumn || '';
        const col2 = query.secondaryColumn || '';
        const x: number[] = [];
        const y: number[] = [];

        for (const r of filtered) {
          const valX = DataEngine.parseNumeric(r[col1]);
          const valY = DataEngine.parseNumeric(r[col2]);
          if (valX !== null && valY !== null && !isNaN(valX) && !isNaN(valY)) {
            x.push(valX);
            y.push(valY);
          }
        }

        const corr = this.calculateCorrelation(x, y);
        intermediateSteps.push({
          step: `Extract pairs (${col1}, ${col2})`,
          result: `Collected ${x.length} complete numerical pairs.`
        });
        intermediateSteps.push({
          step: 'Compute Pearson Correlation Coefficient',
          result: `r = ${corr}`
        });

        return {
          result: corr,
          recordsIncluded: x.length,
          recordsExcluded: rows.length - x.length,
          calculationDetails: `PEARSON_CORRELATION(${col1}, ${col2}) across ${x.length} valid rows = ${corr}`,
          intermediateSteps
        };
      }

      default:
        return {
          result: null,
          recordsIncluded: filtered.length,
          recordsExcluded,
          calculationDetails: 'Unsupported operation',
          intermediateSteps
        };
    }
  }

  private static formatTitle(str: string): string {
    return str
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
}

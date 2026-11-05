import React, { useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Download, Maximize2, Sparkles, Filter, CheckCircle2 } from 'lucide-react';
import { ChartDef } from '../../types';
import { useApp } from '../../context/AppContext';

export interface ChartClickEvent {
  chartId: string;
  dimensionColumn?: string;
  value: string;
  seriesName?: string;
}

export interface ChartHoverEvent {
  chartId: string;
  dimensionColumn?: string;
  value: string;
  seriesName?: string;
  rawData?: any;
}

interface AutoChartProps {
  chart: ChartDef;
  onExplain?: (chart: ChartDef) => void;
  onExpand?: (chart: ChartDef) => void;
  onPointClick?: (event: ChartClickEvent) => void;
  onPointHover?: (event: ChartHoverEvent) => void;
  activeCrossFilter?: { column?: string; value: string } | null;
  isSingleFrame?: boolean;
}

export const AutoChart: React.FC<AutoChartProps> = ({
  chart,
  onExplain,
  onExpand,
  onPointClick,
  onPointHover,
  activeCrossFilter,
  isSingleFrame = false
}) => {
  const { theme } = useApp();
  const echartsRef = useRef<any>(null);

  const isCrossFilteredOnThis = Boolean(
    activeCrossFilter &&
    (activeCrossFilter.column === chart.xAxisColumn ||
     activeCrossFilter.column === chart.categoryColumn)
  );

  const handleDownloadPNG = () => {
    if (echartsRef.current) {
      const instance = echartsRef.current.getEchartsInstance();
      const base64 = instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
      });
      const a = document.createElement('a');
      a.href = base64;
      a.download = `${chart.title.toLowerCase().replace(/\s+/g, '_')}.png`;
      a.click();
    }
  };

  // Tableau / PowerBI Cross-Filtering option styling
  const styledOption = useMemo(() => {
    const opt = JSON.parse(JSON.stringify(chart.echartsOption || {}));
    const isDark = theme === 'dark';

    opt.backgroundColor = 'transparent';
    opt.textStyle = {
      color: isDark ? '#cbd5e1' : '#475569',
      fontFamily: 'Plus Jakarta Sans, sans-serif'
    };

    // Tooltip formatting in PowerBI / Tableau style
    const existingFormatter = opt.tooltip?.formatter;
    opt.tooltip = {
      ...opt.tooltip,
      trigger: opt.tooltip?.trigger || 'axis',
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#cbd5e1',
      borderWidth: 1,
      padding: [8, 12],
      textStyle: {
        color: isDark ? '#f8fafc' : '#0f172a',
        fontSize: 12
      },
      extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.15); border-radius: 8px;',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#94a3b8'
        }
      }
    };

    // Add click hint to tooltip if not custom
    if (!existingFormatter) {
      const originalFormatter = opt.tooltip.formatter;
      opt.tooltip.formatter = function(params: any) {
        let content = '';
        if (Array.isArray(params)) {
          const item = params[0];
          content = `<div class="font-bold mb-1">${item.name}</div>`;
          params.forEach((p: any) => {
            const val = typeof p.value === 'number' ? p.value.toLocaleString() : p.value;
            content += `<div class="flex items-center justify-between gap-4">
              <span style="color:${p.color}">● ${p.seriesName || ''}</span>
              <span class="font-bold">${val}</span>
            </div>`;
          });
        } else {
          const val = typeof params.value === 'number' ? params.value.toLocaleString() : params.value;
          content = `<div class="font-bold mb-1">${params.name || params.seriesName}</div>
          <div class="flex items-center justify-between gap-4">
            <span>Value</span>
            <span class="font-bold">${val}</span>
          </div>`;
          if (params.percent !== undefined) {
            content += `<div class="text-xs text-slate-400 mt-0.5">Share: ${params.percent}%</div>`;
          }
        }
        content += `<div class="mt-2 pt-1 border-t border-slate-200 dark:border-slate-700 text-[10px] text-blue-500 font-semibold flex items-center gap-1">
          <span>👆 Click to cross-filter dashboard</span>
        </div>`;
        return content;
      };
    }

    // PowerBI/Tableau interactive dimming for bar and pie charts when cross-filter active
    if (activeCrossFilter && opt.series && opt.series.length > 0) {
      opt.series.forEach((s: any) => {
        if (s.type === 'bar' && Array.isArray(opt.xAxis?.data)) {
          s.data = opt.xAxis.data.map((catName: string, idx: number) => {
            const rawVal = s.data[idx];
            const isMatch = String(catName).toLowerCase() === activeCrossFilter.value.toLowerCase();
            return {
              value: typeof rawVal === 'object' ? rawVal.value : rawVal,
              itemStyle: {
                color: isMatch
                  ? (s.color || '#2563EB')
                  : (isDark ? 'rgba(51, 65, 85, 0.45)' : 'rgba(203, 213, 225, 0.55)'),
                borderRadius: [4, 4, 0, 0],
                shadowBlur: isMatch ? 8 : 0,
                shadowColor: isMatch ? 'rgba(37, 99, 235, 0.4)' : 'transparent'
              }
            };
          });
        } else if (s.type === 'pie' && Array.isArray(s.data)) {
          s.data = s.data.map((item: any) => {
            const isMatch = String(item.name).toLowerCase() === activeCrossFilter.value.toLowerCase();
            return {
              ...item,
              itemStyle: {
                ...item.itemStyle,
                opacity: isMatch ? 1 : 0.35,
                borderWidth: isMatch ? 3 : 1,
                borderColor: isMatch ? '#ffffff' : 'transparent'
              }
            };
          });
        }
      });
    }

    // Cursor pointer on all charts
    if (opt.series) {
      opt.series.forEach((s: any) => {
        s.cursor = 'pointer';
        s.emphasis = {
          ...s.emphasis,
          focus: 'self',
          scale: true,
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(37, 99, 235, 0.5)'
          }
        };
      });
    }

    return opt;
  }, [chart, theme, activeCrossFilter]);

  const onEvents = useMemo(() => {
    return {
      click: (params: any) => {
        if (onPointClick) {
          const clickedValue = params.name || (Array.isArray(params.value) ? params.value[0] : String(params.value));
          const dimCol = chart.xAxisColumn || chart.categoryColumn || 'dimension';
          onPointClick({
            chartId: chart.id,
            dimensionColumn: dimCol,
            value: String(clickedValue),
            seriesName: params.seriesName
          });
        }
      },
      mousemove: (params: any) => {
        if (onPointHover) {
          const hoveredValue = params.name || (Array.isArray(params.value) ? params.value.join(', ') : String(params.value));
          onPointHover({
            chartId: chart.id,
            dimensionColumn: chart.xAxisColumn || chart.categoryColumn,
            value: String(hoveredValue),
            seriesName: params.seriesName,
            rawData: params.data
          });
        }
      }
    };
  }, [chart, onPointClick, onPointHover]);

  return (
    <div
      className={`flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border transition-all ${
        isCrossFilteredOnThis
          ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-md'
          : 'border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {/* Chart Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0" />
          <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
            {chart.title}
          </h3>
          {isCrossFilteredOnThis && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full shrink-0">
              <Filter className="w-2.5 h-2.5" />
              <span>Active Slicer</span>
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {onExplain && (
            <button
              onClick={() => onExplain(chart)}
              title="Explain this Chart"
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Explain</span>
            </button>
          )}

          <button
            onClick={handleDownloadPNG}
            title="Export PNG"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onExpand && (
            <button
              onClick={() => onExpand(chart)}
              title="Focus View"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className={`flex-1 p-2 w-full ${isSingleFrame ? 'min-h-[190px]' : 'min-h-[250px]'}`}>
        <ReactECharts
          ref={echartsRef}
          option={styledOption}
          onEvents={onEvents}
          theme={theme === 'dark' ? 'dark' : undefined}
          style={{ height: '100%', width: '100%', minHeight: isSingleFrame ? '190px' : '240px' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* Tableau / PowerBI Footer Hint & Formula */}
      <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
        <span className="truncate">
          {chart.analyticalExplanation?.metricDefinition || `Interactive chart · Click any element to cross-filter`}
        </span>
        <span className="text-[10px] font-medium text-blue-500/80 dark:text-blue-400/80 hidden sm:inline shrink-0 ml-2">
          Real-time Linked
        </span>
      </div>
    </div>
  );
};

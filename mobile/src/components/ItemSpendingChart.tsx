import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, {
  Line,
  Rect,
  Circle,
  Path,
  Text as SvgText,
  G,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { toAmount, formatMoney } from '../utils/money';
import { convertCurrencyLocally } from '../services/currencyService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Vibrant, curated series colors matching the reference image aesthetic
const SERIES_COLORS = [
  '#f97316', // Vibrant Orange (like City 1 in reference)
  '#db2777', // Vibrant Magenta / Rose (like City 2 in reference)
  '#8b5cf6', // Electric Purple
  '#06b6d4', // Cyan
  '#10b981', // Emerald Green
  '#f59e0b', // Amber
];

export interface ItemSpendingChartProps {
  expenses: any[];
  currencySymbol: string;
  selectedCurrency: string;
  isDark: boolean;
  theme: any;
  defaultMode?: 'monthly' | 'daily';
}

interface ItemSeries {
  id: string;
  name: string;
  color: string;
  total: number;
  data: number[]; // amount at each X point
}

interface ActiveTooltip {
  x: number;
  y: number;
  itemName: string;
  color: string;
  periodLabel: string;
  amount: number;
}

// Generate smooth cubic bezier SVG path from points
function createSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const tension = 0.25;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export default function ItemSpendingChart({
  expenses,
  currencySymbol,
  selectedCurrency,
  isDark,
  theme,
  defaultMode = 'monthly',
}: ItemSpendingChartProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>(defaultMode);
  const [selectedItemFilter, setSelectedItemFilter] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip | null>(null);

  // Detect available years from expenses
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach(e => {
      if (e.date) {
        const y = e.date.split('-')[0];
        if (y && y.length === 4) years.add(y);
      }
    });
    return Array.from(years).sort().reverse();
  }, [expenses]);

  const [activeYear, setActiveYear] = useState<string>(
    availableYears[0] || String(new Date().getFullYear())
  );

  // Detect months that contain data in the active year
  const activeYearMonths = useMemo(() => {
    const months = new Set<number>();
    expenses.forEach(e => {
      if (e.date) {
        const [y, m] = e.date.split('-');
        if (y === activeYear && m) {
          months.add(parseInt(m, 10));
        }
      }
    });
    return Array.from(months).sort((a, b) => a - b);
  }, [expenses, activeYear]);

  const [activeDailyMonth, setActiveDailyMonth] = useState<number>(
    activeYearMonths[0] || (new Date().getMonth() + 1)
  );

  // Extract all item transactions across expenses with currency conversion
  const itemTransactions = useMemo(() => {
    const list: {
      itemName: string;
      amount: number;
      date: string;
      year: string;
      month: number;
      day: number;
    }[] = [];

    expenses.forEach(exp => {
      if (!exp.date) return;
      const dateParts = exp.date.split('-');
      if (dateParts.length < 3) return;
      const year = dateParts[0];
      const month = parseInt(dateParts[1], 10);
      const day = parseInt(dateParts[2], 10);
      const originalCur = exp.currency || 'USD';

      if (exp.expense_items && exp.expense_items.length > 0) {
        exp.expense_items.forEach((item: any) => {
          const rawPrice = toAmount(item.price);
          const qty = toAmount(item.quantity, 1);
          const rawTotal = rawPrice * qty;
          const converted = convertCurrencyLocally(rawTotal, originalCur, selectedCurrency);
          list.push({
            itemName: (item.name || 'Item').trim(),
            amount: converted,
            date: exp.date,
            year,
            month,
            day,
          });
        });
      } else {
        // Fallback for expense without sub-items
        const rawTotal = toAmount(exp.amount);
        const converted = convertCurrencyLocally(rawTotal, originalCur, selectedCurrency);
        const name = (exp.store_name || exp.categories?.name || 'General Expense').trim();
        list.push({
          itemName: name,
          amount: converted,
          date: exp.date,
          year,
          month,
          day,
        });
      }
    });

    return list;
  }, [expenses, selectedCurrency]);

  // Aggregate items and find top 5 by spend
  const topItems = useMemo(() => {
    const totals: { [name: string]: number } = {};
    itemTransactions.forEach(t => {
      totals[t.itemName] = (totals[t.itemName] || 0) + t.amount;
    });

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, total], idx) => ({
        id: `item-${idx}`,
        name,
        total,
        color: SERIES_COLORS[idx % SERIES_COLORS.length],
      }));
  }, [itemTransactions]);

  // Determine X-axis labels and points based on viewMode
  const { xLabels, numPoints } = useMemo(() => {
    if (viewMode === 'monthly') {
      return {
        xLabels: MONTH_LABELS,
        numPoints: 12,
      };
    } else {
      // Daily mode: days 1 to 31 for the active daily month
      // Days in activeDailyMonth
      const yearInt = parseInt(activeYear, 10) || new Date().getFullYear();
      const daysInMonth = new Date(yearInt, activeDailyMonth, 0).getDate();
      const labels: string[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        labels.push(String(d));
      }
      return {
        xLabels: labels,
        numPoints: daysInMonth,
      };
    }
  }, [viewMode, activeYear, activeDailyMonth]);

  // Build series data points for top items
  const seriesList = useMemo<ItemSeries[]>(() => {
    return topItems.map(item => {
      const data = new Array(numPoints).fill(0);

      itemTransactions.forEach(t => {
        if (t.itemName !== item.name) return;

        if (viewMode === 'monthly') {
          // If activeYear matches, put into corresponding month index (0 to 11)
          if (t.year === activeYear) {
            const mIdx = t.month - 1;
            if (mIdx >= 0 && mIdx < 12) {
              data[mIdx] += t.amount;
            }
          }
        } else {
          // Daily view: filter by activeYear and activeDailyMonth
          if (t.year === activeYear && t.month === activeDailyMonth) {
            const dIdx = t.day - 1;
            if (dIdx >= 0 && dIdx < numPoints) {
              data[dIdx] += t.amount;
            }
          }
        }
      });

      return {
        id: item.id,
        name: item.name,
        color: item.color,
        total: item.total,
        data,
      };
    });
  }, [topItems, itemTransactions, viewMode, activeYear, activeDailyMonth, numPoints]);

  // Compute maximum Y value across visible series
  const maxY = useMemo(() => {
    let max = 0;
    seriesList.forEach(s => {
      s.data.forEach(v => {
        if (v > max) max = v;
      });
    });

    if (max <= 0) return 25; // default scale
    // Round up nicely to 5 or 10
    const step = max > 100 ? 50 : max > 40 ? 10 : max > 15 ? 5 : 2;
    return Math.ceil(max / step) * step;
  }, [seriesList]);

  // Chart Geometry
  const chartWidth = Math.max(300, SCREEN_WIDTH - 48);
  const chartHeight = 220;
  const paddingLeft = 38;
  const paddingRight = 18;
  const paddingTop = 28;
  const paddingBottom = 30;

  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  // Coordinate mappers
  const getX = (idx: number) => {
    if (numPoints <= 1) return paddingLeft + plotWidth / 2;
    return paddingLeft + (idx / (numPoints - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const ratio = Math.min(1, Math.max(0, val / maxY));
    return paddingTop + plotHeight - ratio * plotHeight;
  };

  // 4 Y-ticks
  const yTicks = [0, maxY * 0.25, maxY * 0.5, maxY * 0.75, maxY];

  const handlePointPress = (
    series: ItemSeries,
    idx: number,
    cx: number,
    cy: number
  ) => {
    const amount = series.data[idx];
    const periodLabel =
      viewMode === 'monthly'
        ? `${MONTH_LABELS[idx]} ${activeYear}`
        : `${MONTH_LABELS[activeDailyMonth - 1]} ${idx + 1}, ${activeYear}`;

    setActiveTooltip({
      x: cx,
      y: cy,
      itemName: series.name,
      color: series.color,
      periodLabel,
      amount,
    });
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* Header with Title and Mode Switcher */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Item Spending Trends</Text>
          <Text style={[styles.subtitle, { color: theme.textDim }]}>
            {viewMode === 'monthly' ? `Monthly breakdown • ${activeYear}` : `Daily breakdown • ${MONTH_LABELS[activeDailyMonth - 1]} ${activeYear}`}
          </Text>
        </View>

        {/* View Mode Toggle Pill */}
        <View style={[styles.toggleContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'monthly' && [styles.toggleBtnActive, { backgroundColor: isDark ? '#ffffff' : '#0f172a' }]]}
            onPress={() => {
              setViewMode('monthly');
              setActiveTooltip(null);
            }}
          >
            <Text style={[styles.toggleBtnText, { color: isDark ? '#a1a1aa' : '#64748b' }, viewMode === 'monthly' && { color: isDark ? '#09090b' : '#ffffff', fontWeight: '700' }]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'daily' && [styles.toggleBtnActive, { backgroundColor: isDark ? '#ffffff' : '#0f172a' }]]}
            onPress={() => {
              setViewMode('daily');
              setActiveTooltip(null);
            }}
          >
            <Text style={[styles.toggleBtnText, { color: isDark ? '#a1a1aa' : '#64748b' }, viewMode === 'daily' && { color: isDark ? '#09090b' : '#ffffff', fontWeight: '700' }]}>
              Daily
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sub-Filters: Year & Month (if Daily) */}
      <View style={styles.subFilterRow}>
        {availableYears.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginRight: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {availableYears.map(yr => (
                <TouchableOpacity
                  key={yr}
                  onPress={() => {
                    setActiveYear(yr);
                    setActiveTooltip(null);
                  }}
                  style={[
                    styles.filterChip,
                    { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                    activeYear === yr && { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: activeYear === yr ? '#fff' : theme.textDim }]}>
                    {yr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}

        {viewMode === 'daily' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {MONTH_LABELS.map((mName, mIdx) => {
                const mNum = mIdx + 1;
                const isSelected = activeDailyMonth === mNum;
                const hasData = activeYearMonths.includes(mNum);
                return (
                  <TouchableOpacity
                    key={mName}
                    onPress={() => {
                      setActiveDailyMonth(mNum);
                      setActiveTooltip(null);
                    }}
                    style={[
                      styles.filterChip,
                      { borderColor: theme.border, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' },
                      isSelected && { backgroundColor: '#f97316', borderColor: '#f97316' },
                    ]}
                  >
                    <Text style={[styles.filterChipText, { color: isSelected ? '#fff' : hasData ? theme.text : theme.textDim, fontWeight: hasData ? '700' : '400' }]}>
                      {mName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>

      {/* Reference-Style Legend Box on Top */}
      {seriesList.length > 0 && (
        <View
          style={[
            styles.legendBox,
            {
              backgroundColor: isDark ? 'rgba(24, 24, 27, 0.85)' : '#ffffff',
              borderColor: theme.border,
            }
          ]}
        >
          {seriesList.map(series => {
            const isDimmed = selectedItemFilter !== null && selectedItemFilter !== series.id;
            return (
              <TouchableOpacity
                key={series.id}
                onPress={() =>
                  setSelectedItemFilter(prev => (prev === series.id ? null : series.id))
                }
                style={[styles.legendItem, isDimmed && { opacity: 0.35 }]}
              >
                <View style={styles.legendSymbol}>
                  <View style={[styles.legendLine, { backgroundColor: series.color }]} />
                  <View style={[styles.legendDot, { borderColor: series.color, backgroundColor: '#fbbf24' }]} />
                </View>
                <Text style={[styles.legendLabel, { color: theme.text }]} numberOfLines={1}>
                  {series.name}
                </Text>
                <Text style={[styles.legendAmount, { color: series.color }]}>
                  {currencySymbol}{formatMoney(series.total, 0)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* SVG Chart Surface with Fine Grid & Connected Lines */}
      {seriesList.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="bar-chart-outline" size={32} color={theme.textDim} />
          <Text style={[styles.emptyText, { color: theme.textDim }]}>
            Scan receipts to see item trends
          </Text>
        </View>
      ) : (
        <View style={styles.svgWrapper}>
          <Svg width={chartWidth} height={chartHeight}>
            {/* Background Chart Grid */}
            <G>
              {/* Horizontal Grid Lines & Y-Labels */}
              {yTicks.map((val, i) => {
                const y = getY(val);
                return (
                  <G key={`y-grid-${i}`}>
                    <Line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + plotWidth}
                      y2={y}
                      stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={paddingLeft - 6}
                      y={y + 3.5}
                      fill={theme.textDim}
                      fontSize={9}
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {Math.round(val)}
                    </SvgText>
                  </G>
                );
              })}

              {/* Vertical Grid Lines & X-Labels */}
              {xLabels.map((label, idx) => {
                const x = getX(idx);
                // In daily mode, skip some labels to avoid clutter
                const shouldShowLabel =
                  viewMode === 'monthly' ||
                  idx === 0 ||
                  idx === 4 ||
                  idx === 9 ||
                  idx === 14 ||
                  idx === 19 ||
                  idx === 24 ||
                  idx === numPoints - 1;

                return (
                  <G key={`x-grid-${idx}`}>
                    <Line
                      x1={x}
                      y1={paddingTop}
                      x2={x}
                      y2={paddingTop + plotHeight}
                      stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                      strokeWidth={1}
                    />
                    {shouldShowLabel && (
                      <SvgText
                        x={x}
                        y={paddingTop + plotHeight + 16}
                        fill={theme.textDim}
                        fontSize={viewMode === 'monthly' ? 9 : 8}
                        textAnchor="middle"
                        fontWeight="600"
                      >
                        {label}
                      </SvgText>
                    )}
                  </G>
                );
              })}

              {/* Left Y Axis & Bottom X Axis Borders */}
              <Line
                x1={paddingLeft}
                y1={paddingTop}
                x2={paddingLeft}
                y2={paddingTop + plotHeight}
                stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                strokeWidth={1.5}
              />
              <Line
                x1={paddingLeft}
                y1={paddingTop + plotHeight}
                x2={paddingLeft + plotWidth}
                y2={paddingTop + plotHeight}
                stroke={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                strokeWidth={1.5}
              />
            </G>

            {/* Line Series & Reference Point Dots */}
            {seriesList.map(series => {
              const isFiltered =
                selectedItemFilter !== null && selectedItemFilter !== series.id;
              if (isFiltered) return null;

              const points = series.data.map((val, idx) => ({
                x: getX(idx),
                y: getY(val),
                val,
              }));

              const pathString = createSmoothPath(points);

              return (
                <G key={`series-${series.id}`}>
                  {/* Thick Curved Line */}
                  <Path
                    d={pathString}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Golden Circles with Colored Border on Points */}
                  {points.map((pt, idx) => {
                    // Only render dots on points with spending in daily view, or all in monthly view
                    const showDot = viewMode === 'monthly' || pt.val > 0;
                    if (!showDot) return null;

                    return (
                      <G key={`dot-${series.id}-${idx}`}>
                        {/* Interactive Invisible Touch Circle */}
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r={14}
                          fill="transparent"
                          onPress={() => handlePointPress(series, idx, pt.x, pt.y)}
                        />
                        {/* Prominent Outer Ring and Yellow Core (Exact Reference Match) */}
                        <Circle
                          cx={pt.x}
                          cy={pt.y}
                          r={5.5}
                          stroke={series.color}
                          strokeWidth={2}
                          fill="#fbbf24"
                        />
                      </G>
                    );
                  })}
                </G>
              );
            })}
          </Svg>

          {/* Interactive Tooltip Overlay */}
          {activeTooltip && (
            <View
              style={[
                styles.tooltip,
                {
                  left: Math.max(10, Math.min(chartWidth - 140, activeTooltip.x - 70)),
                  top: Math.max(0, activeTooltip.y - 50),
                  backgroundColor: isDark ? '#18181b' : '#ffffff',
                  borderColor: activeTooltip.color,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={[styles.tooltipDot, { backgroundColor: activeTooltip.color }]} />
                <Text style={[styles.tooltipTitle, { color: theme.text }]} numberOfLines={1}>
                  {activeTooltip.itemName}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                <Text style={[styles.tooltipPeriod, { color: theme.textDim }]}>{activeTooltip.periodLabel}</Text>
                <Text style={[styles.tooltipValue, { color: activeTooltip.color }]}>
                  {currencySymbol} {formatMoney(activeTooltip.amount)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 7,
  },
  toggleBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subFilterRow: {
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  legendBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  legendSymbol: {
    width: 22,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 95,
  },
  legendAmount: {
    fontSize: 11,
    fontWeight: '700',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyBox: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
  },
  tooltip: {
    position: 'absolute',
    width: 140,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
    zIndex: 100,
  },
  tooltipDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tooltipTitle: {
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  tooltipPeriod: {
    fontSize: 10,
  },
  tooltipValue: {
    fontSize: 11,
    fontWeight: '700',
  },
});

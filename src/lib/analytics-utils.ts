// Utility functions for analytics aggregation, ranking, filtering, and trend calculation

import type {
  TrendDelta,
  TrendDirection,
  RankedRow,
  SortOrder,
  ClientFilterParams,
  TimePeriod,
  DateRangePreset,
} from './analytics-table-types';

// ==============================================================================
// TREND CALCULATION
// ==============================================================================

const STABLE_THRESHOLD = 0.5; // Consider change < 0.5% as stable

export function calculateTrend(current: number, previous: number): TrendDelta {
  const delta = current - previous;
  const deltaPercent = previous === 0 ? (current > 0 ? 100 : 0) : (delta / previous) * 100;

  let direction: TrendDirection = 'stable';
  if (Math.abs(deltaPercent) > STABLE_THRESHOLD) {
    direction = delta > 0 ? 'up' : 'down';
  }

  return {
    current,
    previous,
    delta,
    deltaPercent,
    direction,
  };
}

// ==============================================================================
// RANKING
// ==============================================================================

export function rankRows<T>(
  rows: T[],
  getValue: (row: T) => number,
  order: SortOrder = 'desc'
): { rank: number; data: T }[] {
  // Sort rows by value
  const sorted = [...rows].sort((a, b) => {
    const valA = getValue(a);
    const valB = getValue(b);
    return order === 'desc' ? valB - valA : valA - valB;
  });

  // Assign ranks (handle ties by giving same rank)
  const ranked: { rank: number; data: T }[] = [];
  let currentRank = 1;
  let prevValue: number | null = null;

  sorted.forEach((row, index) => {
    const currentValue = getValue(row);

    if (prevValue !== null && currentValue !== prevValue) {
      currentRank = index + 1;
    }

    ranked.push({
      rank: currentRank,
      data: row,
    });

    prevValue = currentValue;
  });

  return ranked;
}

export function rankRowsWithTrend<T>(
  currentRows: T[],
  previousRows: T[],
  getKey: (row: T) => string,
  getValue: (row: T) => number,
  order: SortOrder = 'desc'
): RankedRow<T>[] {
  // Create a map of previous values for trend calculation
  const previousMap = new Map<string, number>();
  previousRows.forEach((row) => {
    previousMap.set(getKey(row), getValue(row));
  });

  // Calculate trends
  const rowsWithTrends = currentRows.map((row) => {
    const key = getKey(row);
    const currentValue = getValue(row);
    const previousValue = previousMap.get(key) ?? currentValue;
    const trend = calculateTrend(currentValue, previousValue);

    return { data: row, trend };
  });

  // Rank by current value
  const sorted = rowsWithTrends.sort((a, b) => {
    const valA = getValue(a.data);
    const valB = getValue(b.data);
    return order === 'desc' ? valB - valA : valA - valB;
  });

  // Assign ranks
  const ranked: RankedRow<T>[] = [];
  let currentRank = 1;
  let prevValue: number | null = null;

  sorted.forEach((item, index) => {
    const currentValue = getValue(item.data);

    if (prevValue !== null && currentValue !== prevValue) {
      currentRank = index + 1;
    }

    ranked.push({
      rank: currentRank,
      data: item.data,
      trend: item.trend,
    });

    prevValue = currentValue;
  });

  return ranked;
}

// ==============================================================================
// FILTERING
// ==============================================================================

export function filterRows<T>(
  rows: T[],
  searchQuery: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchQuery.trim()) return rows;

  const query = searchQuery.toLowerCase();

  return rows.filter((row) => {
    return searchFields.some((field) => {
      const value = row[field];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(query);
    });
  });
}

export function filterByStatus<T>(
  rows: T[],
  statusField: keyof T,
  allowedStatuses: string[]
): T[] {
  if (allowedStatuses.length === 0) return rows;

  return rows.filter((row) => {
    const status = row[statusField];
    return allowedStatuses.includes(String(status));
  });
}

export function applyClientFilters<T>(rows: T[], filters: ClientFilterParams): T[] {
  let filtered = [...rows];

  // Apply search query
  if (filters.searchQuery && filters.searchQuery.trim()) {
    // Note: This requires searchFields to be passed separately
    // In practice, each hook will implement custom search logic
    filtered = filtered.filter((row) => {
      const query = filters.searchQuery!.toLowerCase();
      return Object.values(row as any).some((val) =>
        String(val).toLowerCase().includes(query)
      );
    });
  }

  // Apply status filter
  if (filters.statusFilter && filters.statusFilter.length > 0) {
    filtered = filtered.filter((row: any) => {
      return filters.statusFilter!.includes(row.status);
    });
  }

  // Apply custom filters
  if (filters.customFilters) {
    Object.entries(filters.customFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        filtered = filtered.filter((row: any) => row[key] === value);
      }
    });
  }

  // Apply sorting
  if (filters.sortField) {
    filtered.sort((a: any, b: any) => {
      const valA = a[filters.sortField!];
      const valB = b[filters.sortField!];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      const comparison = valA < valB ? -1 : 1;
      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  return filtered;
}

// ==============================================================================
// PERCENTAGE CALCULATION
// ==============================================================================

export function calculatePercentage(
  numerator: number,
  denominator: number,
  decimals: number = 2
): number {
  if (denominator === 0) return 0;
  const percentage = (numerator / denominator) * 100;
  return Number(percentage.toFixed(decimals));
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ==============================================================================
// CURRENCY FORMATTING
// ==============================================================================

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ==============================================================================
// DATE UTILITIES
// ==============================================================================

export function calculateDateRange(period: TimePeriod, referenceDate: Date = new Date()): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date(referenceDate);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(referenceDate);
  startDate.setHours(0, 0, 0, 0);

  switch (period) {
    case 'day':
      // Same day
      break;

    case 'week':
      // Last 7 days
      startDate.setDate(startDate.getDate() - 6);
      break;

    case 'month':
      // Last 30 days (default as specified in requirements)
      startDate.setDate(startDate.getDate() - 29);
      break;

    case 'quarter':
      // Last 90 days
      startDate.setDate(startDate.getDate() - 89);
      break;

    case 'year':
      // Last 365 days
      startDate.setDate(startDate.getDate() - 364);
      break;

    case 'custom':
      // Return current date (caller should override)
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

export function calculatePreviousPeriod(startDate: string, endDate: string): {
  startDate: string;
  endDate: string;
} {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const periodLength = end.getTime() - start.getTime();

  const prevEnd = new Date(start.getTime() - 24 * 60 * 60 * 1000); // Day before start
  const prevStart = new Date(prevEnd.getTime() - periodLength);

  return {
    startDate: prevStart.toISOString().split('T')[0],
    endDate: prevEnd.toISOString().split('T')[0],
  };
}

export function getDateRangePresets(): DateRangePreset[] {
  const today = new Date();

  return [
    {
      label: 'Today',
      period: 'day',
      ...calculateDateRange('day', today),
    },
    {
      label: 'Last 7 Days',
      period: 'week',
      ...calculateDateRange('week', today),
    },
    {
      label: 'Last 30 Days',
      period: 'month',
      ...calculateDateRange('month', today),
    },
    {
      label: 'Last 90 Days',
      period: 'quarter',
      ...calculateDateRange('quarter', today),
    },
    {
      label: 'Last Year',
      period: 'year',
      ...calculateDateRange('year', today),
    },
  ];
}

export function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // If same day
  if (startDate === endDate) {
    return formatDate(start);
  }

  // If same month and year
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
  }

  // Different months
  return `${formatDate(start)} - ${formatDate(end)}`;
}

// ==============================================================================
// GROUPING
// ==============================================================================

export function groupByPeriod<T>(
  rows: T[],
  dateField: keyof T,
  period: TimePeriod
): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  rows.forEach((row) => {
    const dateValue = row[dateField];
    if (!dateValue) return;

    const date = new Date(String(dateValue));
    let key: string;

    switch (period) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;

      case 'week':
        // ISO week (Monday as first day)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        key = `Week of ${weekStart.toISOString().split('T')[0]}`;
        break;

      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;

      case 'quarter':
        const quarter = Math.floor(date.getMonth() / 3) + 1;
        key = `Q${quarter} ${date.getFullYear()}`;
        break;

      case 'year':
        key = String(date.getFullYear());
        break;

      default:
        key = date.toISOString().split('T')[0];
    }

    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  return grouped;
}

export function groupBy<T>(rows: T[], field: keyof T): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};

  rows.forEach((row) => {
    const key = String(row[field]);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  return grouped;
}

// ==============================================================================
// PAGINATION
// ==============================================================================

export function paginateArray<T>(
  array: T[],
  limit: number,
  offset: number
): {
  data: T[];
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
} {
  const total = array.length;
  const data = array.slice(offset, offset + limit);
  const hasMore = offset + limit < total;
  const nextOffset = hasMore ? offset + limit : null;

  return { data, total, hasMore, nextOffset };
}

// ==============================================================================
// STATISTICAL HELPERS
// ==============================================================================

export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

export function calculateSum(values: number[]): number {
  return values.reduce((acc, val) => acc + val, 0);
}

// ==============================================================================
// EXPORT ALL UTILITIES
// ==============================================================================

export const analyticsUtils = {
  // Trend
  calculateTrend,

  // Ranking
  rankRows,
  rankRowsWithTrend,

  // Filtering
  filterRows,
  filterByStatus,
  applyClientFilters,

  // Percentage
  calculatePercentage,
  formatPercentage,

  // Currency
  formatCurrency,

  // Dates
  calculateDateRange,
  calculatePreviousPeriod,
  getDateRangePresets,
  formatDateRange,

  // Grouping
  groupByPeriod,
  groupBy,

  // Pagination
  paginateArray,

  // Statistics
  calculateAverage,
  calculateMedian,
  calculateSum,
};

import React, { useMemo, useState } from 'react';
import { BarChart3, CalendarDays, PieChart as PieChartIcon } from 'lucide-react';
import { formatINR, getAdminText, getLocalizedMonthShort } from '../../pages/Admin/adminI18n';

const getNiceMax = (rawMax, minFloor = 4) => {
  const num = Number(rawMax) || 0;
  if (num <= 0) return minFloor;
  if (num <= minFloor) return minFloor;
  const magnitude = Math.pow(10, Math.floor(Math.log10(num)));
  const fraction = num / magnitude;
  let niceFraction = 10;
  if (fraction <= 1) niceFraction = 1;
  else if (fraction <= 1.5) niceFraction = 1.5;
  else if (fraction <= 2) niceFraction = 2;
  else if (fraction <= 3) niceFraction = 3;
  else if (fraction <= 4) niceFraction = 4;
  else if (fraction <= 5) niceFraction = 5;
  else if (fraction <= 6) niceFraction = 6;
  else if (fraction <= 8) niceFraction = 8;
  return Math.max(minFloor, Math.ceil(niceFraction * magnitude));
};

const formatAxisNumber = (val, isCurrency = false) => {
  const num = Math.round(Number(val) || 0);
  if (!isCurrency) return String(num);
  return `₹${num.toLocaleString('en-IN')}`;
};

const ROOM_DONUT_COLORS = [
  '#1B4332', // Forest green
  '#B8964A', // Gold
  '#0F766E', // Teal
  '#A8654A', // Terracotta
  '#475569'  // Slate
];

/**
 * 1. MAIN CHART: Bookings Trend
 * Bar chart (Bookings / Revenue / Nights) with optional Gold Revenue line,
 * metric toggle, range selector (6m / 12m / year), axes, gridlines, tooltips & empty state.
 */
export const BookingsTrendChart = ({
  dataset = [],
  range = '6m',
  onRangeChange,
  language = 'en',
  loading = false
}) => {
  const t = getAdminText(language);
  const tc = t.charts;

  const [metric, setMetric] = useState('bookings'); // 'bookings' | 'revenue' | 'nights'
  const [showRevenueLine, setShowRevenueLine] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const safeData = useMemo(() => {
    if (!Array.isArray(dataset) || dataset.length === 0) return [];
    return dataset.map((item) => ({
      ...item,
      bookings: Number(item.bookings) || 0,
      revenue: Number(item.revenue) || 0,
      nights: Number(item.nights) || 0,
      displayMonth: getLocalizedMonthShort(item.monthIndex, item.month, language)
    }));
  }, [dataset, language]);

  const hasAnyData = useMemo(
    () => safeData.some((d) => d.bookings > 0 || d.revenue > 0 || d.nights > 0),
    [safeData]
  );

  const isRevenueMetric = metric === 'revenue';
  const showOverlayLine = !isRevenueMetric && showRevenueLine && safeData.some((d) => d.revenue > 0);

  const maxPrimary = useMemo(() => {
    const raw = Math.max(0, ...safeData.map((d) => Number(d[metric]) || 0));
    return getNiceMax(raw, isRevenueMetric ? 10000 : 4);
  }, [safeData, metric, isRevenueMetric]);

  const maxRevenueAxis = useMemo(() => {
    const raw = Math.max(0, ...safeData.map((d) => Number(d.revenue) || 0));
    return getNiceMax(raw, 10000);
  }, [safeData]);

  // SVG viewBox geometry
  const W = 720;
  const H = 276;
  const padL = isRevenueMetric ? 74 : 44;
  const padR = showOverlayLine ? 72 : 20;
  const padT = 22;
  const padB = 40;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const count = Math.max(1, safeData.length);
  const stepW = plotW / count;
  const barW = Math.min(36, Math.max(12, stepW * 0.56));
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  const linePoints = useMemo(() => {
    if (!showOverlayLine || safeData.length === 0) return '';
    return safeData
      .map((d, idx) => {
        const cx = padL + stepW * idx + stepW / 2;
        const cy = padT + plotH - (d.revenue / maxRevenueAxis) * plotH;
        return `${cx.toFixed(1)},${cy.toFixed(1)}`;
      })
      .join(' ');
  }, [showOverlayLine, safeData, padL, stepW, padT, plotH, maxRevenueAxis]);

  const hoveredItem = hoveredIdx !== null && safeData[hoveredIdx] ? safeData[hoveredIdx] : null;
  const hoveredLeftPct =
    hoveredIdx !== null && count > 0
      ? Math.min(82, Math.max(18, ((padL + stepW * hoveredIdx + stepW / 2) / W) * 100))
      : 50;

  return (
    <div className="admin-card p-5 sm:p-6 flex flex-col justify-between">
      {/* Header + Controls */}
      <div className="flex flex-col gap-3 pb-4 mb-3 border-b border-[var(--admin-border)]">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#EEF2EA] text-[#0F2A20] flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-[var(--admin-heading)] leading-tight">
                  {tc.bookingsTrendTitle}
                </h3>
                <p className="text-[11px] text-[var(--admin-muted)] mt-0.5">
                  {tc.bookingsTrendSubtitle}
                </p>
              </div>
            </div>
          </div>

          {/* Range Selector */}
          <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)] self-start">
            {[
              { id: '6m', label: tc.range6m },
              { id: '12m', label: tc.range12m },
              { id: 'year', label: tc.rangeYear }
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => onRangeChange?.(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                  range === opt.id
                    ? 'bg-[#0F2A20] text-[#F3EDDD] shadow-sm'
                    : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)] hover:bg-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Toggle & Optional Revenue Line */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--admin-surface-subtle)] border border-[var(--admin-border)]">
            {[
              { id: 'bookings', label: tc.metricBookings },
              { id: 'revenue', label: tc.metricRevenue },
              { id: 'nights', label: tc.metricNights }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setMetric(m.id);
                  setHoveredIdx(null);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  metric === m.id
                    ? 'bg-[var(--admin-gold)] text-[#0F2A20] shadow-sm'
                    : 'text-[var(--admin-muted)] hover:text-[var(--admin-heading)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-[var(--admin-text)] font-medium">
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ backgroundColor: isRevenueMetric ? '#B8964A' : '#1B4332' }}
              />
              {metric === 'bookings'
                ? tc.metricBookings
                : metric === 'revenue'
                ? tc.metricRevenue
                : tc.metricNights}
            </span>

            {!isRevenueMetric && (
              <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[var(--admin-text)] font-medium">
                <input
                  type="checkbox"
                  checked={showRevenueLine}
                  onChange={(e) => setShowRevenueLine(e.target.checked)}
                  className="rounded border-[var(--admin-input-border)] text-[#B8964A] focus:ring-[#0F2A20]"
                />
                <span className="w-3 h-0.5 bg-[#B8964A] inline-block rounded" />
                <span>{tc.showRevenueLine}</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* SVG Plot Area */}
      <div
        className="relative w-full"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block select-none overflow-visible"
          role="img"
          aria-label={tc.bookingsTrendTitle}
        >
          {/* Horizontal gridlines & Left Y-Axis */}
          {yTicks.map((ratio, idx) => {
            const y = padT + plotH - ratio * plotH;
            const val = maxPrimary * ratio;
            return (
              <g key={idx}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke={idx === 0 ? '#D9D2BF' : '#ECE6D8'}
                  strokeWidth={idx === 0 ? 1.2 : 1}
                  strokeDasharray={idx === 0 ? undefined : '4 4'}
                />
                <text
                  x={padL - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10.5"
                  fill="#5F6B62"
                  fontFamily="Poppins, sans-serif"
                >
                  {formatAxisNumber(val, isRevenueMetric)}
                </text>

                {showOverlayLine && (
                  <text
                    x={W - padR + 8}
                    y={y + 4}
                    textAnchor="start"
                    fontSize="10"
                    fill="#78591C"
                    fontFamily="Poppins, sans-serif"
                  >
                    {formatAxisNumber(maxRevenueAxis * ratio, true)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Bars */}
          {safeData.map((d, idx) => {
            const val = Number(d[metric]) || 0;
            const rawBarH = maxPrimary > 0 ? (val / maxPrimary) * plotH : 0;
            const barH = val > 0 ? Math.max(4, rawBarH) : 2;
            const cx = padL + stepW * idx + stepW / 2;
            const x = cx - barW / 2;
            const y = padT + plotH - barH;
            const isHovered = hoveredIdx === idx;
            const fill =
              val === 0
                ? '#E7E0CF'
                : isRevenueMetric
                ? isHovered
                  ? '#A38238'
                  : '#B8964A'
                : isHovered
                ? '#0F2A20'
                : '#1B4332';

            return (
              <g
                key={d.key || `${d.month}-${idx}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
              >
                {/* Hover column highlight */}
                <rect
                  x={padL + stepW * idx + 2}
                  y={padT}
                  width={Math.max(4, stepW - 4)}
                  height={plotH}
                  rx="6"
                  fill={isHovered ? 'rgba(15, 42, 32, 0.05)' : 'transparent'}
                />

                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={val > 0 ? 5 : 1}
                  fill={fill}
                />

                {/* X-axis Month Label */}
                <text
                  x={cx}
                  y={padT + plotH + 18}
                  textAnchor="middle"
                  fontSize={count > 8 ? '10' : '11'}
                  fontWeight={isHovered ? '700' : '500'}
                  fill={isHovered ? '#0F2A20' : '#5F6B62'}
                  fontFamily="Poppins, sans-serif"
                >
                  {d.displayMonth}
                </text>
              </g>
            );
          })}

          {/* Optional Revenue Line Overlay */}
          {showOverlayLine && safeData.length > 1 && (
            <polyline
              fill="none"
              stroke="#B8964A"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={linePoints}
            />
          )}

          {showOverlayLine &&
            safeData.map((d, idx) => {
              const cx = padL + stepW * idx + stepW / 2;
              const cy = padT + plotH - (d.revenue / maxRevenueAxis) * plotH;
              const isHovered = hoveredIdx === idx;
              return (
                <circle
                  key={`pt-${idx}`}
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 5.5 : 3.8}
                  fill="#FFFFFF"
                  stroke="#B8964A"
                  strokeWidth={isHovered ? 2.5 : 2}
                  className="pointer-events-none"
                />
              );
            })}
        </svg>

        {/* Empty State Banner when no bookings exist in range */}
        {!loading && !hasAnyData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-6">
            <div className="px-4 py-2 rounded-full bg-white/95 border border-[var(--admin-border)] shadow-sm text-xs font-semibold text-[var(--admin-muted)]">
              {tc.noBookingsYet}
            </div>
          </div>
        )}

        {/* Interactive Tooltip */}
        {hoveredItem && (
          <div
            className="absolute top-1 z-20 pointer-events-none -translate-x-1/2 bg-white border border-[var(--admin-border)] rounded-xl shadow-lg px-3 py-2 text-[11px] min-w-[155px]"
            style={{ left: `${hoveredLeftPct}%` }}
          >
            <div className="font-bold text-[var(--admin-heading)] border-b border-[var(--admin-border)] pb-1 mb-1">
              {hoveredItem.displayMonth} {hoveredItem.year || ''}
            </div>
            <div className="flex justify-between gap-3 text-[var(--admin-text)]">
              <span>{tc.metricBookings}:</span>
              <span className="font-mono font-bold">{hoveredItem.bookings}</span>
            </div>
            <div className="flex justify-between gap-3 text-[var(--admin-gold-text)]">
              <span>{tc.metricRevenue}:</span>
              <span className="font-mono font-bold">{formatINR(hoveredItem.revenue)}</span>
            </div>
            <div className="flex justify-between gap-3 text-[var(--admin-muted)]">
              <span>{tc.metricNights}:</span>
              <span className="font-mono font-semibold">{hoveredItem.nights}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 2. SECOND CHART: Next 30 Days Occupancy
 * Small vertical bar per day colored by fullness (from RoomNight data).
 */
export const Next30DaysOccupancyChart = ({
  days = [],
  totalUnits = 5,
  language = 'en'
}) => {
  const tc = getAdminText(language).charts;
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const safeDays = useMemo(() => (Array.isArray(days) ? days : []), [days]);
  const cap = Math.max(1, Number(totalUnits) || 5);
  const hasAnyOccupancy = safeDays.some((d) => (Number(d.booked) || 0) > 0);

  const W = 720;
  const H = 200;
  const padL = 34;
  const padR = 14;
  const padT = 16;
  const padB = 34;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const count = Math.max(1, safeDays.length);
  const stepW = plotW / count;
  const barW = Math.max(6, Math.min(16, stepW * 0.68));

  const getBarColor = (booked, total, isBlocked) => {
    if (isBlocked && booked === 0) return '#CBD5E1';
    if (!booked || booked <= 0) return '#E7E0CF';
    const pct = (booked / Math.max(1, total)) * 100;
    if (pct >= 85) return '#B42318'; // Full / high -> red
    if (pct >= 50) return '#B8964A'; // Medium -> gold
    return '#1B4332'; // Low -> forest green
  };

  const hoveredDay = hoveredIdx !== null && safeDays[hoveredIdx] ? safeDays[hoveredIdx] : null;
  const hoveredLeftPct =
    hoveredIdx !== null && count > 0
      ? Math.min(82, Math.max(18, ((padL + stepW * hoveredIdx + stepW / 2) / W) * 100))
      : 50;

  return (
    <div className="admin-card p-5 sm:p-6 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--admin-border)]">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center flex-shrink-0">
            <CalendarDays className="w-4 h-4" />
          </span>
          <div>
            <h3 className="font-serif text-base font-semibold text-[var(--admin-heading)] leading-tight">
              {tc.next30Title}
            </h3>
            <p className="text-[11px] text-[var(--admin-muted)] mt-0.5">
              {language === 'kn' ? `${tc.next30Subtitle} ${cap})` : `${tc.next30Subtitle} ${cap}`}
            </p>
          </div>
        </div>

        {/* Occupancy Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-[var(--admin-muted)] font-medium">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1B4332]" />
            {tc.lowOcc}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B8964A]" />
            {tc.medOcc}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#B42318]" />
            {tc.highOcc}
          </span>
        </div>
      </div>

      <div
        className="relative w-full"
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block select-none overflow-visible"
          role="img"
          aria-label={tc.next30Title}
        >
          {[0, Math.ceil(cap / 2), cap].map((tickVal, idx) => {
            const y = padT + plotH - (tickVal / cap) * plotH;
            return (
              <g key={idx}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke={tickVal === 0 ? '#D9D2BF' : '#ECE6D8'}
                  strokeDasharray={tickVal === 0 ? undefined : '4 4'}
                />
                <text
                  x={padL - 7}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="#5F6B62"
                  fontFamily="Poppins, sans-serif"
                >
                  {tickVal}
                </text>
              </g>
            );
          })}

          {safeDays.map((d, idx) => {
            const booked = Math.min(cap, Math.max(0, Number(d.booked) || 0));
            const barH = booked > 0 ? Math.max(5, (booked / cap) * plotH) : 3;
            const cx = padL + stepW * idx + stepW / 2;
            const x = cx - barW / 2;
            const y = padT + plotH - barH;
            const isHovered = hoveredIdx === idx;
            const showTick = idx === 0 || idx === safeDays.length - 1 || idx % 5 === 0;

            return (
              <g
                key={d.date || idx}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
              >
                <rect
                  x={padL + stepW * idx}
                  y={padT}
                  width={stepW}
                  height={plotH}
                  fill={isHovered ? 'rgba(15, 42, 32, 0.06)' : 'transparent'}
                />
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  rx={booked > 0 ? 3 : 1}
                  fill={getBarColor(booked, cap, d.isBlocked)}
                  opacity={hoveredIdx !== null && !isHovered ? 0.72 : 1}
                />
                {showTick && (
                  <text
                    x={cx}
                    y={padT + plotH + 17}
                    textAnchor="middle"
                    fontSize="9.5"
                    fill={isHovered ? '#0F2A20' : '#5F6B62'}
                    fontWeight={isHovered ? '700' : '500'}
                    fontFamily="Poppins, sans-serif"
                  >
                    {d.label || d.date?.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {!hasAnyOccupancy && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
            <div className="px-3.5 py-1.5 rounded-full bg-white/95 border border-[var(--admin-border)] shadow-sm text-[11px] font-medium text-[var(--admin-muted)]">
              {tc.next30Empty}
            </div>
          </div>
        )}

        {hoveredDay && (
          <div
            className="absolute top-0 z-20 pointer-events-none -translate-x-1/2 bg-white border border-[var(--admin-border)] rounded-xl shadow-lg px-3 py-1.5 text-[11px] whitespace-nowrap"
            style={{ left: `${hoveredLeftPct}%` }}
          >
            <div className="font-bold text-[var(--admin-heading)]">{hoveredDay.label || hoveredDay.date}</div>
            <div className="text-[var(--admin-text)] font-mono">
              {hoveredDay.booked} / {cap} {tc.roomsBookedLabel} ({hoveredDay.occupancyPercent ?? Math.round((hoveredDay.booked / cap) * 100)}%)
            </div>
            {hoveredDay.isBlocked && (
              <div className="text-[10px] text-[#B42318] font-semibold">{tc.blockedLabel}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 3. THIRD CHART: Bookings by Room Type (Donut Chart)
 */
export const BookingsByRoomTypeChart = ({
  breakdown = [],
  language = 'en'
}) => {
  const tc = getAdminText(language).charts;
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const items = useMemo(() => {
    if (!Array.isArray(breakdown)) return [];
    return breakdown.filter((item) => (Number(item.bookings) || 0) > 0);
  }, [breakdown]);

  const totalBookings = useMemo(
    () => items.reduce((sum, item) => sum + (Number(item.bookings) || 0), 0),
    [items]
  );

  const size = 180;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 64;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  const segments = useMemo(() => {
    if (totalBookings === 0) return [];
    let offsetAcc = 0;
    return items.map((item, idx) => {
      const share = item.bookings / totalBookings;
      const segLen = share * circumference;
      const dashOffset = -offsetAcc;
      offsetAcc += segLen;
      return {
        ...item,
        color: ROOM_DONUT_COLORS[idx % ROOM_DONUT_COLORS.length],
        pct: Math.round(share * 100),
        dashArray: `${segLen} ${circumference - segLen}`,
        dashOffset
      };
    });
  }, [items, totalBookings, circumference]);

  const activeItem = hoveredIdx !== null && segments[hoveredIdx] ? segments[hoveredIdx] : null;

  return (
    <div className="admin-card p-5 sm:p-6 flex flex-col justify-between">
      <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[var(--admin-border)]">
        <span className="w-8 h-8 rounded-lg bg-[#FBF6E8] text-[#78591C] flex items-center justify-center flex-shrink-0">
          <PieChartIcon className="w-4 h-4" />
        </span>
        <div>
          <h3 className="font-serif text-base font-semibold text-[var(--admin-heading)] leading-tight">
            {tc.roomTypeTitle}
          </h3>
          <p className="text-[11px] text-[var(--admin-muted)] mt-0.5">
            {tc.roomTypeSubtitle}
          </p>
        </div>
      </div>

      {totalBookings === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-6 gap-3">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#E7E0CF"
              strokeWidth={strokeWidth}
            />
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              fontSize="20"
              fontWeight="700"
              fill="#5F6B62"
              fontFamily="Poppins, sans-serif"
            >
              0
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              fontSize="10"
              fill="#5F6B62"
              fontFamily="Poppins, sans-serif"
            >
              {tc.totalStays}
            </text>
          </svg>
          <span className="text-xs font-medium text-[var(--admin-muted)]">
            {tc.noBookingsYet}
          </span>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-5 py-1">
          <div className="relative flex-shrink-0" onMouseLeave={() => setHoveredIdx(null)}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <g transform={`rotate(-90 ${cx} ${cy})`}>
                {segments.map((seg, idx) => {
                  const isHovered = hoveredIdx === idx;
                  return (
                    <circle
                      key={seg.roomType || idx}
                      cx={cx}
                      cy={cy}
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                      strokeDasharray={seg.dashArray}
                      strokeDashoffset={seg.dashOffset}
                      className="transition-all duration-150 cursor-pointer"
                      opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
                    />
                  );
                })}
              </g>
              <text
                x={cx}
                y={cy - 3}
                textAnchor="middle"
                fontSize="22"
                fontWeight="700"
                fill="#0F2A20"
                fontFamily="Playfair Display, Georgia, serif"
              >
                {activeItem ? activeItem.bookings : totalBookings}
              </text>
              <text
                x={cx}
                y={cy + 15}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill="#5F6B62"
                fontFamily="Poppins, sans-serif"
              >
                {activeItem ? `${activeItem.pct}%` : tc.totalStays}
              </text>
            </svg>
          </div>

          <div className="flex-1 w-full space-y-2 text-xs">
            {segments.map((seg, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <div
                  key={seg.roomType || idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(hoveredIdx === idx ? null : idx)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                    isHovered
                      ? 'bg-[var(--admin-surface-subtle)] border-[var(--admin-gold)]'
                      : 'bg-white border-[var(--admin-border)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--admin-heading)] block truncate">
                        {seg.roomType}
                      </span>
                      <span className="text-[10px] text-[var(--admin-muted)] block">
                        {tc.paidWord}: {formatINR(seg.revenue)} · {seg.nights} {tc.metricNights.toLowerCase()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-[var(--admin-heading)] block">
                      {seg.bookings}
                    </span>
                    <span className="text-[10px] text-[var(--admin-muted)] font-mono">
                      {seg.pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


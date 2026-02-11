"use client";

import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { scaleTime, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { GridRows } from '@visx/grid';
import { curveMonotoneX } from '@visx/curve';
import { useTooltip, TooltipWithBounds, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { ParentSize } from '@visx/responsive';
import styles from './HardwarePriceChart.module.css';

interface RamDataPoint {
  date: Date;
  price: number;
}

interface GpuDataPoint {
  date: Date;
  msrp: number;
  actual: number;
}

type DataPoint = RamDataPoint | GpuDataPoint;

const ramData: RamDataPoint[] = [
  { date: new Date('2025-05-01'), price: 105 },
  { date: new Date('2025-06-01'), price: 115 },
  { date: new Date('2025-07-01'), price: 135 },
  { date: new Date('2025-08-01'), price: 165 },
  { date: new Date('2025-09-01'), price: 210 },
  { date: new Date('2025-10-01'), price: 297 },
  { date: new Date('2025-11-01'), price: 365 },
  { date: new Date('2025-12-01'), price: 400 },
  { date: new Date('2026-01-01'), price: 420 },
];

const gpuData: GpuDataPoint[] = [
  { date: new Date('2022-10-01'), msrp: 1599, actual: 1599 },
  { date: new Date('2023-01-01'), msrp: 1599, actual: 1750 },
  { date: new Date('2023-06-01'), msrp: 1599, actual: 2000 },
  { date: new Date('2024-01-01'), msrp: 1599, actual: 2050 },
  { date: new Date('2024-06-01'), msrp: 1599, actual: 2100 },
  { date: new Date('2024-10-01'), msrp: 1599, actual: 2150 },
  { date: new Date('2025-01-01'), msrp: 1599, actual: 2180 },
  { date: new Date('2026-02-01'), msrp: 1599, actual: 2200 },
];

const getDate = (d: DataPoint) => d.date;
const getPrice = (d: RamDataPoint) => d.price;
const getMsrp = (d: GpuDataPoint) => d.msrp;
const getActual = (d: GpuDataPoint) => d.actual;

const bisectDate = bisector((d: DataPoint) => d.date).left;

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'rgba(55, 63, 78, 0.95)',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '8px',
  color: '#fbf1f1',
  padding: '8px 12px',
};

interface ChartProps {
  type: 'ram' | 'gpu';
  width: number;
  height: number;
}

function Chart({ type, width, height }: ChartProps) {
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip<DataPoint>();

  const data = type === 'ram' ? ramData : gpuData;

  const isMobile = width < 500;
  const margin = isMobile
    ? { top: 20, right: 20, bottom: 70, left: 45 }
    : { top: 20, right: 30, bottom: 60, left: 60 };

  const xMax = width - margin.left - margin.right;
  const yMax = height - margin.top - margin.bottom;

  const xScale = scaleTime({
    domain: [
      new Date(Math.min(...data.map(d => getDate(d).getTime()))),
      new Date(Math.max(...data.map(d => getDate(d).getTime())))
    ],
    range: [0, xMax],
  });

  const yScale = scaleLinear({
    domain: type === 'ram'
      ? [0, Math.max(...(data as RamDataPoint[]).map(getPrice)) + 50]
      : [1500, 2300],
    range: [yMax, 0],
    nice: true,
  });

  const handleTooltip = (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
    const { x } = localPoint(event) || { x: 0 };
    const x0 = xScale.invert(x - margin.left);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    let d = d0;
    if (d1 && getDate(d1)) {
      d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
    }
    showTooltip({
      tooltipData: d,
      tooltipLeft: x,
      tooltipTop: yScale(type === 'ram' ? getPrice(d as RamDataPoint) : getActual(d as GpuDataPoint)),
    });
  };

  const xAxisProps = {
    top: yMax,
    scale: xScale,
    stroke: "rgba(255,255,255,0.7)",
    tickStroke: "rgba(255,255,255,0.7)",
    numTicks: isMobile ? 3 : 6,
    tickFormat: (value: Date | { valueOf(): number }) => {
      const date = value instanceof Date ? value : new Date(value.valueOf());
      if (isMobile) {
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    },
    tickLabelProps: () => ({
      fill: 'rgba(255,255,255,0.7)',
      fontSize: isMobile ? 9 : 10,
      textAnchor: 'end' as const,
      angle: isMobile ? -45 : -35,
      dx: -4,
      dy: 4,
    }),
  };

  const yAxisProps = {
    scale: yScale,
    stroke: "rgba(255,255,255,0.7)",
    tickStroke: "rgba(255,255,255,0.7)",
    numTicks: isMobile ? 5 : 8,
    tickLabelProps: () => ({
      fill: 'rgba(255,255,255,0.7)',
      fontSize: isMobile ? 9 : 11,
      textAnchor: 'end' as const,
      dx: -4,
    }),
    label: "Price (USD)",
    labelProps: {
      fill: 'rgba(255,255,255,0.7)',
      fontSize: isMobile ? 10 : 12,
      textAnchor: 'middle' as const,
    },
  };

  if (type === 'ram') {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg width={width} height={height}>
          <Group left={margin.left} top={margin.top}>
            <GridRows scale={yScale} width={xMax} stroke="rgba(255,255,255,0.1)" />
            <AxisBottom {...xAxisProps} />
            <AxisLeft {...yAxisProps} />
            <LinePath
              data={data as RamDataPoint[]}
              x={(d) => xScale(getDate(d))}
              y={(d) => yScale(getPrice(d))}
              stroke="#ff6b6b"
              strokeWidth={3}
              curve={curveMonotoneX}
            />
            {(data as RamDataPoint[]).map((d, i) => (
              <circle
                key={i}
                cx={xScale(getDate(d))}
                cy={yScale(getPrice(d))}
                r={isMobile ? 4 : 5}
                fill="#ff6b6b"
              />
            ))}
            <rect
              x={0}
              y={0}
              width={xMax}
              height={yMax}
              fill="transparent"
              onTouchStart={handleTooltip}
              onTouchMove={handleTooltip}
              onMouseMove={handleTooltip}
              onMouseLeave={hideTooltip}
            />
          </Group>
        </svg>
        {tooltipOpen && tooltipData && 'price' in tooltipData && (
          <TooltipWithBounds
            top={tooltipTop! + margin.top}
            left={tooltipLeft}
            style={tooltipStyles}
          >
            <div>
              <strong>{tooltipData.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong>
              <div>${tooltipData.price}</div>
            </div>
          </TooltipWithBounds>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg width={width} height={height}>
        <Group left={margin.left} top={margin.top}>
          <GridRows scale={yScale} width={xMax} stroke="rgba(255,255,255,0.1)" />
          <AxisBottom {...xAxisProps} />
          <AxisLeft {...yAxisProps} />
          <LinePath
            data={data as GpuDataPoint[]}
            x={(d) => xScale(getDate(d))}
            y={(d) => yScale(getMsrp(d))}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={2}
            strokeDasharray="5,5"
            curve={curveMonotoneX}
          />
          <LinePath
            data={data as GpuDataPoint[]}
            x={(d) => xScale(getDate(d))}
            y={(d) => yScale(getActual(d))}
            stroke="#4ecdc4"
            strokeWidth={3}
            curve={curveMonotoneX}
          />
          {(data as GpuDataPoint[]).map((d, i) => (
            <circle
              key={i}
              cx={xScale(getDate(d))}
              cy={yScale(getActual(d))}
              r={isMobile ? 4 : 5}
              fill="#4ecdc4"
            />
          ))}
          <rect
            x={0}
            y={0}
            width={xMax}
            height={yMax}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
          />
        </Group>
      </svg>
      {tooltipOpen && tooltipData && 'msrp' in tooltipData && (
        <TooltipWithBounds
          top={tooltipTop! + margin.top}
          left={tooltipLeft}
          style={tooltipStyles}
        >
          <div>
            <strong>{tooltipData.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong>
            <div>MSRP: ${tooltipData.msrp}</div>
            <div>Actual: ${tooltipData.actual}</div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
}

interface HardwarePriceChartProps {
  type: 'ram' | 'gpu';
}

export default function HardwarePriceChart({ type }: HardwarePriceChartProps) {
  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>
        {type === 'ram' ? 'RAM Price Crisis: 32GB DDR5 Kits' : 'GPU Pricing: RTX 4090'}
      </h3>
      <p className={styles.chartSubtitle}>
        {type === 'ram'
          ? '400% increase from May 2025 to January 2026'
          : 'MSRP vs. Actual Market Prices'}
      </p>
      <div style={{ width: '100%', height: '400px' }}>
        <ParentSize>
          {({ width, height }) => <Chart type={type} width={width} height={height} />}
        </ParentSize>
      </div>
      <p className={styles.chartSource}>
        Sources: {type === 'ram' ? (
          <>
            <a href="https://www.accio.com/business/memory-price-trend" target="_blank" rel="noopener">Accio</a>,
            {' '}<a href="https://originalpricing.com/ram-prices-2026-crisis-ddr5-ddr4-shortage/" target="_blank" rel="noopener">Original Pricing</a>
          </>
        ) : (
          <>
            <a href="https://bestvaluegpu.com/history/new-and-used-rtx-4090-price-history-and-specs/" target="_blank" rel="noopener">BestValueGPU</a>,
            {' '}<a href="https://www.tomshardware.com/news/nvidia-rtx-4090-prices-have-been-creeping-upward" target="_blank" rel="noopener">Tom's Hardware</a>
          </>
        )}
      </p>
    </div>
  );
}

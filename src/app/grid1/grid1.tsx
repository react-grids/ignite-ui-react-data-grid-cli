import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  IgrGrid,
  IgrColumn,
  IgrPaginator,
  IgrGridToolbar,
  IgrGridToolbarActions,
  IgrGridToolbarHiding,
  IgrGridToolbarPinning,
  IgrGridToolbarExporter,
  ColumnPinningPosition,
  SortingDirection,
  type IgrCellTemplateContext,
  type IgrColumnPipeArgs,
  type IgrGroupingExpression,
} from 'igniteui-react-grids';

import style from './style.module.css';
import { DEFAULT_THEME_ID, THEMES, type ThemeId } from './themes';

const DATA_URL =
  'https://excel2json.io/api/share/0e3b829e-e63c-4eee-6c97-08da1411ad26';

const SALESPERSON_IMAGES: Record<string, string> = {
  'Andrew Fuller': 'man-1.png',
  'Anne Dodsworth': 'woman-1.png',
  'Janet Leverling': 'woman-2.png',
  'Laura Callahan': 'woman-3.png',
  'Margaret Peacock': 'woman-4.png',
  'Michael Suyama': 'man-2.png',
  'Nancy Davolio': 'woman-5.png',
  'Robert King': 'man-3.png',
  'Steven Buchanan': 'man-4.png',
};

const FACE_URL_BASE = 'https://users.infragistics.com/Reveal/Images/faces/';

const currencyPipeArgs: IgrColumnPipeArgs = {
  digitsInfo: '1.2-2',
  currencyCode: 'USD',
  display: 'symbol',
};

const percentPipeArgs: IgrColumnPipeArgs = {
  digitsInfo: '1.0-2',
};

const groupingExpressions: IgrGroupingExpression[] = [
  { fieldName: 'ShipperName', dir: SortingDirection.Asc, ignoreCase: false },
];

type Row = Record<string, unknown>;

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface CustomerMetrics {
  totalShipments: number;
  ytdRevenue: number;
  revenueTarget: number;
  sparkline: number[];
}

interface TooltipState {
  rowKey: string;
  rect: { top: number; left: number; bottom: number; right: number; width: number; height: number };
  name: string;
  city: string;
  country: string;
  metrics: CustomerMetrics;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) || 1;
}

function buildCustomerMetrics(row: Row): CustomerMetrics {
  const seedKey = `${row['CustomerName'] ?? ''}|${row['CustomerID'] ?? ''}`;
  const seed = hashString(seedKey);
  const totalShipments = 8 + (seed % 95);
  const ytdRevenue = 60_000 + (seed % 940_000);
  const revenueTarget = ytdRevenue + 80_000 + ((seed * 7) % 520_000);

  const sparkline: number[] = [];
  for (let i = 0; i < 12; i++) {
    const v = Math.sin((seed % 360) * 0.0174533 + i * 0.7) * 0.45 + 0.5;
    const jitter = ((seed >> (i % 16)) & 0xff) / 255 - 0.5;
    sparkline.push(Math.max(0.05, Math.min(0.95, v + jitter * 0.35)));
  }
  return { totalShipments, ytdRevenue, revenueTarget, sparkline };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
}

function quantityTemplate(props: { dataContext: IgrCellTemplateContext }) {
  const value = props.dataContext.cell.value as number | null | undefined;
  if (typeof value === 'number' && value < 20) {
    return (
      <span className={style.quantityCell}>
        <span
          className={style.lowQuantityIndicator}
          role="img"
          aria-label="Low quantity"
          title="Low quantity"
        >
          ▼
        </span>
        <span>{value}</span>
      </span>
    );
  }
  return <span>{value as number}</span>;
}

type EnterHandler = (
  e: React.MouseEvent<HTMLSpanElement>,
  row: Row,
) => void;
type LeaveHandler = () => void;

function CustomerNameTooltip({ state }: { state: TooltipState }) {
  const { rect, name, city, country, metrics } = state;

  // Position below the cell by default; flip up if it would overflow.
  const tooltipHeight = 220;
  const tooltipWidth = 320;
  let top = rect.bottom + 8;
  if (top + tooltipHeight > window.innerHeight - 8) {
    top = Math.max(8, rect.top - tooltipHeight - 8);
  }
  let left = rect.left;
  if (left + tooltipWidth > window.innerWidth - 8) {
    left = Math.max(8, window.innerWidth - tooltipWidth - 8);
  }

  const sparklineW = 280;
  const sparklineH = 40;
  const points = metrics.sparkline
    .map((v, i, arr) => {
      const x = (i / (arr.length - 1)) * sparklineW;
      const y = sparklineH - v * sparklineH;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const shipmentsUp = metrics.totalShipments > 50;

  return (
    <div
      className={style.tooltip}
      role="tooltip"
      id="customer-name-tooltip"
      style={{ top, left }}
      aria-live="polite"
    >
      <p className={style.tooltipName}>{name}</p>
      <p className={style.tooltipLocation}>
        {[city, country].filter(Boolean).join(', ') || '—'}
      </p>

      <svg
        className={style.tooltipSparkline}
        viewBox={`0 0 ${sparklineW} ${sparklineH + 12}`}
        role="img"
        aria-label="Recent activity sparkline"
      >
        <defs>
          <linearGradient id="aurora-spark-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <line
          x1={0}
          x2={sparklineW}
          y1={sparklineH / 2 + 6}
          y2={sparklineH / 2 + 6}
          stroke="#475569"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
        <polyline
          points={points}
          fill="none"
          stroke="url(#aurora-spark-gradient)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0, 6)"
        />
      </svg>

      <div className={style.tooltipMetrics}>
        <span className={style.tooltipMetricLabel}>Total Shipments</span>
        <span className={style.tooltipMetricValue}>
          <span
            className={shipmentsUp ? style.upArrow : style.downArrow}
            aria-label={shipmentsUp ? 'Trending up' : 'Trending down'}
            role="img"
          >
            {shipmentsUp ? '▲' : '▼'}
          </span>
          {metrics.totalShipments}
        </span>

        <span className={style.tooltipMetricLabel}>YTD Revenue</span>
        <span className={style.tooltipMetricValue}>
          {usdFormatter.format(metrics.ytdRevenue)}
        </span>

        <span className={style.tooltipMetricLabel}>Revenue Target</span>
        <span className={style.tooltipMetricValue}>
          {usdFormatter.format(metrics.revenueTarget)}
        </span>
      </div>
    </div>
  );
}

function CustomerNameCell({
  context,
  onEnter,
  onLeave,
}: {
  context: IgrCellTemplateContext;
  onEnter: EnterHandler;
  onLeave: LeaveHandler;
}) {
  const value = (context.cell.value as string | null | undefined) ?? '';
  const row = (context.cell.row?.data ?? {}) as Row;

  const handleEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    onEnter(e, row);
  };

  return (
    <span
      className={style.customerNameCell}
      onMouseEnter={handleEnter}
      onMouseLeave={onLeave}
      aria-describedby="customer-name-tooltip"
    >
      {value}
    </span>
  );
}

function salespersonTemplate(props: { dataContext: IgrCellTemplateContext }) {
  const name = (props.dataContext.cell.value as string | null | undefined) ?? '';
  const filename = SALESPERSON_IMAGES[name];
  return (
    <span className={style.salespersonCell}>
      {filename ? (
        <img
          className={style.avatar}
          src={`${FACE_URL_BASE}${filename}`}
          alt=""
          width={28}
          height={28}
          loading="lazy"
        />
      ) : (
        <span className={style.avatarFallback} aria-hidden="true">
          {getInitials(name) || '?'}
        </span>
      )}
      <span>{name}</span>
    </span>
  );
}

export default function Grid1() {
  const [data, setData] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<ThemeId>(DEFAULT_THEME_ID);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const theme = useMemo(
    () => THEMES.find((t) => t.id === themeId) ?? THEMES[0],
    [themeId],
  );
  const isAuroraOps = theme.id === 'aurora-ops';

  const handleCustomerEnter = useCallback<EnterHandler>((e, row) => {
    // Capture the DOM node before any async/state work — React reuses
    // synthetic events and may null currentTarget after the handler returns.
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const name = (row['CustomerName'] as string | undefined) ?? '';
    const city = (row['City'] as string | undefined) ?? '';
    const country = (row['Country'] as string | undefined) ?? '';
    const rowKey = `${row['OrderID'] ?? ''}|${row['CustomerID'] ?? ''}|${name}`;
    setTooltip({
      rowKey,
      rect: {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
      },
      name,
      city,
      country,
      metrics: buildCustomerMetrics(row),
    });
  }, []);

  const handleCustomerLeave = useCallback<LeaveHandler>(() => {
    setTooltip(null);
  }, []);

  // Stable cell template — handlers are referentially stable (useCallback
  // with empty deps), so the grid does not re-render its columns on hover.
  const customerNameTemplate = useMemo(
    () =>
      (props: { dataContext: IgrCellTemplateContext }) => (
        <CustomerNameCell
          context={props.dataContext}
          onEnter={handleCustomerEnter}
          onLeave={handleCustomerLeave}
        />
      ),
    [handleCustomerEnter, handleCustomerLeave],
  );

  useEffect(() => {
    const id = 'igr-grid-theme';
    let link = document.getElementById(id) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = theme.href;
  }, [theme]);

  // Hide tooltip on any scroll (use capture so internal scroll containers
  // such as the grid's virtualization wrapper also trigger this) or on
  // window resize.
  useEffect(() => {
    const hide = () => setTooltip(null);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(DATA_URL, { signal: controller.signal });
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const json = (await res.json()) as Row[];
        // Clear any open tooltip alongside the data update so the two
        // state changes are batched into a single render.
        setTooltip(null);
        setData(json);
      } catch (err) {
        if (controller.signal.aborted) return;
        setTooltip(null);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    })();

    return () => controller.abort();
  }, []);

  return (
    <div
      className={`${style.page}${isAuroraOps ? ` ${style.auroraOps}` : ''}`}
      data-theme-variant={theme.variant}
      data-theme-id={theme.id}
    >
      <div className={style.toolbar}>
        <label className={style.themeChooser} htmlFor="theme-chooser">
          <span>Theme</span>
          <select
            id="theme-chooser"
            value={themeId}
            onChange={(e) => setThemeId(e.target.value as ThemeId)}
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && (
        <div className={style.message} role="alert">
          Error loading data: {error}
        </div>
      )}
      {!error && !data && (
        <div className={style.message}>Loading data…</div>
      )}

      <IgrGrid
        className={style.grid}
        data={data ?? []}
        autoGenerate={false}
        primaryKey="OrderID"
        moving={true}
        allowFiltering={true}
        filterMode="excelStyleFilter"
        rowSelection="multiple"
        hideRowSelectors={false}
        height="100%"
        width="100%"
        rowHeight={isAuroraOps ? 72 : undefined}
        groupingExpressions={groupingExpressions}
        style={{ display: !error && data ? undefined : 'none' }}
      >
        <IgrGridToolbar>
          <IgrGridToolbarActions>
            <IgrGridToolbarPinning />
            <IgrGridToolbarHiding />
            <IgrGridToolbarExporter exportExcel={true} exportCSV={false} />
          </IgrGridToolbarActions>
        </IgrGridToolbar>
        <IgrPaginator perPage={25} />

        <IgrColumn
          field="OrderID"
          header="Order ID"
          dataType="number"
          sortable={true}
          resizable={true}
          groupable={true}
          pinned={true}
        />
        <IgrColumn
          field="CustomerName"
          header="Customer Name"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
          pinned={true}
          bodyTemplate={customerNameTemplate}
        />
        <IgrColumn
          field="ProductName"
          header="Product Name"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="UnitPrice"
          header="Unit Price"
          dataType="currency"
          pipeArgs={currencyPipeArgs}
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="Quantity"
          header="Quantity"
          dataType="number"
          sortable={true}
          resizable={true}
          groupable={true}
          bodyTemplate={quantityTemplate}
        />
        <IgrColumn
          field="Discount"
          header="Discount"
          dataType="percent"
          pipeArgs={percentPipeArgs}
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ExtendedPrice"
          header="Extended Price"
          dataType="currency"
          pipeArgs={currencyPipeArgs}
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="Freight"
          header="Freight"
          dataType="currency"
          pipeArgs={currencyPipeArgs}
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ShipName"
          header="Ship Name"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ShipAddress"
          header="Ship Address"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ShipCity"
          header="Ship City"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ShipRegion"
          header="Ship Region"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ShipPostalCode"
          header="Ship Postal Code"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ShipCountry"
          header="Ship Country"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="CustomerID"
          header="Customer ID"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="Address"
          header="Address"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="City"
          header="City"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="Region"
          header="Region"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="PostalCode"
          header="Postal Code"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="Country"
          header="Country"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="Salesperson"
          header="Salesperson"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
          pinned={true}
          pinningPosition={ColumnPinningPosition.End}
          bodyTemplate={salespersonTemplate}
          width="220px"
        />
        <IgrColumn
          field="OrderDate"
          header="Order Date"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="RequiredDate"
          header="Required Date"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ShippedDate"
          header="Shipped Date"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ShipperName"
          header="Shipper Name"
          dataType="string"
          sortable={true}
          resizable={true}
          groupable={true}
        />
        <IgrColumn
          field="ProductID"
          header="Product ID"
          dataType="number"
          sortable={true}
          resizable={true}
          groupable={true}
        />
      </IgrGrid>

      {tooltip
        ? createPortal(
            <CustomerNameTooltip key={tooltip.rowKey} state={tooltip} />,
            document.body,
          )
        : null}
    </div>
  );
}

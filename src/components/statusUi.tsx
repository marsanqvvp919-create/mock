import React from 'react';
import { OrderStatus } from '../data/clinicsData';
import { CheckCircle2, Truck, Plane, Package } from 'lucide-react';

// 画面共通の状況グループ (細かいステータスを4つにまとめて見やすくする)
export type StatusGroup = 'DELIVERED' | 'OUT_FOR_DELIVERY' | 'DOMESTIC' | 'OVERSEAS';

export interface GroupStyle {
  key: StatusGroup;
  label: string;
  hint: string;
  icon: React.ElementType;
  chip: string;
  bar: string;
  tile: string;
  tileActive: string;
}

export const GROUPS: GroupStyle[] = [
  {
    key: 'OVERSEAS',
    label: '海外輸送・通関中',
    hint: 'シンガポール〜日本の空港',
    icon: Plane,
    chip: 'bg-amber-50 text-amber-800 ring-amber-200',
    bar: 'bg-amber-400',
    tile: 'text-amber-700',
    tileActive: 'ring-2 ring-amber-400 bg-amber-50',
  },
  {
    key: 'DOMESTIC',
    label: '佐川急便 引継済',
    hint: '国内配送の準備中',
    icon: Package,
    chip: 'bg-sky-50 text-sky-800 ring-sky-200',
    bar: 'bg-sky-400',
    tile: 'text-sky-700',
    tileActive: 'ring-2 ring-sky-400 bg-sky-50',
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: '配達中',
    hint: 'クリニックへ向かっています',
    icon: Truck,
    chip: 'bg-blue-600 text-white ring-blue-600',
    bar: 'bg-blue-600',
    tile: 'text-blue-700',
    tileActive: 'ring-2 ring-blue-500 bg-blue-50',
  },
  {
    key: 'DELIVERED',
    label: '受領済',
    hint: 'クリニックに届きました',
    icon: CheckCircle2,
    chip: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
    bar: 'bg-emerald-500',
    tile: 'text-emerald-700',
    tileActive: 'ring-2 ring-emerald-500 bg-emerald-50',
  },
];

export const getGroup = (status: OrderStatus): StatusGroup => {
  switch (status) {
    case 'DELIVERED':
      return 'DELIVERED';
    case 'OUT_FOR_DELIVERY':
      return 'OUT_FOR_DELIVERY';
    case 'SAGAWA_HANDOVER':
      return 'DOMESTIC';
    default:
      return 'OVERSEAS';
  }
};

export const getGroupStyle = (status: OrderStatus): GroupStyle =>
  GROUPS.find((g) => g.key === getGroup(status))!;

// 5段階のうち何段目まで進んでいるか (0〜4)
export const STAGES = ['SG梱包', 'FedEx空輸', '通関', '佐川配送', '納品'];
export const getStageIdx = (status: OrderStatus): number => {
  switch (status) {
    case 'ORDERED':
    case 'PREPARING':
      return 0;
    case 'FEDEX_DISPATCHED':
    case 'IN_TRANSIT_INTL':
      return 1;
    case 'CUSTOMS_CLEARANCE':
      return 2;
    case 'SAGAWA_HANDOVER':
    case 'OUT_FOR_DELIVERY':
      return 3;
    case 'DELIVERED':
      return 4;
    default:
      return 0;
  }
};

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

export type FormattedDate = { md: string; wd: string; time: string } | null;

// "2026/10/06" または "2026/10/06 11:20" を { md: "10/6", wd: "火", time: "11:20" } に整形
export const formatDate = (value?: string | null): FormattedDate => {
  if (!value) return null;
  const [datePart, time] = value.split(' ');
  const [y, m, d] = datePart.split('/').map(Number);
  if (!y || !m || !d) return { md: value, wd: '', time: '' };
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return { md: `${m}/${d}`, wd, time: time || '' };
};

export const shortName = (name: string) => name.replace(/^湘南美容クリニック/, '') || name;

export const StatusChip: React.FC<{ status: OrderStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  const g = getGroupStyle(status);
  const Icon = g.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 rounded-full font-bold ring-1 ring-inset ${g.chip} ${
        size === 'md' ? 'px-3 py-1 text-sm' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Icon className={size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      {g.label}
    </span>
  );
};

export const StageBar: React.FC<{
  status: OrderStatus;
  showLabels?: boolean;
  className?: string;
}> = ({ status, showLabels = false, className = '' }) => {
  const g = getGroupStyle(status);
  const stageIdx = getStageIdx(status);
  return (
    <div className={className}>
      <div
        className={`flex ${showLabels ? 'gap-1' : 'gap-0.5'}`}
        title={STAGES.map((s, i) => (i <= stageIdx ? `✓${s}` : s)).join(' → ')}
      >
        {STAGES.map((s, i) => (
          <div
            key={s}
            className={`${showLabels ? 'h-2' : 'h-1.5'} flex-1 rounded-full ${
              i <= stageIdx ? g.bar : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      {showLabels && (
        <div className="mt-1.5 flex text-xs text-slate-400">
          {STAGES.map((s, i) => (
            <span
              key={s}
              className={`flex-1 text-center ${
                i === stageIdx ? 'text-slate-900 font-bold' : i < stageIdx ? 'text-slate-600' : ''
              }`}
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const DateCell: React.FC<{
  date: FormattedDate;
  isDelivered: boolean;
}> = ({ date, isDelivered }) => {
  if (!date) return <span className="text-sm text-slate-400">未定</span>;
  return (
    <div>
      <div className="text-[11px] text-slate-400 leading-tight">
        {isDelivered ? '受領済' : '到着予定'}
      </div>
      <div
        className={`text-lg font-bold tabular-nums leading-tight ${
          isDelivered ? 'text-slate-500' : 'text-slate-900'
        }`}
      >
        {date.md}
        <span className="text-sm font-semibold">({date.wd})</span>
        {date.time && <span className="ml-1 text-sm font-medium">{date.time}</span>}
      </div>
    </div>
  );
};

// ページ共通のカード枠
export const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <section className={`bg-white rounded-2xl border border-slate-200 shadow-xs ${className}`}>
    {children}
  </section>
);

export const SectionTitle: React.FC<{ title: string; desc?: string; right?: React.ReactNode }> = ({
  title,
  desc,
  right,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
    <div>
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {desc && <p className="text-sm text-slate-500 mt-0.5">{desc}</p>}
    </div>
    {right}
  </div>
);

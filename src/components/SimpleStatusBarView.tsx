import React, { useState, useMemo } from 'react';
import { OrderRecord, OrderStatus, CLINICS_MASTER } from '../data/clinicsData';
import { Search, CheckCircle2, Download, ArrowUp, ArrowDown, ChevronRight, X } from 'lucide-react';
import {
  GROUPS,
  STAGES,
  StatusGroup,
  getGroup,
  getStageIdx,
  formatDate,
  shortName,
  DateCell,
} from './statusUi';

interface SimpleStatusBarViewProps {
  orders: OrderRecord[];
  batchName: string;
  isCurrentBatch: boolean;
  onOpenTracking: (order: OrderRecord) => void;
  onOpenDeliverySlip: (order: OrderRecord) => void;
  onExportCsv: () => void;
  onSelectClinic: (clinicId: string) => void;
}

type SortKey = 'status' | 'clinic' | 'region' | 'date';
type SortOrder = 'asc' | 'desc';

const STATUS_ORDER: OrderStatus[] = [
  'ORDERED',
  'PREPARING',
  'FEDEX_DISPATCHED',
  'IN_TRANSIT_INTL',
  'CUSTOMS_CLEARANCE',
  'SAGAWA_HANDOVER',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
];


export const SimpleStatusBarView: React.FC<SimpleStatusBarViewProps> = ({
  orders,
  batchName,
  onOpenTracking,
  onOpenDeliverySlip,
  onExportCsv,
  onSelectClinic,
}) => {
  const [search, setSearch] = useState('');
  const [hubFilter, setHubFilter] = useState<'ALL' | 'NRT' | 'KIX'>('ALL');
  const [groupFilter, setGroupFilter] = useState<StatusGroup | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<SortKey>('status');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const groupCounts = useMemo(() => {
    const counts: Record<StatusGroup, number> = {
      DELIVERED: 0,
      OUT_FOR_DELIVERY: 0,
      DOMESTIC: 0,
      OVERSEAS: 0,
    };
    orders.forEach((o) => counts[getGroup(o.status)]++);
    return counts;
  }, [orders]);

  // 未完了の注文で最も多い到着予定日 (バッチ全体の見出しに使う)
  const mainEta = useMemo(() => {
    const tally: Record<string, number> = {};
    orders
      .filter((o) => o.status !== 'DELIVERED')
      .forEach((o) => {
        tally[o.estimatedDelivery] = (tally[o.estimatedDelivery] || 0) + 1;
      });
    const top = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
    return top ? formatDate(top[0]) : null;
  }, [orders]);

  const deliveredCount = groupCounts.DELIVERED;
  const allDone = orders.length > 0 && deliveredCount === orders.length;

  const handleSortChange = (key: SortKey) => {
    if (sortBy === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortOrder('asc');
    }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = orders.filter((o) => {
      const matchSearch =
        q === '' ||
        o.clinicName.toLowerCase().includes(q) ||
        o.doctor.toLowerCase().includes(q) ||
        o.fedexTracking.includes(q) ||
        o.sagawaTracking.includes(q) ||
        o.invoiceNo.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.region.toLowerCase().includes(q);
      const matchHub = hubFilter === 'ALL' || o.hub === hubFilter;
      const matchGroup = groupFilter === 'ALL' || getGroup(o.status) === groupFilter;
      return matchSearch && matchHub && matchGroup;
    });

    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'status':
          cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
          break;
        case 'clinic':
          cmp = a.clinicName.localeCompare(b.clinicName, 'ja');
          break;
        case 'region':
          cmp = a.region.localeCompare(b.region, 'ja');
          break;
        case 'date': {
          const dA = a.actualDelivery || a.estimatedDelivery || '';
          const dB = b.actualDelivery || b.estimatedDelivery || '';
          cmp = dA.localeCompare(dB);
          break;
        }
      }
      if (cmp === 0) cmp = a.clinicName.localeCompare(b.clinicName, 'ja');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [orders, search, hubFilter, groupFilter, sortBy, sortOrder]);

  const openClinic = (order: OrderRecord) => {
    const match = CLINICS_MASTER.find(
      (c) => c.id === order.clinicId || c.name === order.clinicName
    );
    onSelectClinic(match ? match.id : CLINICS_MASTER[0].id);
  };

  const SortHeader: React.FC<{ k: SortKey; label: string; className?: string }> = ({
    k,
    label,
    className = '',
  }) => {
    const active = sortBy === k;
    return (
      <button
        onClick={() => handleSortChange(k)}
        className={`inline-flex items-center gap-1 font-semibold cursor-pointer hover:text-slate-900 ${
          active ? 'text-slate-900' : 'text-slate-500'
        } ${className}`}
      >
        {label}
        {active &&
          (sortOrder === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          ))}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* 1. サマリー: いつ届くか + 状況ごとの件数 */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">{batchName}</p>
            {allDone ? (
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-7 h-7" />
                全{orders.length}院に納品完了
              </h2>
            ) : (
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
                {mainEta ? (
                  <>
                    <span className="text-blue-700">
                      {mainEta.md}
                      <span className="text-xl sm:text-2xl">({mainEta.wd})</span>
                    </span>{' '}
                    到着予定
                  </>
                ) : (
                  '配送状況'
                )}
              </h2>
            )}
          </div>
          <p className="text-base text-slate-600">
            <span className="text-3xl font-bold text-slate-900 tabular-nums">{deliveredCount}</span>
            <span className="text-slate-400"> / {orders.length} 院</span> 受領済
          </p>
        </div>

        {/* 状況の内訳バー */}
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          {GROUPS.map((g) =>
            groupCounts[g.key] > 0 ? (
              <div
                key={g.key}
                className={g.bar}
                style={{ width: `${(groupCounts[g.key] / Math.max(orders.length, 1)) * 100}%` }}
                title={`${g.label}: ${groupCounts[g.key]}院`}
              />
            ) : null
          )}
        </div>

        {/* 件数タイル (クリックで絞り込み) */}
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {[...GROUPS].reverse().map((g) => {
            const Icon = g.icon;
            const active = groupFilter === g.key;
            const count = groupCounts[g.key];
            return (
              <button
                key={g.key}
                onClick={() => setGroupFilter(active ? 'ALL' : g.key)}
                disabled={count === 0}
                className={`text-left rounded-xl border border-slate-200 px-4 py-3 transition cursor-pointer disabled:cursor-default disabled:opacity-50 ${
                  active ? g.tileActive : 'hover:bg-slate-50'
                }`}
              >
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${g.tile}`}>
                  <Icon className="w-4 h-4" />
                  {g.label}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">{count}</span>
                  <span className="text-sm text-slate-500">院</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5 hidden sm:block">{g.hint}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. 検索・絞り込み */}
      <section className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="クリニック名で検索(例: 梅田、札幌)"
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder:text-slate-400"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-sm">
            {(
              [
                ['ALL', 'すべて'],
                ['NRT', '東日本'],
                ['KIX', '西日本'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setHubFilter(key)}
                className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                  hubFilter === key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onExportCsv}
            className="px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 border border-slate-300 cursor-pointer text-sm"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </section>

      {(groupFilter !== 'ALL' || search) && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>
            <span className="font-bold text-slate-900">{rows.length}</span> 件を表示中
          </span>
          <button
            onClick={() => {
              setGroupFilter('ALL');
              setSearch('');
            }}
            className="inline-flex items-center gap-1 text-blue-700 hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            絞り込みを解除
          </button>
        </div>
      )}

      {/* 3. クリニック一覧 */}
      <section className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* 列見出し (PCのみ) */}
        <div className="hidden md:grid grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs">
          <SortHeader k="clinic" label="クリニック" />
          <SortHeader k="status" label="配送状況" />
          <SortHeader k="date" label="到着予定 / 受領日時" />
          <span className="w-[120px]" />
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            該当するクリニックがありません。
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((order) => {
              const group = GROUPS.find((g) => g.key === getGroup(order.status))!;
              const stageIdx = getStageIdx(order.status);
              const isDelivered = order.status === 'DELIVERED';
              const date = formatDate(isDelivered ? order.actualDelivery : order.estimatedDelivery);
              const Icon = group.icon;

              return (
                <li
                  key={order.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-x-4 gap-y-2 items-center px-4 sm:px-5 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  {/* クリニック */}
                  <div className="min-w-0">
                    <button
                      onClick={() => openClinic(order)}
                      className="text-left text-base font-bold text-slate-900 hover:text-blue-700 hover:underline cursor-pointer truncate max-w-full"
                      title={`${order.clinicName}の詳細ページへ`}
                    >
                      {shortName(order.clinicName)}
                    </button>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {order.region} ・ {order.totalQty}箱
                    </div>
                  </div>

                  {/* 到着日 (スマホでは右上に表示) */}
                  <div className="text-right md:hidden">
                    <DateCell date={date} isDelivered={isDelivered} />
                  </div>

                  {/* 配送状況 */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${group.chip}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {group.label}
                    </span>
                    <div
                      className="hidden sm:flex flex-1 min-w-[80px] max-w-[200px] gap-0.5"
                      title={STAGES.map((s, i) => (i <= stageIdx ? `✓${s}` : s)).join(' → ')}
                    >
                      {STAGES.map((s, i) => (
                        <div
                          key={s}
                          className={`h-1.5 flex-1 rounded-full ${
                            i <= stageIdx ? group.bar : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 到着日 (PC) */}
                  <div className="hidden md:block">
                    <DateCell date={date} isDelivered={isDelivered} />
                  </div>

                  {/* 操作 */}
                  <div className="flex items-center justify-end gap-1 md:w-[120px]">
                    <button
                      onClick={() => onOpenDeliverySlip(order)}
                      className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg text-xs cursor-pointer"
                    >
                      伝票
                    </button>
                    <button
                      onClick={() => onOpenTracking(order)}
                      className="pl-3 pr-2 py-1.5 bg-white hover:bg-blue-50 text-blue-700 font-semibold rounded-lg text-xs border border-blue-200 cursor-pointer inline-flex items-center"
                    >
                      追跡
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};


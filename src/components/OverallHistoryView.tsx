import React, { useState, useMemo } from 'react';
import {
  OrderRecord,
  CLINICS_MASTER,
  BATCHES_LIST
} from '../data/clinicsData';
import {
  Package,
  Layers,
  Building2,
  Search,
  Download,
  ChevronRight,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import { Card, SectionTitle, shortName } from './statusUi';

interface OverallHistoryViewProps {
  batchOrdersMap: Record<string, OrderRecord[]>;
  onSelectClinic: (clinicId: string) => void;
  onSelectBatch?: (batchId: string) => void;
}

export const OverallHistoryView: React.FC<OverallHistoryViewProps> = ({
  batchOrdersMap,
  onSelectClinic,
  onSelectBatch,
}) => {
  const [search, setSearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // Flatten all orders across all batches
  const allOrdersList = useMemo(() => {
    const list: OrderRecord[] = [];
    Object.values(batchOrdersMap).forEach((orders) => {
      list.push(...orders);
    });
    return list;
  }, [batchOrdersMap]);

  // Grand totals
  const totalBatchesCount = BATCHES_LIST.length;
  const grandTotalOrdersCount = allOrdersList.length;
  const grandTotalUnits = allOrdersList.reduce((acc, o) => acc + (o.totalQty || 0), 0);

  // Aggregate per clinic across all history
  const clinicHistorySummary = useMemo(() => {
    const map = new Map<string, { clinicId: string; clinicName: string; region: string; totalUnits: number; orderCount: number; lastOrderDate: string }>();

    allOrdersList.forEach((o) => {
      const master = CLINICS_MASTER.find((c) => c.id === o.clinicId || c.name === o.clinicName);
      const cId = master ? master.id : o.clinicId;
      const cName = o.clinicName;
      const region = o.region || (master ? master.region : 'その他');

      if (!map.has(cId)) {
        map.set(cId, {
          clinicId: cId,
          clinicName: cName,
          region,
          totalUnits: 0,
          orderCount: 0,
          lastOrderDate: o.orderDate,
        });
      }
      const entry = map.get(cId)!;
      entry.totalUnits += o.totalQty || 0;
      entry.orderCount += 1;
      if (o.orderDate > entry.lastOrderDate) {
        entry.lastOrderDate = o.orderDate;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.totalUnits - a.totalUnits);
  }, [allOrdersList]);

  const maxClinicUnits = clinicHistorySummary[0]?.totalUnits || 1;

  // Filtered clinic summary (keeps overall rank)
  const filteredClinicSummary = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clinicHistorySummary
      .map((item, idx) => ({ ...item, rank: idx + 1 }))
      .filter((item) => {
        const matchSearch =
          q === '' ||
          item.clinicName.toLowerCase().includes(q) ||
          item.region.toLowerCase().includes(q);
        const matchRegion = selectedRegion === 'ALL' || item.region === selectedRegion;
        return matchSearch && matchRegion;
      });
  }, [clinicHistorySummary, search, selectedRegion]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    CLINICS_MASTER.forEach((c) => set.add(c.region));
    return Array.from(set);
  }, []);

  // Export CSV handler for overall history
  const handleExportOverallCsv = () => {
    const headers = ['クリニックID', 'クリニック名', 'エリア', '累計発注回数', '累計発注数量(箱)', '最終発注日'];
    const rows = clinicHistorySummary.map((item) => [
      `"${item.clinicId}"`,
      `"${item.clinicName}"`,
      `"${item.region}"`,
      item.orderCount,
      item.totalUnits,
      `"${item.lastOrderDate}"`,
    ]);

    const csvContent = '﻿' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SBC_美容医療薬剤_全体累計発注数量_履歴_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats = [
    { icon: Package, label: '累計発注数量', value: grandTotalUnits.toLocaleString(), unit: '箱', tone: 'text-blue-700' },
    { icon: Layers, label: '発注便', value: totalBatchesCount, unit: '便', tone: 'text-slate-700' },
    { icon: Truck, label: '延べ配送件数', value: grandTotalOrdersCount.toLocaleString(), unit: '件', tone: 'text-slate-700' },
    { icon: Building2, label: '登録クリニック', value: CLINICS_MASTER.length, unit: '院', tone: 'text-slate-700' },
  ];

  return (
    <div className="space-y-4">
      {/* 1. サマリー */}
      <Card className="p-5 sm:p-6">
        <p className="text-sm font-medium text-slate-500">全期間の実績</p>
        <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
          累計 <span className="text-blue-700 tabular-nums">{grandTotalUnits.toLocaleString()}</span> 箱を発注
        </h2>
        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 px-4 py-3">
                <div className={`flex items-center gap-1.5 text-sm font-semibold ${s.tone}`}>
                  <Icon className="w-4 h-4" />
                  {s.label}
                </div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</span>
                  <span className="text-sm text-slate-500">{s.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. 月別の発注便 */}
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6 pb-3 sm:pb-3">
          <SectionTitle title="月別の発注便" desc="行を押すと、その便の明細を表示します" />
        </div>
        <div className="hidden md:grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_auto] gap-4 px-6 py-2.5 bg-slate-50 border-y border-slate-200 text-xs font-semibold text-slate-500">
          <span>発注便</span>
          <span>配送状況</span>
          <span className="text-right">発注数量</span>
          <span className="w-[72px]" />
        </div>
        <ul className="divide-y divide-slate-100 border-t border-slate-100 md:border-t-0">
          {BATCHES_LIST.map((batch) => {
            const batchOrders = batchOrdersMap[batch.id] || [];
            const bUnits = batchOrders.reduce((acc, o) => acc + o.totalQty, 0);
            const bDelivered = batchOrders.filter((o) => o.status === 'DELIVERED').length;
            const done = batchOrders.length > 0 && bDelivered === batchOrders.length;
            const pct = batchOrders.length ? (bDelivered / batchOrders.length) * 100 : 0;

            return (
              <li key={batch.id}>
                <button
                  onClick={() => onSelectBatch && onSelectBatch(batch.id)}
                  className="w-full text-left grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.6fr)_minmax(0,0.8fr)_auto] gap-x-4 gap-y-2 items-center px-4 sm:px-6 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                      {batch.name}
                      {batch.isCurrent && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                          最新
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{batch.orderDate} 発注</div>
                  </div>

                  <div className="text-right md:hidden">
                    <span className="text-lg font-bold text-slate-900 tabular-nums">{bUnits}</span>
                    <span className="text-sm text-slate-500"> 箱</span>
                  </div>

                  <div className="col-span-2 md:col-span-1 flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex items-center gap-1 shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${
                        done
                          ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                          : 'bg-blue-600 text-white ring-blue-600'
                      }`}
                    >
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                      {done ? '全院受領済' : '配送中'}
                    </span>
                    <div className="flex-1 max-w-[200px] h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${done ? 'bg-emerald-500' : 'bg-blue-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums shrink-0">
                      {bDelivered}/{batchOrders.length}院
                    </span>
                  </div>

                  <div className="hidden md:block text-right">
                    <span className="text-lg font-bold text-slate-900 tabular-nums">{bUnits}</span>
                    <span className="text-sm text-slate-500"> 箱</span>
                  </div>

                  <span className="hidden md:inline-flex w-[72px] justify-end items-center text-xs font-semibold text-blue-700">
                    明細
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      {/* 3. クリニック別 累計 */}
      <div className="pt-2">
        <SectionTitle title="クリニック別の累計発注数量" desc="クリニック名を押すと、その院のページへ移動します" />
      </div>

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
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-white text-slate-800 text-sm font-semibold rounded-xl px-3 py-2.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">すべてのエリア</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button
            onClick={handleExportOverallCsv}
            className="px-3 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 border border-slate-300 cursor-pointer text-sm"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="hidden md:grid grid-cols-[48px_minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1.6fr)] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500">
          <span className="text-center">順位</span>
          <span>クリニック</span>
          <span className="text-right">発注回数</span>
          <span>累計発注数量</span>
        </div>
        {filteredClinicSummary.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">該当するクリニックがありません。</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredClinicSummary.map((item) => (
              <li
                key={item.clinicId}
                className="grid grid-cols-[36px_minmax(0,1fr)_auto] md:grid-cols-[48px_minmax(0,1.6fr)_minmax(0,0.8fr)_minmax(0,1.6fr)] gap-x-3 md:gap-x-4 items-center px-4 sm:px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <span
                  className={`text-center text-sm font-bold tabular-nums ${
                    item.rank <= 3 ? 'text-blue-700' : 'text-slate-400'
                  }`}
                >
                  {item.rank}
                </span>
                <div className="min-w-0">
                  <button
                    onClick={() => onSelectClinic(item.clinicId)}
                    className="text-left text-base font-bold text-slate-900 hover:text-blue-700 hover:underline cursor-pointer truncate max-w-full"
                    title={`${item.clinicName}のページへ`}
                  >
                    {shortName(item.clinicName)}
                  </button>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {item.region}
                    <span className="md:hidden"> ・ {item.orderCount}回</span>
                  </div>
                </div>
                <span className="hidden md:block text-right text-sm text-slate-600 tabular-nums">
                  {item.orderCount} 回
                </span>
                <div className="flex items-center gap-3 justify-end md:justify-start">
                  <div className="hidden sm:block flex-1 max-w-[200px] h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${(item.totalUnits / maxClinicUnits) * 100}%` }}
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-900 tabular-nums shrink-0">
                    {item.totalUnits}
                    <span className="text-sm font-medium text-slate-500"> 箱</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};

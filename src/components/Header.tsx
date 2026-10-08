import React from 'react';
import {
  Truck,
  Building2,
  RefreshCw,
  Layers,
  Hospital,
  BarChart3
} from 'lucide-react';
import { BatchInfo } from '../data/clinicsData';

interface HeaderProps {
  batches: BatchInfo[];
  selectedBatchId: string;
  onSelectBatch: (batchId: string) => void;
  viewMode: 'hq' | 'clinic' | 'overall_history';
  onChangeViewMode: (mode: 'hq' | 'clinic' | 'overall_history') => void;
  selectedClinicId: string;
  onSelectClinicId: (clinicId: string) => void;
  allClinics: { id: string; name: string }[];
  lastUpdated: string;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  batches,
  selectedBatchId,
  onSelectBatch,
  viewMode,
  onChangeViewMode,
  selectedClinicId,
  onSelectClinicId,
  allClinics,
  lastUpdated,
  onRefresh,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-950 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Title & Organization Info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white shadow-xs shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-200 border border-blue-400/40">
                  SBC メディカルグループ様
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  商品: 美容医療薬剤
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                配送・受注ステータス管理システム
              </h1>
            </div>
          </div>

          {/* Controls: Batch Selector & View Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Batch Selector */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <span className="text-xs text-slate-300 px-2 font-medium flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                発注便:
              </span>
              <select
                value={selectedBatchId}
                onChange={(e) => onSelectBatch(e.target.value)}
                className="bg-white text-slate-800 text-xs sm:text-sm font-semibold rounded-md px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-2xs"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isCurrent ? '★最新進行中' : '（過去配送済）'}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Tabs */}
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => onChangeViewMode('hq')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'hq'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                クリニック全体
              </button>
              <button
                onClick={() => onChangeViewMode('clinic')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'clinic'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Hospital className="w-3.5 h-3.5" />
                クリニック個別
              </button>
              <button
                onClick={() => onChangeViewMode('overall_history')}
                className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'overall_history'
                    ? 'bg-blue-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                全体発注数量・履歴
              </button>
            </div>

            {/* Refresh & Last Updated */}
            <div className="flex items-center gap-1.5 ml-1 text-slate-400 text-xs">
              <span className="hidden xl:inline text-[11px] text-slate-400">
                更新: {lastUpdated}
              </span>
              <button
                onClick={onRefresh}
                title="データを再読み込み"
                className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Clinic Selector banner if clinic view mode */}
        {viewMode === 'clinic' && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 font-medium">
              <Hospital className="w-4 h-4 text-blue-300" />
              <span className="font-bold">閲覧クリニック:</span>
              <select
                value={selectedClinicId}
                onChange={(e) => onSelectClinicId(e.target.value)}
                className="bg-white text-slate-800 text-xs sm:text-sm font-semibold rounded-md px-3 py-1.5 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-xs sm:max-w-md shadow-2xs cursor-pointer"
              >
                {allClinics.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-400">
              自院宛の到着予定・佐川急便送り状・納品伝票を確認できます
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

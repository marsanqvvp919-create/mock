/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  BATCHES_LIST,
  CLINICS_MASTER,
  ALL_ORDERS,
  OrderRecord,
  OrderStatus,
  STATUS_STEPS
} from './data/clinicsData';
import { Header } from './components/Header';
import { SimpleStatusBarView } from './components/SimpleStatusBarView';
import { TrackingTimelineModal } from './components/TrackingTimelineModal';
import { DeliverySlipModal } from './components/DeliverySlipModal';
import { ClinicPortalView } from './components/ClinicPortalView';
import { OverallHistoryView } from './components/OverallHistoryView';
import { BatchDetailsModal } from './components/BatchDetailsModal';

export default function App() {
  const [selectedBatchId, setSelectedBatchId] = useState<string>('2026-10');
  const [viewMode, setViewMode] = useState<'hq' | 'clinic' | 'overall_history'>('hq');
  const [selectedClinicId, setSelectedClinicId] = useState<string>(CLINICS_MASTER[0]?.id || 'CLN-001');

  // Dynamic batch orders state (allows in-memory status advance simulation)
  const [batchOrdersMap, setBatchOrdersMap] = useState<Record<string, OrderRecord[]>>(ALL_ORDERS);

  // Modals state
  const [trackingOrder, setTrackingOrder] = useState<OrderRecord | null>(null);
  const [deliverySlipOrder, setDeliverySlipOrder] = useState<OrderRecord | null>(null);
  const [selectedBatchDetailId, setSelectedBatchDetailId] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const currentBatch = useMemo(() => {
    return BATCHES_LIST.find((b) => b.id === selectedBatchId) || BATCHES_LIST[0];
  }, [selectedBatchId]);

  const currentBatchOrders = useMemo(() => {
    return batchOrdersMap[selectedBatchId] || [];
  }, [batchOrdersMap, selectedBatchId]);

  // Clinic Portal specific data
  const selectedClinic = useMemo(() => {
    return CLINICS_MASTER.find((c) => c.id === selectedClinicId) || CLINICS_MASTER[0];
  }, [selectedClinicId]);

  const selectedClinicOrders = useMemo(() => {
    const list: OrderRecord[] = [];
    Object.values(batchOrdersMap).forEach((batchList) => {
      const found = batchList.find(
        (o) => o.clinicId === selectedClinic.id || o.clinicName === selectedClinic.name
      );
      if (found) list.push(found);
    });
    return list;
  }, [batchOrdersMap, selectedClinic]);

  // CSV Export handler
  const handleExportCsv = useCallback(() => {
    const headers = [
      '管理番号',
      'インボイス番号',
      '発注便',
      '発注日',
      'クリニック名',
      '院長名',
      '郵便番号',
      '住所',
      '電話番号',
      '入港空港',
      'ステータス',
      'FedEx追跡番号',
      '佐川急便追跡番号',
      '総数量',
      '到着予定/完了日'
    ];

    const rows = currentBatchOrders.map((o) => {
      const step = STATUS_STEPS.find((s) => s.key === o.status)?.label || o.status;
      return [
        `"${o.id}"`,
        `"${o.invoiceNo}"`,
        `"${o.batchName}"`,
        `"${o.orderDate}"`,
        `"${o.clinicName}"`,
        `"${o.doctor}"`,
        `"${o.zip}"`,
        `"${o.address}"`,
        `"${o.tel}"`,
        `"${o.hub}"`,
        `"${step}"`,
        `"${o.fedexTracking}"`,
        `"${o.sagawaTracking}"`,
        o.totalQty,
        `"${o.actualDelivery || o.estimatedDelivery}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SBC_配送状況一括_${currentBatch.id}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentBatchOrders, currentBatch]);

  const handleRefresh = useCallback(() => {
    setLastUpdated(
      new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <Header
        batches={BATCHES_LIST}
        selectedBatchId={selectedBatchId}
        onSelectBatch={(batchId) => {
          setSelectedBatchId(batchId);
        }}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        selectedClinicId={selectedClinicId}
        onSelectClinicId={setSelectedClinicId}
        allClinics={CLINICS_MASTER.map((c) => ({ id: c.id, name: c.name }))}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {viewMode === 'hq' && (
          <SimpleStatusBarView
            orders={currentBatchOrders}
            batchName={currentBatch.name}
            isCurrentBatch={currentBatch.isCurrent}
            onOpenTracking={(ord) => setTrackingOrder(ord)}
            onOpenDeliverySlip={(ord) => setDeliverySlipOrder(ord)}
            onExportCsv={handleExportCsv}
            onSelectClinic={(cId) => {
              setSelectedClinicId(cId);
              setViewMode('clinic');
            }}
          />
        )}

        {viewMode === 'clinic' && (
          <ClinicPortalView
            clinic={selectedClinic}
            clinicOrders={selectedClinicOrders}
            onOpenTracking={(ord) => setTrackingOrder(ord)}
            onOpenDeliverySlip={(ord) => setDeliverySlipOrder(ord)}
          />
        )}

        {viewMode === 'overall_history' && (
          <OverallHistoryView
            batchOrdersMap={batchOrdersMap}
            onSelectClinic={(cId) => {
              setSelectedClinicId(cId);
              setViewMode('clinic');
            }}
            onSelectBatch={(bId) => {
              setSelectedBatchDetailId(bId);
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">湘南美容クリニック 配送・受注ステータス管理システム</span>
            <span>•</span>
            <span>シンガポール医薬品供給ハブ ➔ FedEx国際空輸 ➔ 佐川急便</span>
          </div>
          <div className="text-slate-400">
            美容医療薬剤 一括調達・全国各クリニック個別配送管理
          </div>
        </div>
      </footer>

      {/* Modals */}
      {trackingOrder && (
        <TrackingTimelineModal
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}

      {deliverySlipOrder && (
        <DeliverySlipModal
          order={deliverySlipOrder}
          onClose={() => setDeliverySlipOrder(null)}
        />
      )}

      {selectedBatchDetailId && (
        <BatchDetailsModal
          batchId={selectedBatchDetailId}
          orders={batchOrdersMap[selectedBatchDetailId] || []}
          onClose={() => setSelectedBatchDetailId(null)}
          onOpenTracking={(ord) => setTrackingOrder(ord)}
          onOpenDeliverySlip={(ord) => setDeliverySlipOrder(ord)}
          onSelectClinic={(cId) => {
            setSelectedClinicId(cId);
            setViewMode('clinic');
          }}
        />
      )}
    </div>
  );
}

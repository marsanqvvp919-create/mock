import React from 'react';
import {
  Clinic,
  OrderRecord,
  getFedexTrackingUrl,
  getSagawaTrackingUrl
} from '../data/clinicsData';
import {
  MapPin,
  Phone,
  User,
  Plane,
  Truck,
  FileText,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Package,
} from 'lucide-react';
import {
  Card,
  SectionTitle,
  StatusChip,
  StageBar,
  DateCell,
  formatDate,
} from './statusUi';

interface ClinicPortalViewProps {
  clinic: Clinic;
  clinicOrders: OrderRecord[];
  onOpenTracking: (order: OrderRecord) => void;
  onOpenDeliverySlip: (order: OrderRecord) => void;
}

export const ClinicPortalView: React.FC<ClinicPortalViewProps> = ({
  clinic,
  clinicOrders,
  onOpenTracking,
  onOpenDeliverySlip,
}) => {
  // 新しい発注便から順に並べ、先頭を「最新の発注便」として扱う
  const sortedOrders = [...clinicOrders].sort((a, b) => b.batchId.localeCompare(a.batchId));
  const currentOrder = sortedOrders[0];
  const pastOrders = sortedOrders.slice(1);

  const isDelivered = currentOrder?.status === 'DELIVERED';
  const heroDate = currentOrder
    ? formatDate(isDelivered ? currentOrder.actualDelivery : currentOrder.estimatedDelivery)
    : null;

  return (
    <div className="space-y-4">
      {/* 1. 最新の発注便: いつ届くか */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span className="font-medium">{clinic.region}</span>
          <span className="text-slate-300">|</span>
          <span>{clinic.hub === 'NRT' ? '成田経由(東日本)' : '関西経由(西日本)'}</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{clinic.name}</h1>

        {currentOrder ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {currentOrder.batchName}の配送状況
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  {heroDate && (
                    <span
                      className={`text-2xl sm:text-3xl font-bold tabular-nums ${
                        isDelivered ? 'text-emerald-700' : 'text-blue-700'
                      }`}
                    >
                      {heroDate.md}
                      <span className="text-xl sm:text-2xl">({heroDate.wd})</span>
                      {heroDate.time && (
                        <span className="ml-1 text-xl sm:text-2xl">{heroDate.time}</span>
                      )}
                    </span>
                  )}
                  <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {isDelivered ? '受領済' : '到着予定'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusChip status={currentOrder.status} size="md" />
              </div>
            </div>

            <StageBar status={currentOrder.status} showLabels className="mt-5" />

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={() => onOpenDeliverySlip(currentOrder)}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-sm border border-slate-300 cursor-pointer inline-flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                納品伝票
              </button>
              <button
                onClick={() => onOpenTracking(currentOrder)}
                className="pl-4 pr-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm cursor-pointer inline-flex items-center gap-1"
              >
                配送の経過を見る
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">現在、配送中の発注はありません。</p>
        )}
      </Card>

      {currentOrder && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 2. お届け内容 */}
          <Card className="p-5 sm:p-6">
            <SectionTitle
              title="お届け内容"
              right={
                <span className="text-sm text-slate-500">
                  合計 <span className="text-lg font-bold text-slate-900">{currentOrder.totalQty}</span> 箱
                </span>
              }
            />
            <ul className="mt-3 divide-y divide-slate-100">
              {currentOrder.items.map((item, idx) => (
                <li key={idx} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2 text-base font-medium text-slate-800">
                    <Package className="w-4 h-4 text-slate-400" />
                    {item.name}
                  </span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">
                    {item.qty}
                    <span className="ml-0.5 text-sm font-medium text-slate-500">{item.unit}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 text-xs text-slate-400">
              インボイス番号: <span className="font-mono">{currentOrder.invoiceNo}</span>
            </div>
          </Card>

          {/* 3. 追跡番号 */}
          <Card className="p-5 sm:p-6">
            <SectionTitle title="追跡番号" desc="配送会社のサイトで詳しい位置を確認できます" />
            <ul className="mt-3 divide-y divide-slate-100">
              {[
                {
                  icon: Plane,
                  label: 'FedEx(シンガポール→日本)',
                  no: currentOrder.fedexTracking,
                  url: getFedexTrackingUrl(currentOrder.fedexTracking),
                },
                {
                  icon: Truck,
                  label: `佐川急便(${currentOrder.hubName}→クリニック)`,
                  no: currentOrder.sagawaTracking,
                  url: getSagawaTrackingUrl(currentOrder.sagawaTracking),
                },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <li key={t.label} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Icon className="w-3.5 h-3.5" />
                        {t.label}
                      </div>
                      <div className="mt-0.5 text-lg font-bold font-mono text-slate-900 tracking-wide">
                        {t.no}
                      </div>
                    </div>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 text-sm font-semibold text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 inline-flex items-center gap-1"
                    >
                      追跡
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 4. クリニック情報 */}
        <Card className="p-5 sm:p-6">
          <SectionTitle title="お届け先" />
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />院長
              </dt>
              <dd className="font-medium text-slate-900">{clinic.doctor || '—'} 先生</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-slate-500 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />電話
              </dt>
              <dd className="font-mono text-slate-900">{clinic.tel}</dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-16 shrink-0 text-slate-500 flex items-start gap-1 pt-0.5">
                <MapPin className="w-3.5 h-3.5 mt-0.5" />住所
              </dt>
              <dd className="text-slate-900 leading-relaxed">
                〒{clinic.zip}
                <br />
                {clinic.address}
              </dd>
            </div>
          </dl>
        </Card>

        {/* 5. 荷受時の確認事項 */}
        <Card className="p-5 sm:p-6 bg-amber-50/40 border-amber-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            荷物を受け取ったら
          </h2>
          <ol className="mt-3 space-y-2.5 text-sm text-slate-700 leading-relaxed">
            <li className="flex gap-2.5">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">1</span>
              外箱を開け、数量とバイアルの破損がないか確認し、すぐに所定の保管場所へ収納してください。
            </li>
            <li className="flex gap-2.5">
              <span className="shrink-0 w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">2</span>
              確認後、佐川急便の端末と納品伝票に受領印を押してください。
            </li>
          </ol>
        </Card>
      </div>

      {/* 6. これまでの発注 */}
      <Card className="overflow-hidden">
        <div className="p-5 sm:p-6 pb-3 sm:pb-3">
          <SectionTitle title="これまでの発注" desc="過去の納品伝票の確認・再印刷ができます" />
        </div>
        {pastOrders.length === 0 ? (
          <div className="px-6 pb-8 text-sm text-slate-500">過去の発注はありません。</div>
        ) : (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {pastOrders.map((ord) => {
              const delivered = ord.status === 'DELIVERED';
              return (
                <li
                  key={ord.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)_minmax(0,1fr)_auto] gap-x-4 gap-y-2 items-center px-4 sm:px-6 py-3.5 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-base font-bold text-slate-900">{ord.batchName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {ord.totalQty}箱 ・ <span className="font-mono">{ord.invoiceNo}</span>
                    </div>
                  </div>
                  <div className="text-right md:hidden">
                    <DateCell
                      date={formatDate(delivered ? ord.actualDelivery : ord.estimatedDelivery)}
                      isDelivered={delivered}
                    />
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusChip status={ord.status} />
                    <StageBar
                      status={ord.status}
                      className="hidden sm:block flex-1 min-w-[80px] max-w-[200px]"
                    />
                  </div>
                  <div className="hidden md:block">
                    <DateCell
                      date={formatDate(delivered ? ord.actualDelivery : ord.estimatedDelivery)}
                      isDelivered={delivered}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-1 md:w-[120px]">
                    <button
                      onClick={() => onOpenDeliverySlip(ord)}
                      className="px-2.5 py-1.5 text-slate-600 hover:bg-slate-100 font-medium rounded-lg text-xs cursor-pointer"
                    >
                      伝票
                    </button>
                    <button
                      onClick={() => onOpenTracking(ord)}
                      className="pl-3 pr-2 py-1.5 bg-white hover:bg-blue-50 text-blue-700 font-semibold rounded-lg text-xs border border-blue-200 cursor-pointer inline-flex items-center"
                    >
                      詳細
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
};


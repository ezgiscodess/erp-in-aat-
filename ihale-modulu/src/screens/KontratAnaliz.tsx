import { clauses, contractRisks, project } from '../data/mock'
import type { BidRisk } from '../data/types'
import { Kpi } from '../components/ui'
import { RiskRegister } from '../components/RiskRegister'
import type { RiskSource } from '../components/RiskRegister'
import { moneyShort } from '../lib/format'

const CONTRACT_DOC = 'Sozlesme Tasarisi (Ozel Sartlar).pdf'

/** Riskin bağlı olduğu sözleşme maddesi — Kaynak panelinde maddenin asıl metni boyanır. */
function source(r: BidRisk): RiskSource {
  const c = clauses.find((x) => x.id === r.clauseId)
  if (!c) return { doc: CONTRACT_DOC, page: 1, pages: 126, body: r.description }
  return { doc: CONTRACT_DOC, page: c.page, pages: 126, clause: c.clause, body: c.quote }
}

/**
 * Kontratsal riskler — Teklif Riskleri ile aynı yapı.
 * Teklif riskleri teklif hazırlanırken fiyata yansıtılır (ör. işin uzaması);
 * kontrat riskleri iş yürürken uzun dönemde ortaya çıkar (hak talebi, fiyat farkı talebi,
 * bildirim süreleri, teminat, fesih).
 */
export function KontratAnaliz({ writable, role }: { writable: boolean; role: string }) {
  const high = contractRisks.filter((r) => r.probability * r.impact >= 16).length
  const timeBars = contractRisks.filter((r) => r.timeBar)

  return (
    <RiskRegister
      title="Kontrat Analiz"
      note="Kontratsal riskler: iş boyunca, uzun dönemde ortaya çıkan riskler (hak talebi, fiyat farkı talebi, ödeme, bildirim süreleri, teminat, fesih). Teklif riskleriyle aynı yapıda tutulur; her risk bir sözleşme maddesine bağlıdır ve maddenin asıl metni sağdaki Kaynak panelinde açılır."
      risks={contractRisks}
      writable={writable}
      role={role}
      source={source}
      kpis={({ worst, expected, provision }) => <>
        <Kpi label="Kontrat riski" value={contractRisks.length} sub={`${contractRisks.filter((r) => r.state === 'Açık').length} açık`} />
        <Kpi label="Yüksek risk" value={high} sub="Olasılık × etki ≥ 16" tone="crit" />
        <Kpi label="Bildirim süresi" value={`${timeBars.length} risk`} sub="En kısası 48 saat" tone="warn"
          help="Süresi kaçırılırsa hakkın tamamen düştüğü bildirim yükümlülükleri (time-bar). Proje döneminde otomatik geri sayıma bağlanır." />
        <Kpi label="En kötü senaryo" value={moneyShort(worst, project.currency)} sub="Hepsi aynı anda gerçekleşirse" tone="warn" />
        <Kpi label="Beklenen bedel" value={moneyShort(expected, project.currency)} sub="Olasılıkla ağırlıklı" tone="neutral"
          help="Her riskin tutarı gerçekleşme olasılığıyla çarpılıp toplanır (1/5 → %10 … 5/5 → %90)." />
        <Kpi label="Teklife eklenen karşılık" value={moneyShort(provision, project.currency)} sub="Kontrat dönemi için" tone="accent"
          help="Kontrat riskleri için teklif fiyatına eklenen tutar. Çoğu kontrat riski karşılıkla değil, bildirim ve kayıt disipliniyle yönetilir." />
      </>}
    />
  )
}

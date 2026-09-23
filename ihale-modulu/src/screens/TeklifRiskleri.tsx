import { bidRisks, docs, project } from '../data/mock'
import type { BidRisk } from '../data/types'
import { Kpi } from '../components/ui'
import { RiskRegister } from '../components/RiskRegister'
import type { RiskSource } from '../components/RiskRegister'
import { moneyShort, pct } from '../lib/format'

/** Riskin dayandığı doküman — kategoriye göre ilgili şartname açılır. */
function source(r: BidRisk): RiskSource {
  const doc = docs.find((d) => d.name.startsWith(
    r.category === 'Sözleşmesel' ? 'Sozlesme' : r.category === 'Zemin' ? 'Zemin' : r.category === 'Program' ? 'Teknik' : 'Idari',
  )) ?? docs[0]
  return {
    doc: doc.name,
    page: r.category === 'Sözleşmesel' ? 63 : r.category === 'Zemin' ? 23 : 41,
    pages: doc.pages,
    body: r.description,
  }
}

/**
 * Teklif riskleri: teklif hazırlanırken fiyata yansıtılacak riskler
 * (işin uzaması, kazık boyu, tedarik süresi…). Kontrat dönemi riskleri Kontrat Analiz sekmesindedir.
 */
export function TeklifRiskleri({ writable, role }: { writable: boolean; role: string }) {
  const maxTime = Math.max(...bidRisks.map((r) => r.timeImpact))
  const high = bidRisks.filter((r) => r.probability * r.impact >= 16).length

  return (
    <RiskRegister
      title="Teklif Riskleri"
      note="Teklif hazırlanırken dikkate alınacak riskler. Her risk üç sayıyla tutulur: gerçekleşirse oluşacak tutar (en kötü senaryo), bu tutarın açık hesabı ve teklife gerçekten eklenen karşılık. Karşılık otomatik gelmez; satır satır karar verilir ve gerekçesiyle kaydedilir."
      risks={bidRisks}
      writable={writable}
      role={role}
      source={source}
      kpis={({ worst, expected, provision }) => <>
        <Kpi label="Toplam risk" value={bidRisks.length} sub={`${bidRisks.filter((r) => r.state === 'Açık').length} açık`} />
        <Kpi label="Yüksek risk" value={high} sub="Olasılık × etki ≥ 16" tone="crit" />
        <Kpi label="En yüksek süre etkisi" value={`${maxTime} gün`} sub="Kazık tedariki (R7)" tone="warn"
          help="Risklerin programa etkisi. Kritik yoldaki bir işi öteliyorsa doğrudan gecikme cezası riskine dönüşür." />
        <Kpi label="En kötü senaryo" value={moneyShort(worst, project.currency)} sub="Hepsi aynı anda gerçekleşirse" tone="warn"
          help="Bütün risklerin tam tutarıyla gerçekleşmesi hâli. Teklife bu tutar eklenmez; yalnızca üst sınırı gösterir." />
        <Kpi label="Beklenen bedel" value={moneyShort(expected, project.currency)} sub="Olasılıkla ağırlıklı" tone="neutral"
          help="Her riskin tutarı gerçekleşme olasılığıyla çarpılıp toplanır (1/5 → %10 … 5/5 → %90). Karşılığın makul aralığını gösterir, kendiliğinden uygulanmaz." />
        <Kpi label="Teklife eklenen karşılık" value={moneyShort(provision, project.currency)}
          sub={`Beklenenin ${pct((provision / expected) * 100, 0)}’i · yaklaşık bedelin ${pct((provision / project.estimatedValue) * 100, 1)}’i`} tone="accent"
          help="Teklif fiyatına gerçekten eklenen tutar. Karşılık ayrılmayan riskler için gerekçe yazılır (doğal hedge, idare yükümlülüğü, alternatif tedarikçi gibi)." />
      </>}
    />
  )
}

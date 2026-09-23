import type { TabKey } from '../data/types'
import {
  bidRisks, boqItems, certificates, contractRisks, contractSections, criticalTerms, docs,
  equipmentPlan, goNoGoCriteria, scheduleTasks, staffPlan,
} from '../data/mock'

/**
 * Her sekmenin doluluk oranı.
 * Mantık her sekmede aynı: "bu sayfanın beslendiği veri ne kadar geldi".
 * Örneğin 10 dokümanın 7'si analiz edildiyse doküman sekmesi %70'tir;
 * bağlı olduğu sekmeden veri gelmemişse sayfa o oranda düşük görünür.
 */
export function tabProgress(tab: TabKey): number {
  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100))

  switch (tab) {
    case 'dokuman_analiz':
      return pct(docs.filter((d) => d.state === 'Analiz edildi').length, docs.length)

    case 'bilgi_paneli':
      // Künyedeki 16 alandan kaçı doküman analizinden doldu
      return pct(15, 16)

    case 'kritik_sartlar':
      // Durumu netleşmiş şartlar (inceleme bitmiş olanlar)
      return pct(criticalTerms.filter((t) => t.state !== 'Kontrol Ediliyor').length, criticalTerms.length)

    case 'teklif_riskleri':
      // Karşılığı kararlaştırılmış riskler (bedeli olup karşılığı girilen ya da bilinçli sıfır)
      return pct(bidRisks.filter((r) => r.provision > 0 || !r.inBid).length, bidRisks.length)

    case 'kontrat_analiz':
      return pct(contractRisks.filter((r) => r.provision > 0 || !r.inBid).length, contractRisks.length)

    case 'go_nogo':
      return pct(goNoGoCriteria.filter((c) => c.score > 0).length, goNoGoCriteria.length)

    case 'boq':
      // Havuzdan fiyat eşleşen pozlar
      return pct(boqItems.filter((b) => b.unitPrice != null).length, boqItems.length)

    case 'personel_ekipman':
      return pct(
        staffPlan.filter((s) => s.months.length > 0).length + equipmentPlan.filter((e) => e.months.length > 0).length,
        staffPlan.length + equipmentPlan.length,
      )

    case 'is_programi':
      // Metraja bağlanmış aktiviteler
      return pct(scheduleTasks.filter((t) => t.boqRef).length, scheduleTasks.length)

    case 'birim_fiyat':
      return pct(boqItems.filter((b) => b.poolMatch === 'Eşleşti').length, boqItems.length)

    case 'sertifikalar':
      return pct(certificates.filter((c) => c.owned).length, certificates.filter((c) => c.required).length)

    case 'kontrat_hazirlama':
      return pct(contractSections.filter((c) => ['Taslak hazır', 'Onaylandı'].includes(c.state)).length, contractSections.length)

    case 'ozet': {
      // Özet, beslendiği sekmelerin ortalamasıdır
      const keys: TabKey[] = ['dokuman_analiz', 'bilgi_paneli', 'kritik_sartlar', 'teklif_riskleri',
        'kontrat_analiz', 'go_nogo', 'boq', 'is_programi', 'sertifikalar']
      return Math.round(keys.reduce((a, k) => a + tabProgress(k), 0) / keys.length)
    }
  }
}

export function progressTone(v: number): 'ok' | 'warn' | 'crit' {
  return v >= 90 ? 'ok' : v >= 50 ? 'warn' : 'crit'
}

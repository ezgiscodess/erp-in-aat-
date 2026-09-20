import { useState } from 'react'
import { criticalTerms } from '../data/mock'
import type { CriticalTerm } from '../data/types'
import {
  Badge, Btn, Card, Chips, Kpi, PageHead, ReadOnlyNote, Search, SeverityBadge, StateBadge, Table, Td, Th,
} from '../components/ui'

type Filter = 'Tümü' | 'Açık konular' | 'Kritik' | 'Karşılanıyor'

/** Teklifi ve sözleşmeyi bağlayan şartların tek listesi: ne isteniyor, kim takip ediyor, durumu ne. */
export function KritikSartlar({ writable, role }: { writable: boolean; role: string }) {
  const [filter, setFilter] = useState<Filter>('Tümü')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<CriticalTerm>(criticalTerms[2])

  const filtered = criticalTerms.filter((t) => {
    if (filter === 'Açık konular' && !['Eksik', 'Karşılanmıyor', 'İnceleniyor'].includes(t.state)) return false
    if (filter === 'Kritik' && t.severity !== 'Kritik') return false
    if (filter === 'Karşılanıyor' && t.state !== 'Karşılanıyor') return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [t.topic, t.requirement, t.impact, t.action, t.owner].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  const counts = {
    'Tümü': criticalTerms.length,
    'Açık konular': criticalTerms.filter((t) => ['Eksik', 'Karşılanmıyor', 'İnceleniyor'].includes(t.state)).length,
    'Kritik': criticalTerms.filter((t) => t.severity === 'Kritik').length,
    'Karşılanıyor': criticalTerms.filter((t) => t.state === 'Karşılanıyor').length,
  }

  return (
    <>
      <PageHead
        title="Kritik İhale Şartları"
        note="Doküman analizinden çıkan bağlayıcı şartlar; her biri bir sorumluya ve duruma bağlanır."
        right={<>
          <Btn disabled={!writable}>+ Şart ekle</Btn>
          <Btn>Soru listesine aktar</Btn>
          <Btn>Excel</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Toplam şart" value={criticalTerms.length} sub="Analizden çıkarıldı" />
        <Kpi label="Karşılanmıyor" value={counts['Tümü'] ? criticalTerms.filter((t) => t.state === 'Karşılanmıyor').length : 0} sub="Teklif fiyatına yansıtılmalı" tone="crit" />
        <Kpi label="Eksik" value={criticalTerms.filter((t) => t.state === 'Eksik').length} sub="Belge/limit bekliyor" tone="warn" />
        <Kpi label="İnceleniyor" value={criticalTerms.filter((t) => t.state === 'İnceleniyor').length} sub="Sorumlusunda" tone="warn" />
        <Kpi label="Karşılanıyor" value={counts['Karşılanıyor']} sub="Kapanan konular" tone="ok" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chips<Filter> value={filter} onChange={setFilter}
          items={(['Tümü', 'Açık konular', 'Kritik', 'Karşılanıyor'] as Filter[]).map((k) => ({ key: k, label: k, count: counts[k] }))} />
        <div className="ml-auto"><Search value={q} onChange={setQ} placeholder="Şartlarda ara…" /></div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card title={`Şartlar (${filtered.length})`} subtitle="Satıra tıklayarak sağdaki detay panelini açın" pad={false}>
            <Table head={
              <tr>
                <Th w={130}>Konu</Th>
                <Th w={280}>Şart</Th>
                <Th w={110}>Kaynak</Th>
                <Th w={90}>Önem</Th>
                <Th w={170}>Etki</Th>
                <Th w={110}>Sorumlu</Th>
                <Th w={120}>Durum</Th>
              </tr>
            }>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setSel(t)}
                  className="cursor-pointer hover:bg-[var(--surface-2)]"
                  style={t.id === sel.id ? { background: 'var(--accent-soft)' } : undefined}>
                  <Td nowrap><span className="font-semibold text-[var(--ink)]">{t.topic}</span></Td>
                  <Td><span className="text-[12.5px] text-[var(--ink)]">{t.requirement}</span></Td>
                  <Td nowrap><span className="mono text-[11.5px] text-[var(--accent)]">{t.clause}</span><span className="ml-1 text-[11px] text-[var(--faint)]">s.{t.page}</span></Td>
                  <Td nowrap><SeverityBadge value={t.severity} /></Td>
                  <Td><span className="text-[12px] text-[var(--muted)]">{t.impact}</span></Td>
                  <Td nowrap><span className="text-[12px] text-[var(--muted)]">{t.owner}</span></Td>
                  <Td nowrap><StateBadge value={t.state} /></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card
            title={sel.topic}
            subtitle={`${sel.clause} · sayfa ${sel.page}`}
            right={<SeverityBadge value={sel.severity} />}
          >
            <div className="flex flex-col gap-3 text-[13px]">
              <Field label="Şart">{sel.requirement}</Field>
              <Field label="Etki">{sel.impact}</Field>
              <Field label="Aksiyon">{sel.action}</Field>
              <div className="flex items-center gap-2">
                <Field label="Sorumlu">{sel.owner}</Field>
                <span className="ml-auto"><StateBadge value={sel.state} /></span>
              </div>

              <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[12px] text-[var(--muted)]">
                Bu şart teklif fiyatını etkiliyorsa <b className="text-[var(--ink)]">Teklif Riskleri</b> sekmesinde bir risk kaydına,
                sözleşme metnini etkiliyorsa <b className="text-[var(--ink)]">Kontrat Hazırlama</b> sekmesinde bir maddeye bağlanır.
              </div>

              <div className="flex flex-wrap gap-2">
                <Btn small disabled={!writable}>Riske bağla</Btn>
                <Btn small disabled={!writable}>Soru listesine ekle</Btn>
                <Btn small primary disabled={!writable}>Durumu güncelle</Btn>
              </div>
            </div>
          </Card>

          <div className="mt-4">
            <Card title="Teklife etkisi özeti" subtitle="Karşılanmayan şartların fiyata yansıması">
              <div className="flex flex-col gap-2 text-[12.5px]">
                {[
                  { l: 'Fiyat farkı yok → eskalasyon karşılığı', v: '+%6,5', tone: 'crit' as const },
                  { l: '90 gün ödeme → finansman maliyeti', v: '+%2,1', tone: 'crit' as const },
                  { l: 'Ceza tavanı %15 → risk primi', v: '+%1,2', tone: 'warn' as const },
                  { l: 'Bedelsiz dolgu malzemesi', v: '−%1,8', tone: 'ok' as const },
                ].map((r) => (
                  <div key={r.l} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                    <span className="text-[var(--ink)]">{r.l}</span>
                    <span className="ml-auto"><Badge tone={r.tone}>{r.v}</Badge></span>
                  </div>
                ))}
                <div className="mt-1 flex items-center gap-2 text-[13px] font-semibold">
                  <span className="text-[var(--ink)]">Net etki</span>
                  <span className="ml-auto text-[var(--crit)] tnum">+%8,0</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{label}</div>
      <div className="mt-0.5 leading-relaxed text-[var(--ink)]">{children}</div>
    </div>
  )
}

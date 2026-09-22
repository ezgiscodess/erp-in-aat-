import { useState } from 'react'
import { criticalTerms, docs } from '../data/mock'
import type { CriticalTerm } from '../data/types'
import {
  AiChat, Badge, Btn, Card, Chips, ColumnFilter, ExportButtons, Kpi, PageHead, PreviewPane, ReadOnlyNote,
  Search, severityTone, StateBadge, StickyPane, Table, Td, Th,
} from '../components/ui'

type Filter = 'Tümü' | 'Açık konular' | 'Kritik' | 'Karşılanıyor'

/** İhale dokümanındaki bağlayıcı şartların listesi; seçilen şartın kaynağı sağda açılır. */
export function KritikSartlar({ writable, role }: { writable: boolean; role: string }) {
  const [filter, setFilter] = useState<Filter>('Tümü')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<CriticalTerm>(criticalTerms[2])
  const [checked, setChecked] = useState<string[]>([])
  const [topicFilter, setTopicFilter] = useState('Tümü')
  const [sevFilter, setSevFilter] = useState('Tümü')
  const [stateFilter, setStateFilter] = useState('Tümü')

  const filtered = criticalTerms.filter((t) => {
    if (topicFilter !== 'Tümü' && t.topic !== topicFilter) return false
    if (sevFilter !== 'Tümü' && t.severity !== sevFilter) return false
    if (stateFilter !== 'Tümü' && t.state !== stateFilter) return false
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

  function toggle(id: string) {
    setChecked((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]))
  }

  /** Şartın çıkarıldığı doküman — önizlemede bu dosyanın ilgili sayfası açılır */
  const doc = docs.find((d) => d.id === sel.docId) ?? docs[0]

  return (
    <>
      <PageHead
        title="Kritik İhale Şartları"
        note="Doküman analizinden çıkan, teklifi ve sözleşmeyi bağlayan şartlar. Her şart bir sorumluya ve duruma bağlanır; kaynağı sağdaki önizlemede görülebilir."
        right={<>
          <ExportButtons />
          <Btn primary disabled={!writable}>+ Şart ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Toplam şart" value={criticalTerms.length} sub="Analizden çıkarıldı"
          help="İhale dokümanlarından çıkarılan bağlayıcı şart sayısı. Zeyilname geldiğinde liste güncellenir." />
        <Kpi label="Kritik şart" value={criticalTerms.filter((t) => t.severity === 'Kritik').length} sub="Teklifi doğrudan bağlar" tone="crit"
          help="Karşılanmaması hâlinde teklifin geçersiz olmasına ya da ciddi bedel farkına yol açan şartlar." />
        <Kpi label="Karşılanmıyor" value={criticalTerms.filter((t) => t.state === 'Karşılanmıyor').length} sub="Teklif fiyatına yansıtılmalı" tone="crit"
          help="Firmanın bugünkü durumuyla karşılayamadığı şartlar. Ya teklif fiyatına karşılık eklenir ya da zeyilname ile değiştirilmesi istenir." />
        <Kpi label="İnceleniyor" value={criticalTerms.filter((t) => t.state === 'İnceleniyor').length} sub="Sorumlusunda bekliyor" tone="warn"
          help="Durumu henüz netleşmemiş şartlar. Teklif teslimine kadar kapanması gerekir." />
        <Kpi label="Zeyilname talebi" value={2} sub="İdareye sorulacak" tone="accent"
          help="Değiştirilmesi için idareye yazılı talep gönderilecek şartlar. Soru listesine eklenenler buraya düşer." />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chips<Filter> value={filter} onChange={setFilter}
          items={(['Tümü', 'Açık konular', 'Kritik', 'Karşılanıyor'] as Filter[]).map((k) => ({ key: k, label: k, count: counts[k] }))} />
        <div className="ml-auto"><Search value={q} onChange={setQ} placeholder="Şartlarda ara…" /></div>
      </div>

      {checked.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
          style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent)' }}>
          <span className="text-[12.5px] font-semibold" style={{ color: 'var(--accent)' }}>{checked.length} şart seçildi</span>
          <span className="ml-auto flex flex-wrap gap-1.5">
            <Btn small disabled={!writable}>Soru listesine aktar</Btn>
            <Btn small disabled={!writable}>Riske bağla</Btn>
            <Btn small disabled={!writable}>Sorumlu ata</Btn>
            <Btn small onClick={() => setChecked([])}>Seçimi temizle</Btn>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div>
          <Card
            title={`Şartlar (${filtered.length})`}
            help="Satıra tıklayınca şartın geldiği doküman sayfası sağda açılır. Soldaki kutucuklarla birden fazla şart seçip toplu işlem yapabilirsiniz."
            pad={false}
          >
            <Table head={
              <tr>
                <Th w={28}>
                  <input type="checkbox" checked={checked.length === filtered.length && filtered.length > 0}
                    onChange={(e) => setChecked(e.target.checked ? filtered.map((t) => t.id) : [])} />
                </Th>
                <Th w={104}>
                  <span className="flex items-center gap-1.5">
                    Konu
                    <ColumnFilter value={topicFilter} onChange={setTopicFilter} values={criticalTerms.map((t) => t.topic)} />
                  </span>
                </Th>
                <Th w={236}>
                  <span className="flex items-center gap-1.5">
                    Şart, etkisi ve kaynağı
                    <ColumnFilter value={sevFilter} onChange={setSevFilter} values={['Kritik', 'Yüksek', 'Orta', 'Düşük']} />
                  </span>
                </Th>
                <Th w={110}>
                  <span className="flex items-center gap-1.5">
                    Durum
                    <ColumnFilter value={stateFilter} onChange={setStateFilter} values={['Karşılanıyor', 'Karşılanmıyor', 'İnceleniyor', 'Eksik']} />
                  </span>
                </Th>
              </tr>
            }>
              {filtered.map((t) => (
                <tr key={t.id} onClick={() => setSel(t)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                  style={t.id === sel.id ? { background: 'var(--accent-soft)' } : undefined}>
                  <Td nowrap>
                    <input type="checkbox" checked={checked.includes(t.id)}
                      onClick={(e) => e.stopPropagation()} onChange={() => toggle(t.id)} />
                  </Td>
                  <Td nowrap>
                    <span className="flex items-center gap-1.5" title={`Önem: ${t.severity}`}>
                      <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: `var(--${severityTone(t.severity)})` }} />
                      <span className="font-semibold text-[var(--ink)]">{t.topic}</span>
                    </span>
                  </Td>
                  <Td>
                    <div className="text-[12.5px] text-[var(--ink)]">{t.requirement}</div>
                    <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">→ {t.impact}</div>
                    <div className="mt-0.5">
                      <span className="mono text-[11px] text-[var(--accent)]">{t.clause}</span>
                      <span className="ml-1 text-[11px] text-[var(--faint)]">s.{t.page}</span>
                    </div>
                  </Td>
                  <Td nowrap><StateBadge value={t.state} /></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>

        <StickyPane>
          <div className="flex flex-col gap-3">
            {/* Şartın etkisi önizlemenin üstünde durur: önce ne anlama geldiği, sonra kaynağı */}
            <div className="rounded-lg border bg-[var(--surface)] p-3"
              style={{ borderColor: sel.severity === 'Kritik' ? 'var(--crit)' : 'var(--border)' }}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold text-[var(--ink)]">{sel.topic}</span>
                <Badge tone={severityTone(sel.severity)} dot>{sel.severity}</Badge>
                <span className="ml-auto"><StateBadge value={sel.state} /></span>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Şartın etkisi</div>
                  <div className="mt-0.5 text-[12.5px] text-[var(--ink)]">{sel.impact}</div>
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">Aksiyon · {sel.owner}</div>
                  <div className="mt-0.5 text-[12.5px] text-[var(--ink)]">{sel.action}</div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Btn small disabled={!writable}>Soru listesine ekle</Btn>
                <Btn small primary disabled={!writable}>Durumu güncelle</Btn>
              </div>
            </div>

            <PreviewPane
              title="Şartın kaynağı"
            preview={{
              doc: doc.name,
              page: sel.page,
              pages: doc.pages,
              clause: sel.clause,
              highlight: sel.quote,
              body: sel.context,
            }}
              paper
              height={300}
            />
          </div>
        </StickyPane>
      </div>

      <Card
        title="AI Soru-Cevap"
        help="İhale dokümanları hakkında soru sorun. Yanıtlar yalnızca yüklenen dokümanlara dayanır ve madde/sayfa referansıyla gelir; dokümanda karşılığı yoksa sistem 'bulunamadı' der ve soruyu idareye sorulacaklar listesine önerir."
        right={<Btn small>Pop-up olarak aç</Btn>}
      >
        <AiChat
          suggestions={[
            'Gecikme cezası tavanı nedir?',
            'Ödeme süresi kaç gün?',
            'Avans veriliyor mu?',
            'İş deneyim oranı nedir?',
            'Fiyat farkı ödenecek mi?',
          ]}
          answers={{
            'gecikme cezası': {
              text: 'Gecikilen her takvim günü için sözleşme bedelinin on binde beşi kesilir ve toplam ceza sözleşme bedelinin %15’ini geçemez. Piyasa pratiği %10 olduğu için bu madde aleyhimizedir; zeyilname ile indirilmesi talep edilmeli.',
              source: 'Idari Sartname.pdf · s. 41 · madde 31.4',
            },
            'ödeme süresi': {
              text: 'İki doküman çelişiyor: İdari Şartname 32.2 ödemeyi 60 gün, Sözleşme Özel Şartlar 14.7 ise 90 gün olarak veriyor. Sözleşme metni esas alınırsa 90 gündür. Yazılı açıklama istenmeli.',
              source: 'Sozlesme Tasarisi (Ozel Sartlar).pdf · s. 71 · madde 14.7',
            },
            'avans': {
              text: 'Bu ihalede avans verilmeyecektir. Mobilizasyon ve ilk üç ayın finansmanı özkaynak veya kredi ile karşılanmalıdır.',
              source: 'Idari Sartname.pdf · s. 28 · madde 25.1',
            },
            'iş deneyim': {
              text: 'Son 15 yılda, teklif bedelinin %80’i oranında benzer iş deneyim belgesi isteniyor. Firmanın tek başına karşıladığı oran %62; iş ortaklığı gerekebilir.',
              source: 'Idari Sartname.pdf · s. 17 · madde 7.5',
            },
            'fiyat farkı': {
              text: 'Fiyat farkı ödenmeyecek. Özel Şartlar 13.8 maddesi FIDIC fiyat ayarlama formülünü tamamen kaldırıyor; 24 aylık sürede maliyet artışı riski yüklenicidedir.',
              source: 'Sozlesme Tasarisi (Ozel Sartlar).pdf · s. 63 · madde 13.8',
            },
          }}
        />
      </Card>
    </>
  )
}

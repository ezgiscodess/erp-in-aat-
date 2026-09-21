import { useState } from 'react'
import { docs, previewBodies } from '../data/mock'
import { Badge, Btn, Card, Kpi, PageHead, PreviewPane, ReadOnlyNote, StateBadge, StickyPane, Table, Td, Th } from '../components/ui'

/** En son yüklenen doküman — ekran açıldığında sağdaki panelde bu dosya durur. */
const latest = [...docs].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0]

/** Yüklenen ihale dokümanları solda, seçilen dosyanın orijinali sağda açılır. */
export function DokumanAnaliz({ writable, role }: { writable: boolean; role: string }) {
  const [sel, setSel] = useState(latest)

  const analyzed = docs.filter((d) => d.state === 'Analiz edildi').length
  const body = previewBodies[sel.id] ?? 'Bu dokümanın önizlemesi henüz hazırlanmadı. Analiz tamamlandığında sayfa içeriği burada görünür.'

  return (
    <>
      <PageHead
        title="İhale Dokümanı Analiz"
        note="İhale dosyaları buraya yüklenir ve AI ile taranır. Her dosya sürümlenir; kim, ne zaman yükledi kaydı tutulur. Analiz sonuçları ilgili sekmelere (kritik şartlar, kontrat analiz, sertifikalar) dağılır."
        right={<>
          <Btn disabled={!writable}>+ Doküman Yükle</Btn>
          <Btn disabled={!writable}>Yeniden Analiz</Btn>
          <Btn primary disabled={!writable}>▶ Tümünü Analiz Et</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Doküman" value={docs.length} sub={`${analyzed} analiz edildi · 1 sırada`}
          help="Bu ihale için yüklenen dosya sayısı. Zeyilname ve soru-cevap listeleri de buraya eklenir." />
        <Kpi label="Toplam sayfa" value={docs.reduce((a, d) => a + d.pages, 0)} sub="2 dosya taranmış (OCR)"
          help="Taranmış (görüntü) dosyalar OCR ile metne çevrilir; bu dosyalar OCR etiketiyle işaretlenir." />
        <Kpi label="Son yüklenen" value={latest.kind} sub={`${latest.uploadedAt} · ${latest.uploadedBy}`} tone="accent"
          help="En son yüklenen dosya. Ekran açıldığında sağdaki panelde bu dosyanın orijinali durur." />
        <Kpi label="Sırada bekleyen" value={docs.filter((d) => d.state !== 'Analiz edildi').length} sub="Analiz kuyruğu" tone="warn"
          help="Henüz analizi bitmemiş dosyalar. Analiz bitene kadar bulguları diğer sekmelere düşmez." />
      </div>

      {/* İki eşit ekran: solda liste, sağda orijinal doküman */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Yüklenen dokümanlar" help="Satıra ya da “Aç” düğmesine tıklayınca dosyanın orijinali sağdaki panelde açılır. Run AI, yalnızca o dosyayı yeniden analiz eder." pad={false}>
          <Table head={
            <tr>
              <Th w={200}>Doküman</Th>
              <Th w={40} right>Sayfa</Th>
              <Th w={86}>Yüklendi</Th>
              <Th w={88}>Durum</Th>
              <Th w={96}>İşlem</Th>
            </tr>
          }>
            {docs.map((d) => (
              <tr key={d.id} onClick={() => setSel(d)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                style={d.id === sel.id ? { background: 'var(--accent-soft)' } : undefined}>
                <Td>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[var(--ink)]">{d.name}</span>
                    {d.ocr && <Badge tone="warn">OCR</Badge>}
                    {d.id === latest.id && <Badge tone="accent">son</Badge>}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--muted)]">{d.kind}</div>
                </Td>
                <Td right>{d.pages}</Td>
                <Td nowrap>
                  <div className="mono text-[11.5px] text-[var(--ink)]">{d.uploadedAt.slice(0, 10)}</div>
                  <div className="mono text-[11px] text-[var(--faint)]">{d.uploadedBy}</div>
                </Td>
                <Td nowrap><StateBadge value={d.state} /></Td>
                <Td nowrap>
                  <span className="flex gap-1.5">
                    <Btn small disabled={!writable}>▶ Run AI</Btn>
                    <Btn small onClick={() => setSel(d)}>Aç</Btn>
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>

        <StickyPane>
          <PreviewPane
            title={sel.id === latest.id ? 'Son yüklenen doküman' : 'Orijinal doküman'}
            preview={{ doc: sel.name, page: 1, pages: sel.pages, body }}
            paper
            height={560}
            footer={
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
                <span>{sel.kind} · {sel.pages} sayfa · yükleyen {sel.uploadedBy} · {sel.uploadedAt}</span>
                <span className="ml-auto flex gap-1.5">
                  <Btn small>İndir</Btn>
                  <Btn small disabled={!writable}>Yeni sürüm yükle</Btn>
                </span>
              </div>
            }
          />
        </StickyPane>
      </div>
    </>
  )
}

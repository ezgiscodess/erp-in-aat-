import { useState } from 'react'
import { docs, previewBodies } from '../data/mock'
import { Badge, Btn, Card, Kpi, PageHead, PreviewPane, ReadOnlyNote, StateBadge, Table, Td, Th } from '../components/ui'

/** Yüklenen ihale dokümanları ve analiz durumları. Seçilen dosya sağdaki önizlemede açılır. */
export function DokumanAnaliz({ writable, role }: { writable: boolean; role: string }) {
  const [sel, setSel] = useState(docs[0])

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
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <Card title="Yüklenen dokümanlar" help="Satıra tıklayınca dosya sağdaki önizleme panelinde açılır. Run AI, yalnızca o dosyayı yeniden analiz eder." pad={false}>
            <Table head={
              <tr>
                <Th w={200}>Doküman</Th>
                <Th w={105}>Tür</Th>
                <Th w={50} right>Sayfa</Th>
                <Th w={85}>Yükleyen</Th>
                <Th w={95}>Tarih</Th>
                <Th w={100}>Durum</Th>
                <Th w={115}>İşlem</Th>
              </tr>
            }>
              {docs.map((d) => (
                <tr key={d.id} onClick={() => setSel(d)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                  style={d.id === sel.id ? { background: 'var(--accent-soft)' } : undefined}>
                  <Td nowrap>
                    <span className="font-medium text-[var(--ink)]">{d.name}</span>
                    {d.ocr && <span className="ml-2"><Badge tone="warn">OCR</Badge></span>}
                  </Td>
                  <Td nowrap><span className="text-[var(--muted)]">{d.kind}</span></Td>
                  <Td right>{d.pages}</Td>
                  <Td nowrap mono>{d.uploadedBy}</Td>
                  <Td nowrap mono><span className="text-[11.5px]">{d.uploadedAt.slice(0, 10)}</span></Td>
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
        </div>

        <div className="xl:col-span-4">
          <PreviewPane
            title="Doküman önizleme"
            preview={{ doc: sel.name, page: 1, pages: sel.pages, body }}
            footer={
              <div className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
                <span>{sel.kind} · {sel.pages} sayfa · yükleyen {sel.uploadedBy}</span>
                <span className="ml-auto flex gap-1.5">
                  <Btn small>İndir</Btn>
                  <Btn small disabled={!writable}>Yeni sürüm yükle</Btn>
                </span>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}

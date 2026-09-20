import { useState } from 'react'
import { contractSections, contractVariables, project } from '../data/mock'
import { Badge, Btn, Card, Kpi, PageHead, PreviewPane, ReadOnlyNote, StateBadge, Table, Td, Th } from '../components/ui'
import { pct } from '../lib/format'

/** Şablon + ihale dokümanı verisinden sözleşme taslağı üretimi. */
export function KontratHazirlama({ writable, role }: { writable: boolean; role: string }) {
  const [sel, setSel] = useState(contractSections[2])

  const ready = contractSections.filter((s) => s.state === 'Taslak hazır' || s.state === 'Onaylandı').length
  const filled = contractVariables.filter((v) => v.filled).length
  const completion = Math.round((ready / contractSections.length) * 100)

  return (
    <>
      <PageHead
        title="Kontrat Hazırlama"
        note="Sözleşme taslağı; şablon maddeleri ile ihale dokümanından çıkarılan veriler birleştirilerek üretilir."
        right={<>
          <Btn disabled={!writable}>Şablon seç</Btn>
          <Btn primary disabled={!writable}>Word olarak indir</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Tamamlanma" value={pct(completion)} sub={`${ready}/${contractSections.length} bölüm hazır`} tone={completion > 70 ? 'ok' : 'warn'}
          help="Taslağı hazır ve onaylanmış bölümlerin toplam bölüme oranı." />
        <Kpi label="Değişkenler" value={`${filled}/${contractVariables.length}`} sub="Otomatik dolduruldu" tone="accent"
          help="Sözleşme metnindeki boşlukların (işveren, süre, bedel, ceza…) ihale dokümanından otomatik doldurulan kısmı." />
        <Kpi label="Boş bölüm" value={contractSections.filter((s) => s.state === 'Boş').length} sub="Veri bekliyor" tone="crit"
          help="Gerekli veri gelmediği için henüz üretilemeyen bölümler." />
        <Kpi label="Hukuk onayı" value={contractSections.filter((s) => s.state === 'Onaylandı').length} sub="Onaylanan bölüm"
          help="Hukuk biriminin onayladığı bölüm sayısı. Onaylanan bölümler kilitlenir; değişiklik yeni sürüm açar." />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Card title="Sözleşme bölümleri" help="Satıra tıklayınca bölümün taslağı sağdaki önizlemede açılır. Kaynak sütunu metnin şablondan mı, ihale dokümanından mı yoksa elle mi yazıldığını gösterir." pad={false}>
            <Table head={<tr><Th w={40}>#</Th><Th w={200}>Bölüm</Th><Th w={120}>Kaynak</Th><Th w={120}>Durum</Th></tr>}>
              {contractSections.map((s) => (
                <tr key={s.id} onClick={() => setSel(s)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                  style={sel.id === s.id ? { background: 'var(--accent-soft)' } : undefined}>
                  <Td mono nowrap>{s.no}</Td>
                  <Td>
                    <div className="text-[12.5px] font-medium text-[var(--ink)]">{s.title}</div>
                    <div className="text-[11px] text-[var(--faint)]">{s.note}</div>
                  </Td>
                  <Td nowrap><span className="text-[12px] text-[var(--muted)]">{s.source}</span></Td>
                  <Td nowrap><StateBadge value={s.state} /></Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Sözleşme değişkenleri" help="Sözleşme metnindeki doldurulacak alanlar. Değer ihale dokümanından çıkarılır ve kaynağı gösterilir; boş olanlar teklif sonrası netleşir." pad={false}>
            <Table head={<tr><Th w={150}>Alan</Th><Th w={210}>Değer</Th><Th w={150}>Kaynak</Th></tr>}>
              {contractVariables.map((v) => (
                <tr key={v.key} className="hover:bg-[var(--surface-2)]">
                  <Td nowrap><span className="font-medium text-[var(--ink)]">{v.label}</span></Td>
                  <Td>
                    <span className={v.filled ? 'text-[var(--ink)]' : 'text-[var(--crit)]'}>{v.value}</span>
                    {!v.filled && <span className="ml-2"><Badge tone="crit">boş</Badge></span>}
                  </Td>
                  <Td nowrap><span className="text-[11.5px] text-[var(--faint)]">{v.source}</span></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-7">
          <PreviewPane
            title={`Önizleme — ${sel.no}. ${sel.title}`}
            editable={writable}
            user="a.koc"
            log={[
              { at: '18.09.2026 14:22', user: 'sistem', kind: 'Otomatik doldurma', note: 'Bölüm ihale dokümanından üretildi (İdari Şartname md. 2)' },
              { at: '19.09.2026 09:40', user: 'a.koc', kind: 'Manuel düzeltme', note: 'Gecikme cezası tavanı %15 yerine %10 yazıldı; zeyilname talebine bağlandı' },
            ]}
            preview={{
              doc: 'Sozlesme Taslagi v3.docx',
              page: Number(sel.no),
              pages: contractSections.length,
              body: sel.state === 'Boş'
                ? 'Bu bölüm henüz doldurulmadı. Gerekli veri geldiğinde taslak otomatik üretilecek.'
                : `${sel.no}. ${sel.title.toLocaleUpperCase('tr')}\n\n`
                  + `${sel.no}.1. İşbu sözleşme, ${project.employer} (bundan sonra “İdare” olarak anılacaktır) ile Anadolu İnşaat A.Ş. `
                  + `(bundan sonra “Yüklenici” olarak anılacaktır) arasında, ${project.name} işinin yapılması amacıyla düzenlenmiştir.\n\n`
                  + `${sel.no}.2. İşin süresi ${project.durationDays} takvim günü olup, yer tesliminden itibaren başlar. `
                  + `Yüklenici, ayrıntılı iş programını sözleşmenin imzalanmasını izleyen 28 gün içinde İdare’ye sunar.\n\n`
                  + `${sel.no}.3. Hakediş ödemeleri, düzenlenen hakedişin İdare tarafından onaylanmasını izleyen 90 gün içinde yapılır. `
                  + `Bu sözleşmede fiyat farkı ödenmez.\n\n`
                  + `${sel.no}.4. Gecikme hâlinde, gecikilen her takvim günü için sözleşme bedelinin on binde beşi oranında ceza uygulanır; `
                  + `toplam ceza sözleşme bedelinin %10’unu geçemez.`,
            }}
            footer={
              <div className="flex flex-col gap-2">
                <div className="rounded border border-dashed px-3 py-2 text-[12px]" style={{ borderColor: 'var(--warn)', background: 'var(--warn-bg)', color: 'var(--warn)' }}>
                  ⚠ Revizyon notu: İhale dokümanında ceza tavanı %15’tir. Bu taslakta %10 olarak yazıldı ve zeyilname talebine bağlandı.
                  Talep kabul edilmezse metin geri alınmalıdır.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral">Kaynak: {sel.source}</Badge>
                  {sel.filledBy && <Badge tone="accent">Dolduran: {sel.filledBy}</Badge>}
                  <span className="ml-auto flex gap-1.5">
                    <Btn small disabled={!writable}>Hukuka gönder</Btn>
                  </span>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </>
  )
}

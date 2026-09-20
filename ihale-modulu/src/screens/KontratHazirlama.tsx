import { useState } from 'react'
import { contractSections, contractVariables, project } from '../data/mock'
import { AddonBadge, Badge, Bar, Btn, Card, Kpi, PageHead, ReadOnlyNote, StateBadge, Table, Td, Th } from '../components/ui'
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
          <AddonBadge />
          <Btn disabled={!writable}>Şablon seç</Btn>
          <Btn disabled={!writable}>Taslağı yeniden üret</Btn>
          <Btn primary disabled={!writable}>Word olarak indir</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Bölüm" value={contractSections.length} sub={`${ready} hazır`} />
        <Kpi label="Tamamlanma" value={pct(completion)} sub="Taslak hazırlık oranı" tone={completion > 70 ? 'ok' : 'warn'} />
        <Kpi label="Değişkenler" value={`${filled}/${contractVariables.length}`} sub="Otomatik dolduruldu" tone="accent" />
        <Kpi label="Boş bölüm" value={contractSections.filter((s) => s.state === 'Boş').length} sub="Veri bekliyor" tone="crit" />
        <Kpi label="Hukuk onayı" value={contractSections.filter((s) => s.state === 'Onaylandı').length} sub="Onaylanan bölüm" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-5">
          <Card title="Sözleşme bölümleri" subtitle="Satıra tıklayınca sağda önizleme açılır" pad={false}>
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

          <Card title="Sözleşme değişkenleri" subtitle="İhale dokümanından otomatik çıkarılan alanlar" pad={false}>
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
          <Card
            title={`Önizleme — ${sel.no}. ${sel.title}`}
            subtitle={`Kaynak: ${sel.source}${sel.filledBy ? ` · dolduran: ${sel.filledBy}` : ''}`}
            right={<>
              <Btn small disabled={!writable}>Düzenle</Btn>
              <Btn small disabled={!writable}>Hukuka gönder</Btn>
            </>}
          >
            <article className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-5 text-[13px] leading-[1.9] text-[var(--ink)]">
              <h4 className="mb-3 text-center text-[14px] font-bold">{sel.no}. {sel.title.toLocaleUpperCase('tr')}</h4>
              {sel.state === 'Boş' ? (
                <p className="py-8 text-center text-[13px] text-[var(--faint)]">
                  Bu bölüm henüz doldurulmadı. Gerekli veri geldiğinde taslak otomatik üretilecek.
                </p>
              ) : (
                <>
                  <p>
                    <b>{sel.no}.1.</b> İşbu sözleşme, <Var>{project.employer}</Var> (bundan sonra “İdare” olarak anılacaktır) ile
                    <Var> Anadolu İnşaat A.Ş.</Var> (bundan sonra “Yüklenici” olarak anılacaktır) arasında,
                    <Var> {project.name}</Var> işinin yapılması amacıyla düzenlenmiştir.
                  </p>
                  <p className="mt-3">
                    <b>{sel.no}.2.</b> İşin süresi <Var>{project.durationDays} takvim günü</Var> olup, yer tesliminden itibaren başlar.
                    Yüklenici, ayrıntılı iş programını sözleşmenin imzalanmasını izleyen <Var>28 gün</Var> içinde İdare’ye sunar.
                  </p>
                  <p className="mt-3">
                    <b>{sel.no}.3.</b> Hakediş ödemeleri, düzenlenen hakedişin İdare tarafından onaylanmasını izleyen
                    <Var> 90 gün</Var> içinde yapılır. Bu sözleşmede <Var>fiyat farkı ödenmez</Var>.
                  </p>
                  <p className="mt-3">
                    <b>{sel.no}.4.</b> Gecikme hâlinde, gecikilen her takvim günü için sözleşme bedelinin
                    <Var> on binde beşi</Var> oranında ceza uygulanır; toplam ceza sözleşme bedelinin <Var>%10</Var>’unu geçemez.
                  </p>
                  <div className="mt-4 rounded border border-dashed border-[var(--warn)] bg-[var(--warn-bg)] px-3 py-2 text-[12px]" style={{ color: 'var(--warn)' }}>
                    ⚠ Revizyon notu: İhale dokümanında ceza tavanı %15’tir. Bu taslakta %10 olarak yazıldı ve
                    zeyilname talebine bağlandı. Talep kabul edilmezse metin geri alınmalıdır.
                  </div>
                </>
              )}
            </article>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[var(--muted)]">
              <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }} /> otomatik doldurulan alan</span>
              <span>· kaynağı görmek için alanın üzerine gelin</span>
            </div>
          </Card>

          <Card title="Taslak hazırlık durumu">
            <div className="flex flex-col gap-3">
              <div>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-[var(--ink)]">Bölümler</span>
                  <span className="text-[var(--muted)] tnum">{ready}/{contractSections.length}</span>
                </div>
                <Bar value={completion} tone={completion > 70 ? 'ok' : 'warn'} />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-[12.5px]">
                  <span className="font-medium text-[var(--ink)]">Değişkenler</span>
                  <span className="text-[var(--muted)] tnum">{filled}/{contractVariables.length}</span>
                </div>
                <Bar value={(filled / contractVariables.length) * 100} tone="accent" />
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--muted)]">
                Sözleşme taslağı, <b className="text-[var(--ink)]">Kontrat Analiz</b> sekmesindeki bulgularla bağlantılıdır:
                aleyhe maddeler taslağa revizyon notu olarak düşer, kabul edilen revizyonlar metne işlenir.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

/** Otomatik doldurulan alan vurgusu */
function Var({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded px-1" style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)', color: 'var(--ink)' }}>
      {children}
    </span>
  )
}

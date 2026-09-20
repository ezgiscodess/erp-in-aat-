import { useMemo, useState } from 'react'
import { docs, findings } from '../data/mock'
import type { Finding, FindingKind } from '../data/types'
import {
  Badge, Btn, Card, Chips, Empty, Evidence, Kpi, PageHead, ReadOnlyNote,
  SeverityBadge, StateBadge, Table, Td, Th,
} from '../components/ui'
import { pct } from '../lib/format'

type Filter = 'Tümü' | FindingKind

export function DokumanAnaliz({ writable, role }: { writable: boolean; role: string }) {
  const [filter, setFilter] = useState<Filter>('Tümü')
  const [selected, setSelected] = useState<Finding>(findings[0])

  const counts = useMemo(() => {
    const c: Record<string, number> = { 'Tümü': findings.length }
    for (const f of findings) c[f.kind] = (c[f.kind] ?? 0) + 1
    return c
  }, [])

  const list = filter === 'Tümü' ? findings : findings.filter((f) => f.kind === filter)
  const analyzed = docs.filter((d) => d.state === 'Analiz edildi').length
  const critical = findings.filter((f) => f.severity === 'Kritik').length
  const verified = findings.filter((f) => f.verification === 'exact').length

  return (
    <>
      <PageHead
        title="İhale Dokümanı Analiz"
        note="Yüklenen ihale dosyaları AI ile taranır; her bulgu dokümana, sayfaya ve alıntıya bağlıdır."
        right={<>
          <Btn disabled={!writable}>+ Doküman Yükle</Btn>
          <Btn disabled={!writable}>Yeniden Analiz</Btn>
          <Btn primary disabled={!writable}>▶ Tümünü Analiz Et</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Doküman" value={docs.length} sub={`${analyzed} analiz edildi · 1 sırada`} />
        <Kpi label="Toplam sayfa" value={docs.reduce((a, d) => a + d.pages, 0)} sub="2 dosya taranmış (OCR)" />
        <Kpi label="Bulgu" value={findings.length} sub="Risk, çelişki, yükümlülük" tone="accent" />
        <Kpi label="Kritik bulgu" value={critical} sub="Teklifi doğrudan etkiler" tone="crit" />
        <Kpi label="Alıntı doğrulama" value={pct((verified / findings.length) * 100)} sub="Birebir eşleşen alıntı oranı" tone="ok" />
      </div>

      <Card title="Yüklenen dokümanlar" subtitle="Her dosya sürümlenir; kim, ne zaman yükledi kaydı tutulur" pad={false}>
        <Table head={
          <tr>
            <Th w={260}>Doküman</Th>
            <Th w={130}>Tür</Th>
            <Th w={70} right>Sayfa</Th>
            <Th w={110}>Yükleyen</Th>
            <Th w={130}>Tarih</Th>
            <Th w={120}>Durum</Th>
            <Th w={80} right>Bulgu</Th>
            <Th w={150}>İşlem</Th>
          </tr>
        }>
          {docs.map((d) => (
            <tr key={d.id} className="hover:bg-[var(--surface-2)]">
              <Td nowrap>
                <span className="font-medium text-[var(--ink)]">{d.name}</span>
                {d.ocr && <span className="ml-2"><Badge tone="warn">OCR</Badge></span>}
              </Td>
              <Td nowrap><span className="text-[var(--muted)]">{d.kind}</span></Td>
              <Td right>{d.pages}</Td>
              <Td nowrap mono>{d.uploadedBy}</Td>
              <Td nowrap mono>{d.uploadedAt}</Td>
              <Td nowrap><StateBadge value={d.state} /></Td>
              <Td right>{d.findings || '—'}</Td>
              <Td nowrap>
                <span className="flex gap-1.5">
                  <Btn small disabled={!writable}>▶ Run AI</Btn>
                  <Btn small>Aç</Btn>
                </span>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Bulgu listesi */}
        <div className="lg:col-span-5">
          <Card
            title={`Bulgular (${list.length})`}
            subtitle="Kabul edilen bulgular risk, teklif notu veya soru listesine dönüşür"
            right={<Btn small>Excel</Btn>}
          >
            <div className="flex flex-col gap-3">
              <Chips<Filter>
                value={filter}
                onChange={setFilter}
                items={(['Tümü', 'Risk', 'Çelişki', 'Yükümlülük', 'Eksik bilgi', 'Fırsat'] as Filter[])
                  .map((k) => ({ key: k, label: k, count: counts[k] ?? 0 }))}
              />
              <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto pr-1">
                {list.length === 0 && <Empty>Bu türde bulgu yok.</Empty>}
                {list.map((f) => {
                  const on = f.id === selected.id
                  return (
                    <button key={f.id} onClick={() => setSelected(f)}
                      className="rounded-md border px-3 py-2.5 text-left transition-colors"
                      style={on
                        ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' }
                        : { borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="flex items-center gap-2">
                        <SeverityBadge value={f.severity} />
                        <Badge tone="neutral">{f.kind}</Badge>
                        <span className="ml-auto text-[11px] text-[var(--faint)] tnum">güven {pct(f.confidence * 100)}</span>
                      </div>
                      <div className="mt-1.5 text-[13px] font-semibold leading-snug text-[var(--ink)]">{f.title}</div>
                      <div className="mt-1 flex items-center gap-2 text-[11.5px] text-[var(--muted)]">
                        <span className="mono">{f.docName}</span><span>·</span><span>s. {f.page}</span>
                        <span className="ml-auto"><StateBadge value={f.status} /></span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Kanıt ve doküman görünümü */}
        <div className="lg:col-span-7">
          <Card
            title={selected.title}
            subtitle={`${selected.kind} · ${selected.docName} · sayfa ${selected.page}${selected.clause !== '—' ? ` · madde ${selected.clause}` : ''}`}
            right={<>
              <Btn small disabled={!writable}>Ret</Btn>
              <Btn small disabled={!writable}>Riske dönüştür</Btn>
              <Btn small primary disabled={!writable}>Kabul</Btn>
            </>}
          >
            <div className="flex flex-col gap-3">
              <p className="text-[13px] leading-relaxed text-[var(--ink)]">{selected.explanation}</p>

              <Evidence
                doc={selected.docName}
                page={selected.page}
                clause={selected.clause}
                quote={selected.quote}
                verification={selected.verification}
              />

              {/* Kaynak sayfa önizlemesi — gerçek üründe PDF görüntüleyici olacak */}
              <div className="rounded-md border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-[11.5px] text-[var(--muted)]">
                  <span className="font-semibold text-[var(--ink)]">Kaynak sayfa</span>
                  <span>·</span><span className="mono">{selected.docName}</span>
                  <span className="ml-auto flex items-center gap-1.5">
                    <Btn small>‹</Btn><span className="tnum">{selected.page}</span><Btn small>›</Btn>
                  </span>
                </div>
                <div className="p-4 text-[12px] leading-relaxed text-[var(--muted)]">
                  <div className="mb-2 h-2 w-1/3 rounded bg-[var(--surface-3)]" />
                  <div className="mb-1 h-2 w-full rounded bg-[var(--surface-3)]" />
                  <div className="mb-3 h-2 w-5/6 rounded bg-[var(--surface-3)]" />
                  <p className="text-[12.5px] text-[var(--ink)]">
                    <span className="mono text-[11px] text-[var(--faint)]">{selected.clause !== '—' ? `${selected.clause} ` : ''}</span>
                    <mark className="evidence">{selected.quote}</mark>
                  </p>
                  <div className="mt-3 h-2 w-full rounded bg-[var(--surface-3)]" />
                  <div className="mt-1 h-2 w-4/6 rounded bg-[var(--surface-3)]" />
                  <div className="mt-1 h-2 w-3/6 rounded bg-[var(--surface-3)]" />
                </div>
              </div>

              <div className="rounded-md border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] p-3 text-[12px] text-[var(--muted)]">
                <b className="text-[var(--ink)]">Kural:</b> AI hiçbir kaydı kendi başına oluşturmaz. Bulgu ancak kullanıcı “Kabul” dediğinde
                risk kaydına, soru listesine veya sözleşme notuna dönüşür. Alıntısı kaynak metinde doğrulanamayan bulgular listede gösterilmez.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

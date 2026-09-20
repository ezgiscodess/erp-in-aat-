import { useMemo, useState } from 'react'
import { boqItems, project } from '../data/mock'
import { AddonBadge, Badge, Bar, Btn, Card, Chips, Kpi, PageHead, ReadOnlyNote, Search, Table, Td, Th } from '../components/ui'
import { money, moneyShort, num, pct } from '../lib/format'

/** Poz listesi ve metraj. Metrajın kaynağı (çizim/idare cetveli) ve AI ölçüm güveni her satırda görünür. */
export function Boq({ writable, role }: { writable: boolean; role: string }) {
  const [group, setGroup] = useState<string>('Tümü')
  const [q, setQ] = useState('')

  const groups = useMemo(() => ['Tümü', ...new Set(boqItems.map((b) => b.group))], [])
  const rows = boqItems.filter((b) => {
    if (group !== 'Tümü' && b.group !== group) return false
    if (q.trim()) {
      const s = q.toLocaleLowerCase('tr')
      return [b.no, b.description, b.source].some((v) => v.toLocaleLowerCase('tr').includes(s))
    }
    return true
  })

  const total = boqItems.reduce((a, b) => a + b.qty * b.unitPrice, 0)
  const shown = rows.reduce((a, b) => a + b.qty * b.unitPrice, 0)
  const lowConf = boqItems.filter((b) => b.confidence < 80)
  const lowConfValue = lowConf.reduce((a, b) => a + b.qty * b.unitPrice, 0)

  const byGroup = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of boqItems) m.set(b.group, (m.get(b.group) ?? 0) + b.qty * b.unitPrice)
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [])

  return (
    <>
      <PageHead
        title="BoQ / Take Off's"
        note="Poz listesi, metrajlar ve birim fiyatlar. Metrajın hangi çizimden çıktığı ve ölçüm güveni satır bazında izlenir."
        right={<>
          <AddonBadge />
          <Btn disabled={!writable}>Çizimden metraj çıkar</Btn>
          <Btn disabled={!writable}>Excel'den içe aktar</Btn>
          <Btn primary disabled={!writable}>+ Poz ekle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Toplam tutar" value={moneyShort(total, project.currency)} sub={`${boqItems.length} poz`} tone="accent" />
        <Kpi label="İdare yaklaşık bedeli" value={moneyShort(project.estimatedValue, project.currency)} sub={`Fark ${pct(((total - project.estimatedValue) / project.estimatedValue) * 100, 1)}`} />
        <Kpi label="Düşük güvenli metraj" value={lowConf.length} sub={`${moneyShort(lowConfValue, project.currency)} tutarında`} tone="warn" />
        <Kpi label="Ölçüm güveni (ort.)" value={pct(boqItems.reduce((a, b) => a + b.confidence, 0) / boqItems.length)} sub="AI take-off doğruluğu" />
        <Kpi label="Elle kontrol gereken" value={lowConf.length} sub="Güven < %80 olan pozlar" tone="crit" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-9">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Chips value={group} onChange={setGroup} items={groups.map((g) => ({ key: g, label: g }))} />
            <div className="ml-auto"><Search value={q} onChange={setQ} placeholder="Poz ara…" /></div>
          </div>

          <Card title={`Poz listesi (${rows.length})`} subtitle={`Gösterilen tutar: ${money(shown, project.currency)}`} pad={false}>
            <Table head={
              <tr>
                <Th w={80}>Poz no</Th>
                <Th w={300}>Tanım</Th>
                <Th w={70}>Birim</Th>
                <Th w={100} right>Metraj</Th>
                <Th w={100} right>Birim fiyat</Th>
                <Th w={120} right>Tutar</Th>
                <Th w={150}>Metraj kaynağı</Th>
                <Th w={120}>Güven</Th>
              </tr>
            }>
              {rows.map((b) => {
                const low = b.confidence < 80
                return (
                  <tr key={b.id} className="hover:bg-[var(--surface-2)]"
                    style={low ? { background: 'color-mix(in srgb, var(--warn-bg) 45%, transparent)' } : undefined}>
                    <Td mono nowrap>{b.no}</Td>
                    <Td>
                      <div className="text-[12.5px] text-[var(--ink)]">{b.description}</div>
                      {b.note && <div className="mt-0.5 text-[11px] text-[var(--warn)]">⚠ {b.note}</div>}
                    </Td>
                    <Td nowrap><span className="text-[var(--muted)]">{b.unit}</span></Td>
                    <Td right>{num(b.qty, b.qty < 100 ? 0 : 0)}</Td>
                    <Td right>{num(b.unitPrice, b.unitPrice < 100 ? 1 : 0)}</Td>
                    <Td right><span className="font-semibold text-[var(--ink)]">{num(b.qty * b.unitPrice)}</span></Td>
                    <Td nowrap><span className="text-[11.5px] text-[var(--muted)]">{b.source}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-14"><Bar value={b.confidence} tone={b.confidence >= 90 ? 'ok' : b.confidence >= 80 ? 'warn' : 'crit'} /></div>
                        <span className="tnum text-[11.5px] text-[var(--muted)]">{b.confidence}</span>
                      </div>
                    </Td>
                  </tr>
                )
              })}
              <tr>
                <Td className="bg-[var(--surface-2)]" nowrap><span className="text-[var(--faint)]">+</span></Td>
                <Td className="bg-[var(--surface-2)]"><span className="text-[12px] text-[var(--faint)]">Yeni poz eklemek için tıklayın…</span></Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]" right><span className="font-bold text-[var(--ink)]">{num(total)}</span></Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
                <Td className="bg-[var(--surface-2)]">{''}</Td>
              </tr>
            </Table>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-3">
          <Card title="Grup dağılımı" subtitle={`Toplam ${moneyShort(total, project.currency)}`}>
            <div className="flex flex-col gap-2.5">
              {byGroup.map(([g, v]) => (
                <div key={g}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="text-[var(--ink)]">{g}</span>
                    <span className="text-[var(--muted)] tnum">{pct((v / total) * 100)}</span>
                  </div>
                  <Bar value={(v / total) * 100} />
                  <div className="mt-0.5 text-[11px] text-[var(--faint)] tnum">{moneyShort(v, project.currency)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Take-off durumu" subtitle="Çizimlerden metraj çıkarma">
            <div className="flex flex-col gap-2 text-[12.5px]">
              {[
                { l: 'P-102 Saha genel yerleşim', s: 'Tamamlandı', t: 'ok' as const },
                { l: 'D-204 Kazık planı', s: 'Kısmi — doğu uç eksik', t: 'warn' as const },
                { l: 'D-211 Tabliye kirişleri', s: 'Tamamlandı', t: 'ok' as const },
                { l: 'E-412 RTG besleme', s: 'Bekliyor', t: 'warn' as const },
                { l: 'A-301 Drenaj', s: 'Tamamlandı', t: 'ok' as const },
              ].map((r) => (
                <div key={r.l} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                  <span className="mono text-[11.5px] text-[var(--muted)]">{r.l}</span>
                  <span className="ml-auto"><Badge tone={r.t}>{r.s}</Badge></span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Not">
            <p className="text-[12px] leading-relaxed text-[var(--muted)]">
              Metrajı AI çıkardığında satır <b className="text-[var(--ink)]">güven yüzdesiyle</b> işaretlenir.
              %80’in altındaki pozlar elle kontrol edilmeden teklife girmez; bu pozlar sarı gösterilir.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}

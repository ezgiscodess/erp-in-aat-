import { useState } from 'react'
import { certificates } from '../data/mock'
import { pqqRows, pqqSections } from '../data/pqq'
import type { PqqRow, PqqSection } from '../data/pqq'
import { AddonBadge, Badge, Btn, Card, Chips, ExportButtons, Kpi, PageHead, ReadOnlyNote, RowActions, Table, Td, Th } from '../components/ui'
import { date } from '../lib/format'
import { Sertifikalar } from './Sertifikalar'

export const pqqTone = (s: PqqRow['state']) => (s === 'Hazır' ? 'ok' : s === 'Güncellenmeli' ? 'warn' : 'crit')

/**
 * PQQ = ön yeterlilik dosyası. Alt sekmeler firma bilgisi, mali yeterlilik, iş deneyimi, kilit personel,
 * İSG ve sertifikalardır. Bilgi firmaya aittir; bu ihale yalnızca istenen kısımları çeker.
 */
export function Pqq({ writable, role }: { writable: boolean; role: string }) {
  const [section, setSection] = useState<PqqSection>('sertifikalar')
  const [rows, setRows] = useState<PqqRow[]>(pqqRows)
  const def = pqqSections.find((s) => s.key === section)!

  const count = (k: PqqSection) => (k === 'sertifikalar' ? certificates.length : rows.filter((r) => r.section === k).length)
  const list = rows.filter((r) => r.section === section)

  return (
    <>
      <PageHead
        title="PQQ"
        note="Ön yeterlilik (Pre-Qualification) dosyası. İhalede istenen firma bilgileri, mali yeterlilik, iş deneyimi, kilit personel, İSG ve sertifikalar alt sekmelerde toplanır. Bilgiler firmanın PQQ havuzundan gelir."
        right={<>
          <AddonBadge />
          <ExportButtons />
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <Chips<PqqSection> value={section} onChange={setSection}
        items={pqqSections.map((s) => ({ key: s.key, label: s.label, count: count(s.key) }))} />

      {section === 'sertifikalar' ? (
        <Sertifikalar writable={writable} role={role} embedded />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label={def.label} value={list.length} sub={def.note} />
            <Kpi label="Hazır" value={list.filter((r) => r.state === 'Hazır').length} sub="Teklife eklenebilir" tone="ok" />
            <Kpi label="Güncellenmeli" value={list.filter((r) => r.state === 'Güncellenmeli').length} sub="Eski tarihli" tone="warn" />
            <Kpi label="Eksik" value={list.filter((r) => r.state === 'Eksik').length} sub="Teklif öncesi tamamlanmalı" tone="crit" />
          </div>

          <Card title={`${def.label} (${list.length})`} help="Bilgiler firmanın PQQ havuzundan gelir. Burada yapılan değişiklik havuza da işlenir ve sonraki ihalelerde kullanılır." pad={false}>
            <Table head={
              <tr>
                <Th w={260}>Kalem</Th>
                <Th w={280}>Bilgi</Th>
                <Th w={180}>Dayanak</Th>
                <Th w={110} center>Durum</Th>
                <Th w={110} center>Güncelleme</Th>
                <Th w={150} center>İşlem</Th>
              </tr>
            }>
              {list.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--surface-2)]"
                  style={r.state === 'Eksik' ? { background: 'color-mix(in srgb, var(--crit-bg) 50%, transparent)' } : undefined}>
                  <Td><span className="text-[12.5px] font-medium text-[var(--ink)]">{r.item}</span></Td>
                  <Td><span className="text-[12.5px] text-[var(--ink)]">{r.value}</span></Td>
                  <Td><span className="text-[12px] text-[var(--muted)]">{r.ref}</span></Td>
                  <Td nowrap center><Badge tone={pqqTone(r.state)} dot>{r.state}</Badge></Td>
                  <Td nowrap center><span className="tnum text-[12px] text-[var(--muted)]">{date(r.updatedAt)}</span></Td>
                  <Td nowrap center>
                    <span className="inline-flex items-center gap-1.5">
                      {r.state === 'Eksik' ? <Btn small minW={76} primary disabled={!writable}>Yükle</Btn> : <Btn small minW={76}>Görüntüle</Btn>}
                      <RowActions name={r.item} disabled={!writable} onDelete={() => setRows((l) => l.filter((x) => x.id !== r.id))} />
                    </span>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
    </>
  )
}

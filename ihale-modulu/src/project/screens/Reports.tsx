import { useState } from 'react'
import type { ReactNode } from 'react'
import { Btn, IconBtn, PageHead, RowActions } from '../../components/ui'
import { date, num, pct } from '../../lib/format'
import { SCurve } from '../charts'
import { actualCum, dailyReport, evm, monthName, plannedCum, prj } from '../data'
import { equipmentRows, manpowerRows, siteDisruptions, sitePhotos } from '../progressData'
import { lookaheads, programs } from '../planningData'

/**
 * Reports: günlük, haftalık, aylık, işveren, merkez ofis raporları ve sunumlar.
 * Rapor sayfalardan oluşur; sağdaki önizlemelerden sayfalar arasında hızlıca gezilir.
 * Raporlar finansal tutar içermez. Sayfaların içeriği, gönderilecek örnek raporlara göre düzenlenecek.
 */

type PageKind = 'cover' | 'summary' | 'scurve' | 'works' | 'manpower' | 'equipment' | 'lookahead' | 'disruptions' | 'photos'

const PAGE_TITLE: Record<PageKind, string> = {
  cover: 'Kapak', summary: 'Özet', scurve: 'İlerleme eğrisi', works: 'İmalatlar', manpower: 'Personel',
  equipment: 'Makine-ekipman', lookahead: 'Önümüzdeki 2 hafta', disruptions: 'Aksaklıklar', photos: 'Saha fotoğrafları',
}

const REPORTS: Record<string, { title: string; period: string; to: string; pages: PageKind[]; slides?: boolean }> = {
  r_daily: { title: 'Günlük rapor', period: date('2026-09-26'), to: 'Proje ekibi (14) · her gün 07:00', pages: ['cover', 'summary', 'works', 'manpower', 'equipment', 'photos'] },
  r_weekly: { title: 'Haftalık rapor', period: '21 – 27 Eyl 2026', to: 'Proje + merkez ofis (22) · pazartesi 09:00', pages: ['cover', 'summary', 'scurve', 'works', 'lookahead', 'disruptions', 'photos'] },
  r_monthly: { title: 'Aylık rapor', period: 'Eylül 2026', to: 'İşveren + merkez ofis (9) · ayın 1’i', pages: ['cover', 'summary', 'scurve', 'works', 'manpower', 'equipment', 'disruptions', 'lookahead', 'photos'] },
  r_employer: { title: 'İşveren raporu', period: 'Eylül 2026', to: 'Anadolu Lojistik (4) · ayın 15’i', pages: ['cover', 'summary', 'scurve', 'lookahead', 'disruptions'] },
  r_hq: { title: 'Merkez ofis raporu', period: 'Eylül 2026', to: 'Genel müdürlük (6) · ayın 5’i', pages: ['cover', 'summary', 'scurve', 'disruptions', 'manpower'] },
  r_presentations: { title: 'Sunum', period: 'Eylül 2026 ilerleme toplantısı', to: 'Toplantı', pages: ['cover', 'summary', 'scurve', 'photos'], slides: true },
}

export function ReportViewer({ type }: { type: string }) {
  const rep = REPORTS[type] ?? REPORTS.r_daily
  const [pages, setPages] = useState<PageKind[]>(rep.pages)
  const [cur, setCur] = useState(0)
  const [key, setKey] = useState(type)
  if (key !== type) { setKey(type); setPages(rep.pages); setCur(0) }
  const kind = pages[Math.min(cur, pages.length - 1)]
  const addable = (Object.keys(PAGE_TITLE) as PageKind[]).filter((k) => !pages.includes(k))

  return (
    <>
      <PageHead title={`Reports · ${rep.title}`}
        note="Rapor sayfalardan oluşur; sağdaki önizlemelerden sayfalar arasında gezilir, sayfa eklenir veya silinir. Raporlar finansal tutar içermez ve belirlenen periyotta mail listesine otomatik gönderilir. Sayfaların içeriği, örnek raporlarınıza göre düzenlenecek."
        right={<>
          <Btn small>PDF</Btn><Btn small>Word</Btn>{rep.slides && <Btn small>PowerPoint</Btn>}
          <Btn small title={rep.to}>Mail listesi</Btn>
          <Btn primary>Oluştur ve gönder</Btn>
        </>} />
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-[12px] text-[var(--muted)]">
        <span><b className="text-[var(--ink)]">Dönem:</b> {rep.period}</span>
        <span><b className="text-[var(--ink)]">Alıcılar:</b> {rep.to}</span>
        <span className="ml-auto">{pages.length} sayfa</span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-9">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-3)] p-5">
            <div className="mx-auto bg-white shadow-sm" style={{ maxWidth: rep.slides ? 900 : 640, aspectRatio: rep.slides ? '16 / 9' : '1 / 1.414' }}>
              <div className="flex h-full flex-col px-10 py-8 text-[#1f2937]">
                <div className="mb-4 flex items-center gap-2 border-b border-[#e5e7eb] pb-2 text-[10px] text-[#9ca3af]">
                  <span className="grid h-5 w-5 place-items-center rounded text-[9px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>IC</span>
                  <span>ICCM Construction LTD · {prj.name}</span>
                  <span className="ml-auto">{rep.title} · {rep.period}</span>
                </div>
                <div className="min-h-0 flex-1 overflow-hidden"><PageBody kind={kind} rep={rep.title} period={rep.period} /></div>
                <div className="mt-3 text-center text-[10px] text-[#9ca3af]">Sayfa {cur + 1} / {pages.length}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="xl:col-span-3">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center border-b border-[var(--border)] px-3 py-2">
              <span className="text-[13px] font-semibold text-[var(--ink)]">Sayfalar</span>
              <span className="ml-auto">
                {addable.length > 0 && <IconBtn icon="add" title={`Sayfa ekle: ${PAGE_TITLE[addable[0]]}`} onClick={() => { setPages((p) => [...p, addable[0]]); setCur(pages.length) }} />}
              </span>
            </div>
            <div className="flex max-h-[calc(100vh-260px)] flex-col gap-2 overflow-y-auto p-2.5">
              {pages.map((p, i) => (
                <div key={p + i} role="button" tabIndex={0} onClick={() => setCur(i)} onKeyDown={(e) => { if (e.key === 'Enter') setCur(i) }}
                  className="group flex cursor-pointer items-center gap-2.5 rounded-md border p-1.5 text-left transition-colors"
                  style={i === cur ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' } : { borderColor: 'var(--border)' }}>
                  <span className="flex flex-shrink-0 flex-col gap-[3px] rounded-sm border border-[var(--border)] bg-white p-1.5" style={{ width: rep.slides ? 64 : 44, height: rep.slides ? 36 : 62 }}>
                    <span className="h-[3px] w-2/3 rounded bg-[var(--surface-3)]" />
                    {p === 'scurve' ? <svg viewBox="0 0 30 16" className="mt-0.5"><path d="M0 15 C 10 14, 14 4, 30 1" fill="none" stroke="var(--series-1)" strokeWidth="1.5" /></svg>
                      : p === 'photos' ? <span className="mt-0.5 grid grid-cols-2 gap-[2px]">{[0, 1, 2, 3].map((k) => <span key={k} className="h-2 rounded-[1px]" style={{ background: `hsl(${200 + k * 30} 30% 80%)` }} />)}</span>
                        : [0, 1, 2, 3].map((k) => <span key={k} className="h-[2px] rounded bg-[var(--surface-3)]" style={{ width: `${90 - k * 12}%` }} />)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] text-[var(--faint)]">Sayfa {i + 1}</span>
                    <span className="block truncate text-[12.5px] font-medium" style={{ color: i === cur ? 'var(--accent)' : 'var(--ink)' }}>{PAGE_TITLE[p]}</span>
                  </span>
                  {p !== 'cover' && <span className="opacity-0 group-hover:opacity-100"><RowActions name={PAGE_TITLE[p]} onDelete={() => { setPages((l) => l.filter((_, k) => k !== i)); setCur(0) }} /></span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function H({ children }: { children: ReactNode }) {
  return <div className="mb-3 text-[15px] font-bold text-[#111827]">{children}</div>
}

function MiniTable({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full border-collapse text-[10.5px]">
      <thead><tr>{head.map((h) => <th key={h} className="border-b border-[#d1d5db] px-1.5 py-1 text-left font-semibold text-[#6b7280]">{h}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k} className="border-b border-[#f3f4f6] px-1.5 py-1">{c}</td>)}</tr>)}</tbody>
    </table>
  )
}

function PageBody({ kind, rep, period }: { kind: PageKind; rep: string; period: string }) {
  const { actual, planned, spi } = evm()
  switch (kind) {
    case 'cover':
      return (
        <div className="flex h-full flex-col justify-center">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-[var(--accent)]">{rep}</div>
          <div className="mt-2 text-[26px] font-extrabold leading-tight text-[#111827]">{prj.name}</div>
          <div className="mt-1 text-[13px] text-[#6b7280]">{prj.code} · {prj.employer} · {prj.location}</div>
          <div className="mt-6 text-[13px] text-[#374151]">{period}</div>
          <div className="mt-auto text-[11px] text-[#9ca3af]">Hazırlayan: ICCM Construction LTD · planlama birimi</div>
        </div>
      )
    case 'summary':
      return (
        <div>
          <H>Özet</H>
          <div className="grid grid-cols-3 gap-2">
            {[['Fiziksel ilerleme', pct(actual)], ['Planlanan', pct(planned, 1)], ['SPI', spi.toLocaleString('tr-TR', { maximumFractionDigits: 2 })],
              ['Sahadaki personel', String(dailyReport.manpower)], ['Çalışan makine', String(dailyReport.machines)], ['Hava', dailyReport.weather.split(' · ')[0]]].map(([l, v]) => (
              <div key={l} className="rounded border border-[#e5e7eb] px-2 py-1.5">
                <div className="text-[9.5px] uppercase text-[#9ca3af]">{l}</div>
                <div className="text-[15px] font-bold">{v}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11.5px] leading-relaxed text-[#374151]">
            Proje planın {(planned - actual).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} puan gerisinde ilerliyor. Kritik yolda Depo C çatı çelik montajı
            gece vardiyasıyla sürüyor; çatı paneli montajı Ekim’in son haftasında başlayacak. Elektrik bağlantı izni bekleniyor.
          </p>
        </div>
      )
    case 'scurve':
      return <div><H>İlerleme eğrisi</H><SCurve plan={plannedCum} actual={actualCum} labels={plannedCum.map((_, i) => monthName(i + 1))} today={prj.today} height={220} /></div>
    case 'works':
      return <div><H>İmalatlar</H><MiniTable head={['İmalat', 'Dönemde', 'Kümülatif', 'Toplam', 'Bitiş']}
        rows={dailyReport.items.map((i) => [i.item, i.today ? `${num(i.today)} ${i.unit}` : '—', num(i.cum), `${num(i.total)} ${i.unit}`, date(i.finish)])} /></div>
    case 'manpower':
      return <div><H>Personel</H><MiniTable head={['Firma', 'Meslek', 'Kişi', 'inxsa']}
        rows={manpowerRows.filter((r) => r.date === '2026-09-26').map((r) => [r.company, r.trade, r.people, num(r.people * r.hours)])} /></div>
    case 'equipment':
      return <div><H>Makine-ekipman</H><MiniTable head={['Makine', 'No', 'Çalışma', 'Bekleme', 'Durum']}
        rows={equipmentRows.map((r) => [r.machine, r.plate, `${r.workHours} sa`, `${r.idleHours} sa`, r.state])} /></div>
    case 'lookahead': {
      const la = lookaheads[0]
      const acts = programs[0].activities.filter((a) => a.start <= la.to && a.finish >= la.from)
      return <div><H>Önümüzdeki 2 hafta · {date(la.from)} – {date(la.to)}</H><MiniTable head={['Kod', 'Aktivite', 'Bitiş', 'İlerleme']}
        rows={acts.map((a) => [a.code, a.name, date(a.finish), `%${a.progress}`])} /></div>
    }
    case 'disruptions':
      return <div><H>Aksaklıklar</H><MiniTable head={['Aksaklık', 'Sebep', 'Gün', 'Durum']}
        rows={siteDisruptions.map((d) => [d.title, d.category, d.effectDays || '—', d.state])} /></div>
    case 'photos':
      return (
        <div><H>Saha fotoğrafları</H>
          <div className="grid grid-cols-3 gap-2">
            {sitePhotos.slice(0, 6).map((p) => (
              <div key={p.id}>
                <div className="grid aspect-[4/3] place-items-center rounded text-[16px]" style={{ background: `linear-gradient(135deg, hsl(${p.hue} 35% 82%), hsl(${p.hue} 30% 66%))` }}>📷</div>
                <div className="mt-0.5 truncate text-[9.5px] text-[#6b7280]">{p.caption}</div>
              </div>
            ))}
          </div>
        </div>
      )
  }
}

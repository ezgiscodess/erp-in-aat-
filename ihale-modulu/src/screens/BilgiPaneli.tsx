import { boqItems, criticalTerms, docs, findings, project, timeline } from '../data/mock'
import { Badge, Bar, Btn, Card, Kpi, PageHead, ReadOnlyNote, StateBadge, Table, Td, Th } from '../components/ui'
import { date, daysLabel, money, moneyShort, num, pct } from '../lib/format'

/** İhalenin künyesi: tek bakışta "bu iş nedir, ne zaman, hangi koşullarla". */
export function BilgiPaneli({ writable, role }: { writable: boolean; role: string }) {
  const boqTotal = boqItems.reduce((a, b) => a + b.qty * b.unitPrice, 0)
  const openTerms = criticalTerms.filter((t) => t.state === 'Eksik' || t.state === 'Karşılanmıyor').length

  const kunye: { label: string; value: string; note?: string; tone?: 'crit' | 'warn' }[] = [
    { label: 'İhale no', value: project.code },
    { label: 'İşveren', value: project.employer },
    { label: 'Yer', value: `${project.location}, ${project.country}` },
    { label: 'Sözleşme tipi', value: project.contractType },
    { label: 'Teslim modeli', value: project.deliveryModel },
    { label: 'Para birimi', value: `${project.currency} (maliyetin %55’i TL)`, note: 'Kur riski', tone: 'warn' },
    { label: 'Yaklaşık bedel', value: money(project.estimatedValue, project.currency) },
    { label: 'İş süresi', value: `${num(project.durationDays)} takvim günü` },
    { label: 'Kusur sorumluluğu', value: '730 gün (DLP)', note: 'Standardın 2 katı', tone: 'warn' },
    { label: 'Avans', value: 'Yok', note: 'Mobilizasyon özkaynakla', tone: 'crit' },
    { label: 'Fiyat farkı', value: 'Ödenmeyecek', note: 'Özel Şartlar 13.8', tone: 'crit' },
    { label: 'Ödeme süresi', value: '90 gün', note: 'İdari Şartname 60 gün diyor — çelişki', tone: 'crit' },
    { label: 'Geçici teminat', value: '%3 (≈ 2,46 M EUR)' },
    { label: 'Kesin teminat', value: '%6 (≈ 4,92 M EUR)' },
    { label: 'Gecikme cezası', value: 'Günlük ‰0,5 · tavan %15', note: 'Piyasa pratiği %10', tone: 'crit' },
    { label: 'İş deneyimi', value: 'Teklif bedelinin %80’i', note: 'Tek başımıza %62', tone: 'warn' },
  ]

  return (
    <>
      <PageHead
        title="İhale Bilgi Paneli"
        note="İhalenin künyesi, kritik sayılar ve takvim. Alanlar doküman analizinden otomatik doldurulur; kaynağı işaretlidir."
        right={<>
          <Btn disabled={!writable}>Alanları düzenle</Btn>
          <Btn>PDF</Btn>
          <Btn>Excel</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Teklife kalan" value={`${project.daysLeft} gün`} sub={date(project.bidDueAt)} tone={project.daysLeft < 30 ? 'warn' : 'neutral'} />
        <Kpi label="Yaklaşık bedel" value={moneyShort(project.estimatedValue, project.currency)} sub="İdare tahmini" />
        <Kpi label="Ön metraj toplamı" value={moneyShort(boqTotal, project.currency)} sub={`${boqItems.length} poz`} tone="accent" />
        <Kpi label="İş süresi" value={`${num(project.durationDays)} gün`} sub="≈ 24 ay" />
        <Kpi label="Kritik şart" value={openTerms} sub="Karşılanmayan / eksik" tone="crit" />
        <Kpi label="Hazırlık" value={pct(project.progress)} sub="Teklif dosyası tamamlanma" tone="warn" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card title="İhale künyesi" subtitle="Kırmızı işaretli alanlar teklif fiyatını doğrudan etkiler" pad={false}>
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {kunye.map((k, i) => (
                <div key={k.label} className={`border-b border-[var(--border)] px-4 py-2.5 ${i % 2 === 0 ? 'sm:border-r' : ''}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">{k.label}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-[13px] font-medium text-[var(--ink)]">{k.value}</span>
                    {k.note && <Badge tone={k.tone ?? 'neutral'}>{k.note}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Card title="Takvim" subtitle="İhale sürecinin kilit tarihleri" pad={false}>
            <Table head={<tr><Th>Adım</Th><Th w={110}>Tarih</Th><Th w={110}>Durum</Th></tr>}>
              {timeline.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--surface-2)]">
                  <Td>
                    <div className="text-[12.5px] font-medium text-[var(--ink)]">{t.label}</div>
                    <div className="text-[11px] text-[var(--faint)]">{t.owner} · {daysLabel(t.daysLeft)}</div>
                  </Td>
                  <Td nowrap><span className="tnum text-[12.5px]">{date(t.date)}</span></Td>
                  <Td nowrap><StateBadge value={t.state} /></Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Dosya durumu" subtitle="Teklif dosyasının hazırlık yüzdesi">
            <div className="flex flex-col gap-3">
              {[
                { l: 'Doküman analizi', v: 88, n: `${docs.filter((d) => d.state === 'Analiz edildi').length}/${docs.length} dosya` },
                { l: 'Metraj ve birim fiyat', v: 62, n: `${boqItems.length} poz girildi` },
                { l: 'Kritik şartların kapatılması', v: 48, n: `${openTerms} açık konu` },
                { l: 'Belgeler ve sertifikalar', v: 71, n: '4 eksik belge' },
                { l: 'Teminat ve finansman', v: 35, n: 'Kesin teminat limiti bekliyor' },
              ].map((r) => (
                <div key={r.l}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="font-medium text-[var(--ink)]">{r.l}</span>
                    <span className="text-[var(--muted)] tnum">{pct(r.v)}</span>
                  </div>
                  <Bar value={r.v} tone={r.v >= 75 ? 'ok' : r.v >= 50 ? 'warn' : 'crit'} />
                  <div className="mt-0.5 text-[11px] text-[var(--faint)]">{r.n}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Öne çıkan bulgular" subtitle="Doküman analizinden gelen kritik maddeler">
            <div className="flex flex-col gap-2">
              {findings.filter((f) => f.severity === 'Kritik').map((f) => (
                <div key={f.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                  <div className="text-[12.5px] font-semibold text-[var(--ink)]">{f.title}</div>
                  <div className="mt-0.5 text-[11.5px] text-[var(--muted)]">{f.docName} · s. {f.page} · madde {f.clause}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

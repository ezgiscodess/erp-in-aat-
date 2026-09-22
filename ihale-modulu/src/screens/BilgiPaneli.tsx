import { useState } from 'react'
import { boqItems, criticalTerms, project, scopeSections, timeline } from '../data/mock'
import { Badge, Btn, Card, ExportButtons, Kpi, PageHead, ReadOnlyNote, StateBadge, Table, Td, Th } from '../components/ui'
import { date, daysLabel, money, num } from '../lib/format'

/** İhalenin künyesi: tek bakışta "bu iş nedir, ne zaman, hangi koşullarla". Alanlar elle düzeltilebilir. */
export function BilgiPaneli({ writable, role }: { writable: boolean; role: string }) {
  const [editKunye, setEditKunye] = useState(false)
  const [editTakvim, setEditTakvim] = useState(false)

  const openTerms = criticalTerms.filter((t) => t.state === 'Eksik' || t.state === 'Karşılanmıyor').length

  const kunye: { label: string; value: string; note?: string; tone?: 'crit' | 'warn'; help?: string }[] = [
    { label: 'İhale takip no', value: project.code, help: 'Firmanın kendi ERP takip kodu. İş eklenirken girilir; ihale dokümanındaki idare numarası ayrıca kaydedilir.' },
    { label: 'İşveren', value: project.employer },
    { label: 'Yer', value: `${project.location}, ${project.country}` },
    { label: 'Sözleşme tipi', value: project.contractType, help: 'FIDIC Red Book: birim fiyatlı, işveren tasarımlı sözleşme. Özel Şartlar, genel şartların bazı maddelerini değiştirir.' },
    { label: 'Teslim modeli', value: project.deliveryModel },
    { label: 'Para birimi', value: `${project.currency} (maliyetin %55’i TL)`, note: 'Kur riski', tone: 'warn' },
    { label: 'Yaklaşık bedel', value: money(project.estimatedValue, project.currency), help: 'İdarenin ilan ettiği yaklaşık bedel. Her ihalede açıklanmaz; açıklanmadıysa bu alan boş kalır ve teklif bedeli metraj × havuz fiyatından hesaplanır.' },
    { label: 'İş süresi', value: `${num(project.durationDays)} takvim günü` },
    { label: 'Garanti / kusur sorumluluğu', value: '730 gün (DLP)', note: 'Standardın 2 katı', tone: 'warn', help: 'DLP (Defects Notification Period): kabulden sonra kusurlardan sorumlu olunan süre. İş eklenirken girilir, doküman analizi doğrular. Bu sürede kesin teminat bloke kalır.' },
    { label: 'Avans', value: 'Yok', note: 'Mobilizasyon özkaynakla', tone: 'crit' },
    { label: 'Fiyat farkı', value: 'Ödenmeyecek', note: 'Özel Şartlar 13.8', tone: 'crit', help: 'Fiyat farkı, malzeme ve işçilik artışının sözleşme bedeline yansıtılmasıdır. Ödenmiyorsa artış riski tamamen yüklenicidedir.' },
    { label: 'Ödeme süresi', value: '90 gün', note: 'İdari Şartname 60 gün diyor — çelişki', tone: 'crit' },
    { label: 'Geçici teminat', value: '%3 (≈ 2,46 M EUR)' },
    { label: 'Kesin teminat', value: '%6 (≈ 4,92 M EUR)' },
    { label: 'Gecikme cezası', value: 'Günlük ‰0,5 · üst sınır %15', note: 'Piyasa pratiği %10', tone: 'crit', help: 'Gecikilen her takvim günü için sözleşme bedelinin on binde beşi kesilir; toplam ceza sözleşme bedelinin %15’ini geçemez (İdari Şartname 31.4, s.41).' },
    { label: 'İş deneyimi', value: 'Teklif bedelinin %80’i', note: 'Tek başımıza %62', tone: 'warn' },
  ]

  return (
    <>
      <PageHead
        title="İhale Bilgi Paneli"
        note="İhalenin künyesi, kapsamı ve takvimi. Alanlar doküman analizinden otomatik doldurulur, kaynağı işaretlidir ve elle düzeltilebilir."
        right={<ExportButtons />}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Kpi label="Teklife kalan" value={`${project.daysLeft} gün`} sub={date(project.bidDueAt)} tone={project.daysLeft < 30 ? 'warn' : 'neutral'}
          help="Teklif teslim tarihine kalan takvim günü. Zeyilname ile tarih değişirse buradan güncellenir." />
        <Kpi label="Yaklaşık bedel" value={money(project.estimatedValue, project.currency)} sub="İdare tahmini"
          help="İdarenin açıkladığı yaklaşık bedel. Açıklanmayan ihalelerde boş kalır." />
        <Kpi label="İş süresi" value={`${num(project.durationDays)} gün`} sub="≈ 24 ay"
          help="Yer tesliminden kabule kadar olan sözleşme süresi." />
        <Kpi label="Kritik şart" value={openTerms} sub="Karşılanmayan / eksik" tone="crit"
          help="Kritik İhale Şartları sekmesinde 'karşılanmıyor' veya 'eksik' durumda olan şart sayısı." />
        <Kpi label="Metraj kalemi" value={boqItems.length} sub="Poz listesinden · ek paket" tone="accent"
          help="İhale dokümanındaki poz sayısı. Metraj (BoQ / Take-off) ek pakete dâhildir; paket kapalıyken bu kutu pasif görünür. Birim fiyatlar Birim Fiyat Havuzu'ndan eşleşir." />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card
            title="İhale künyesi"
            help="Kırmızı işaretli alanlar teklif fiyatını doğrudan etkiler. Alanların çoğu doküman analizinden gelir; yanlışsa 'Düzenle' ile elle düzeltilir."
            right={writable
              ? <Btn small primary={editKunye} onClick={() => setEditKunye((v) => !v)}>{editKunye ? 'Kaydet' : '✎ Düzenle'}</Btn>
              : undefined}
            pad={false}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {kunye.map((k, i) => (
                <div key={k.label} className={`border-b border-[var(--border)] px-4 py-2.5 ${i % 2 === 0 ? 'sm:border-r' : ''}`}>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">
                    {k.label}
                  </div>
                  {editKunye ? (
                    <input defaultValue={k.value}
                      className="mt-1 w-full rounded border border-[var(--accent)] bg-[var(--surface)] px-2 py-1 text-[12.5px] text-[var(--ink)] outline-none" />
                  ) : (
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-medium text-[var(--ink)]">{k.value}</span>
                      {k.note && <Badge tone={k.tone ?? 'neutral'}>{k.note}</Badge>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="mt-4">
            <Card
              title="Kapsam bilgisi"
              help="İşin kapsamı, ana imalat kalemleri, işverenin sağlayacakları, kapsam dışı işler ve çalışma kısıtları. Doküman analizinden çıkarılır, kaynağı her bölümün altında yazar."
              right={writable ? <Btn small>✎ Düzenle</Btn> : undefined}
            >
              <div className="flex flex-col gap-3">
                {scopeSections.map((s) => (
                  <div key={s.id} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] p-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[12.5px] font-semibold text-[var(--ink)]">{s.title}</h4>
                      {s.id === 'K6' && <Badge tone="warn">Netleşmedi</Badge>}
                    </div>
                    <p className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-[var(--ink)]">{s.body}</p>
                    <div className="mt-1.5 text-[11px] text-[var(--faint)]">📎 {s.source}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <div className="lg:col-span-5">
          <Card
            title="Takvim"
            help="İhale sürecinin kilit tarihleri. Zeyilname ile tarih değişirse buradan güncellenir; değişiklik loga düşer."
            right={writable
              ? <Btn small primary={editTakvim} onClick={() => setEditTakvim((v) => !v)}>{editTakvim ? 'Kaydet' : '✎ Düzenle'}</Btn>
              : undefined}
            pad={false}
          >
            <Table head={<tr><Th>Adım</Th><Th w={130}>Tarih</Th><Th w={110}>Durum</Th></tr>}>
              {timeline.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--surface-2)]">
                  <Td>
                    <div className="text-[12.5px] font-medium text-[var(--ink)]">{t.label}</div>
                    <div className="text-[11px] text-[var(--faint)]">{t.owner} · {daysLabel(t.daysLeft)}</div>
                  </Td>
                  <Td nowrap>
                    {editTakvim
                      ? <input type="date" defaultValue={t.date} className="rounded border border-[var(--accent)] bg-[var(--surface)] px-1.5 py-0.5 text-[12px] outline-none" />
                      : <span className="tnum text-[12.5px]">{date(t.date)}</span>}
                  </Td>
                  <Td nowrap><StateBadge value={t.state} /></Td>
                </tr>
              ))}
            </Table>
          </Card>

          <div className="mt-4">
            <Card title="Teminat ve ödeme özeti" help="Teklif ve sözleşme aşamasında nakit ihtiyacını belirleyen kalemler.">
              <div className="flex flex-col gap-2 text-[12.5px]">
                {[
                  { l: 'Geçici teminat (%3)', v: '≈ 2,46 M EUR', t: 'neutral' as const },
                  { l: 'Kesin teminat (%6)', v: '≈ 4,92 M EUR', t: 'warn' as const },
                  { l: 'Avans', v: 'Yok', t: 'crit' as const },
                  { l: 'Ödeme süresi', v: '90 gün', t: 'crit' as const },
                  { l: 'Gecikme cezası üst sınırı', v: '%15 (≈ 12,3 M EUR)', t: 'crit' as const },
                ].map((r) => (
                  <div key={r.l} className="flex items-center gap-2 border-b border-[var(--border)] pb-2 last:border-0">
                    <span className="text-[var(--ink)]">{r.l}</span>
                    <span className="ml-auto"><Badge tone={r.t}>{r.v}</Badge></span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}

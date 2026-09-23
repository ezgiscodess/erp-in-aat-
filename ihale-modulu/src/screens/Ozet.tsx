import {
  bidRisks, boqItems, certificates, clauses, contractSections, criticalTerms, docs, findings, goNoGoCriteria, project, timeline,
} from '../data/mock'
import type { TabKey } from '../data/types'
import { Badge, Bar, Btn, Card, Kpi, PageHead, SeverityBadge, StateBadge, Table, Td, Th } from '../components/ui'
import { date, daysLabel, money, moneyShort, num, pct } from '../lib/format'

/**
 * Son sekme: diğer dokuz sekmenin özeti tek sayfada.
 * Amaç, ekranları tek tek gezmeden "bu işe girelim mi, nerede duruyoruz" sorusuna cevap vermek.
 */
export function Ozet({ onGo }: { onGo: (t: TabKey) => void }) {
  const score = goNoGoCriteria.reduce((a, c) => a + c.weight * c.score, 0) / goNoGoCriteria.reduce((a, c) => a + c.weight, 0)
  /** Yalnızca havuzda fiyatı eşleşen kalemler toplanır; fiyatı olmayanlar teklif bedeline girmez. */
  const boqTotal = boqItems.reduce((a, b) => a + b.qty * (b.unitPrice ?? 0), 0)
  const riskProvision = 8_900_000
  const overhead = 6_400_000      // şantiye genel giderleri + merkez payı
  const profit = 5_500_000        // hedeflenen kâr
  const critFindings = findings.filter((f) => f.severity === 'Kritik')
  const openTerms = criticalTerms.filter((t) => t.state === 'Devam Ediyor')
  const missingCerts = certificates.filter((c) => c.required && !c.owned)
  const against = clauses.filter((c) => c.position === 'Yüklenici aleyhine')
  const topRisks = [...bidRisks].sort((a, b) => b.probability * b.impact - a.probability * a.impact).slice(0, 4)
  const bidPrice = boqTotal + overhead + riskProvision + profit
  const margin = (profit / bidPrice) * 100

  const actions = [
    { p: 'Kritik', t: 'Gecikme cezası tavanının %10’a indirilmesi için zeyilname talebi gönderilsin', o: 'Teklif', d: '2026-09-30', tab: 'kritik_sartlar' as TabKey },
    { p: 'Kritik', t: 'Ödeme süresi çelişkisi (60/90 gün) yazılı olarak netleştirilsin', o: 'PMO', d: '2026-09-30', tab: 'kontrat_analiz' as TabKey },
    { p: 'Kritik', t: 'Rıhtım doğu ucu için ek sondaj talebi; aksi hâlde kazık kalemi birim fiyatlı kalsın', o: 'Teknik', d: '2026-09-30', tab: 'teklif_riskleri' as TabKey },
    { p: 'Yüksek', t: 'İş deneyim oranı için iş ortaklığı kurgusu netleşsin (%62 → %80)', o: 'C-Suite', d: '2026-10-02', tab: 'kritik_sartlar' as TabKey },
    { p: 'Yüksek', t: 'Kesin teminat için banka ek limiti alınsın', o: 'Finans', d: '2026-10-07', tab: 'kritik_sartlar' as TabKey },
    { p: 'Yüksek', t: 'ISO 45001 yenileme denetimi planlansın (43 gün kaldı)', o: 'Kalite', d: '2026-10-10', tab: 'sertifikalar' as TabKey },
    { p: 'Orta', t: 'Düşük güvenli 5 pozun metrajı elle kontrol edilsin', o: 'Teknik', d: '2026-10-07', tab: 'boq' as TabKey },
  ]

  return (
    <>
      <PageHead
        title="Özet & Karar"
        note="Tüm sekmelerin tek sayfalık görünümü. Her kart ilgili sekmeye götürür."
        right={<>
          <Btn>Yönetim özeti (PDF)</Btn>
          <Btn primary>Karar toplantısına gönder</Btn>
        </>}
      />

      {/* Künye şeridi */}
      <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div>
            <div className="text-[15px] font-bold text-[var(--ink)]">{project.name}</div>
            <div className="mt-0.5 text-[12px] text-[var(--muted)]">
              {project.code} · {project.employer} · {project.location} · {project.contractType}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Badge tone="warn" dot>Teklife {project.daysLeft} gün</Badge>
            <Badge tone="neutral">{date(project.bidDueAt)}</Badge>
            <StateBadge value={project.status} />
          </div>
        </div>
      </div>

      {/* Karar bandı */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex h-full flex-col justify-between rounded-lg border p-4"
            style={{ background: 'var(--warn-bg)', borderColor: 'var(--warn)' }}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--warn)' }}>Öneri</div>
              <div className="mt-1 text-[28px] font-extrabold leading-none" style={{ color: 'var(--warn)' }}>ŞARTLI GO</div>
              <div className="mt-2 text-[12.5px] leading-relaxed" style={{ color: 'var(--warn)' }}>
                Skor <b>{num(score, 1)}/100</b> (eşik 60). Teknik uyum güçlü; ticari ve sözleşmesel koşullar zayıf.
                Dört koşul karşılanırsa teklif verilmesi öneriliyor.
              </div>
            </div>
            <div className="mt-3">
              <Bar value={score} tone="warn" height={8} />
              <Btn small onClick={() => onGo('go_nogo')}>Go / No-Go detayına git →</Btn>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Ön teklif bedeli" value={moneyShort(bidPrice, project.currency)} sub={`Direkt ${moneyShort(boqTotal, project.currency)} + genel gider + risk + kâr`} tone="accent" />
            <Kpi label="Risk karşılığı" value={moneyShort(riskProvision, project.currency)} sub={`Teklifin ${pct((riskProvision / bidPrice) * 100)}’i`} tone="crit"
              help="Teklif fiyatına eklenen risk karşılığı. Risklerin olasılıkla ağırlıklı beklenen değerinden hesaplanır; en kötü senaryonun tamamı değildir." />
            <Kpi label="Beklenen marj" value={pct(margin, 1)} sub="Hedef %10" tone="warn" />
            <Kpi label="İdare yaklaşık bedeli" value={moneyShort(project.estimatedValue, project.currency)} sub={`Fark ${pct(((bidPrice - project.estimatedValue) / project.estimatedValue) * 100, 1)}`} />
            <Kpi label="Kritik bulgu" value={critFindings.length} sub={`${findings.length} bulgu içinde`} tone="crit" />
            <Kpi label="Açık kritik şart" value={openTerms.length} sub="Kapatılmalı" tone="crit" />
            <Kpi label="Belge durumu" value={`${certificates.filter((c) => c.owned).length}/${certificates.filter((c) => c.required).length}`} sub={`${missingCerts.length} eksik belge`} tone="warn"
              help="Teklif dosyasında istenen belgelerden kaçının firmada hazır olduğu. Eksikler Sertifikalar sekmesinde listelenir." />
            <Kpi label="Hazırlık" value={pct(project.progress)} sub="Teklif dosyası tamamlanma" tone="warn" />
          </div>
        </div>
      </div>

      {/* Sekme özetleri */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SummaryCard title="İhale Dokümanı Analiz" onGo={() => onGo('dokuman_analiz')}
          lines={[
            [`${docs.length} doküman`, `${docs.reduce((a, d) => a + d.pages, 0)} sayfa`],
            [`${findings.length} bulgu`, `${critFindings.length} kritik`],
            ['Alıntı doğrulama', pct((findings.filter((f) => f.verification === 'exact').length / findings.length) * 100)],
          ]}>
          <div className="flex flex-col gap-1.5">
            {critFindings.slice(0, 3).map((f) => (
              <div key={f.id} className="flex items-start gap-2 text-[12px]">
                <span className="mt-0.5"><SeverityBadge value={f.severity} /></span>
                <span className="text-[var(--ink)]">{f.title}</span>
              </div>
            ))}
          </div>
        </SummaryCard>

        <SummaryCard title="İhale Bilgi Paneli" onGo={() => onGo('bilgi_paneli')}
          lines={[
            ['Süre', `${num(project.durationDays)} gün`],
            ['Ödeme', '90 gün · avans yok'],
            ['Teminat', '%3 geçici · %6 kesin'],
          ]}>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="crit">Fiyat farkı yok</Badge>
            <Badge tone="crit">Ceza tavanı %15</Badge>
            <Badge tone="warn">DLP 730 gün</Badge>
            <Badge tone="ok">Bedelsiz dolgu</Badge>
          </div>
        </SummaryCard>

        <SummaryCard title="Go / No-Go Analiz" onGo={() => onGo('go_nogo')}
          lines={[['Skor', `${num(score, 1)} / 100`], ['Eşik', '60'], ['Karar tarihi', '2 Eki 2026']]}>
          <div className="flex flex-col gap-2">
            <Bar value={score} tone="warn" />
            <div className="text-[12px] text-[var(--muted)]">
              En zayıf iki başlık: <b className="text-[var(--ink)]">nakit yükü (38)</b> ve <b className="text-[var(--ink)]">risk paylaşımı (35)</b>.
            </div>
          </div>
        </SummaryCard>

        <SummaryCard title="Kritik İhale Şartları" onGo={() => onGo('kritik_sartlar')}
          lines={[
            [`${criticalTerms.length} şart`, `${openTerms.length} açık`],
            ['Teklife net etki', '+%8,0'],
            ['Sorumlular', 'Finans, Teklif, PMO'],
          ]}>
          <div className="flex flex-col gap-1.5">
            {openTerms.slice(0, 3).map((t) => (
              <div key={t.id} className="flex items-center gap-2 text-[12px]">
                <StateBadge value={t.state} />
                <span className="text-[var(--ink)]">{t.topic}</span>
              </div>
            ))}
          </div>
        </SummaryCard>

        <SummaryCard title="Metraj (BoQ / Take-off)" addon onGo={() => onGo('boq')}
          lines={[
            [`${boqItems.length} poz`, moneyShort(boqTotal, project.currency)],
            ['Havuzda fiyatı yok', `${boqItems.filter((b) => b.poolMatch === 'Eşleşmedi').length} poz`],
            ['Elle kontrol', `${boqItems.filter((b) => b.confidence < 80).length} poz`],
          ]}>
          <div className="flex flex-col gap-1.5 text-[12px]">
            {['Deniz İşleri', 'Saha İşleri', 'Altyapı'].map((g) => {
              const v = boqItems.filter((b) => b.group === g).reduce((a, b) => a + b.qty * (b.unitPrice ?? 0), 0)
              return (
                <div key={g} className="flex items-center gap-2">
                  <span className="text-[var(--ink)]">{g}</span>
                  <span className="ml-auto tnum text-[var(--muted)]">{moneyShort(v, project.currency)}</span>
                </div>
              )
            })}
          </div>
        </SummaryCard>

        <SummaryCard title="Teklif Riskleri" onGo={() => onGo('teklif_riskleri')}
          lines={[
            [`${bidRisks.length} risk`, `${bidRisks.filter((r) => r.probability * r.impact >= 16).length} yüksek`],
            ['Karşılık', moneyShort(riskProvision, project.currency)],
            ['En uzun süre etkisi', '60 gün'],
          ]}>
          <div className="flex flex-col gap-1.5">
            {topRisks.slice(0, 3).map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-[12px]">
                <Badge tone={r.probability * r.impact >= 16 ? 'crit' : 'warn'}>{r.probability * r.impact}</Badge>
                <span className="text-[var(--ink)]">{r.title}</span>
              </div>
            ))}
          </div>
        </SummaryCard>

        <SummaryCard title="Kontrat Analiz" onGo={() => onGo('kontrat_analiz')}
          lines={[
            [`${clauses.length} madde`, `${against.length} aleyhimize`],
            ['Çelişki', `${clauses.filter((c) => c.conflictWith).length}`],
            ['Süre sınırı', `${clauses.filter((c) => c.timeBarDays).length} madde`],
          ]}>
          <div className="flex flex-col gap-1.5 text-[12px]">
            <div className="flex items-center gap-2"><Badge tone="crit">48 saat</Badge><span className="text-[var(--ink)]">Sözlü talimat teyidi (3.3c)</span></div>
            <div className="flex items-center gap-2"><Badge tone="warn">28 gün</Badge><span className="text-[var(--ink)]">Talep bildirimi (20.1)</span></div>
            <div className="flex items-center gap-2"><Badge tone="crit">13.8</Badge><span className="text-[var(--ink)]">Fiyat farkı kaldırılmış</span></div>
          </div>
        </SummaryCard>

        <SummaryCard title="Kontrat Hazırlama" addon onGo={() => onGo('kontrat_hazirlama')}
          lines={[
            ['Bölüm', `${contractSections.filter((s) => s.state === 'Taslak hazır' || s.state === 'Onaylandı').length}/${contractSections.length} hazır`],
            ['Boş bölüm', `${contractSections.filter((s) => s.state === 'Boş').length}`],
            ['Hukuk onayı', `${contractSections.filter((s) => s.state === 'Onaylandı').length} bölüm`],
          ]}>
          <Bar value={(contractSections.filter((s) => s.state === 'Taslak hazır' || s.state === 'Onaylandı').length / contractSections.length) * 100} tone="warn" />
        </SummaryCard>

        <SummaryCard title="Sertifikalar" addon onGo={() => onGo('sertifikalar')}
          lines={[
            ['İstenen', `${certificates.filter((c) => c.required).length} belge`],
            ['Eksik', `${missingCerts.length}`],
            ['Süresi yaklaşan', `${certificates.filter((c) => c.daysLeft != null && c.daysLeft <= 60).length}`],
          ]}>
          <div className="flex flex-col gap-1.5 text-[12px]">
            {missingCerts.slice(0, 3).map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <Badge tone="crit" dot>Yok</Badge><span className="text-[var(--ink)]">{c.name}</span>
              </div>
            ))}
          </div>
        </SummaryCard>
      </div>

      {/* Aksiyonlar ve takvim */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Card title="Yapılacaklar" help="Sistemin bulgulardan çıkardığı öneriler. Her satır bir termine bağlanır ve 'Aç' ile ilgili sekmeye gider." pad={false}>
            <Table head={<tr><Th w={80}>Öncelik</Th><Th w={420}>Aksiyon</Th><Th w={110}>Termin</Th><Th w={90}>Git</Th></tr>}>
              {actions.map((a) => (
                <tr key={a.t} className="hover:bg-[var(--surface-2)]">
                  <Td nowrap><Badge tone={a.p === 'Kritik' ? 'crit' : a.p === 'Yüksek' ? 'warn' : 'neutral'} dot>{a.p}</Badge></Td>
                  <Td><span className="text-[12.5px] text-[var(--ink)]">{a.t}</span></Td>
                  <Td nowrap><span className="tnum text-[12.5px]">{date(a.d)}</span></Td>
                  <Td nowrap><Btn small onClick={() => onGo(a.tab)}>Aç →</Btn></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-5">
          <Card title="Log" help="Teklif sürecindeki adımların kaydı: hangi adım ne zaman, kim tarafından, hangi durumda. Tarih değişiklikleri ve tamamlanan adımlar buraya düşer." pad={false}>
            <Table head={<tr><Th>Adım</Th><Th w={120}>Tarih</Th><Th w={100}>Durum</Th></tr>}>
              {timeline.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--surface-2)]">
                  <Td>
                    <div className="text-[12.5px] text-[var(--ink)]">{t.label}</div>
                    <div className="text-[11px] text-[var(--faint)]">{t.owner} · {daysLabel(t.daysLeft)}</div>
                  </Td>
                  <Td nowrap><span className="tnum text-[12.5px]">{date(t.date)}</span></Td>
                  <Td nowrap><StateBadge value={t.state} /></Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Karar notu" subtitle="Yönetim kuruluna sunulacak özet">
            <p className="text-[12.5px] leading-relaxed text-[var(--ink)]">
              İş, teknik açıdan şirketin yapabileceği bir iştir ve bölgede varlığımız avantaj sağlar.
              Ancak sözleşme üç noktada belirgin biçimde işveren lehine: <b>fiyat farkı yok</b>, <b>90 gün ödeme ve avans yok</b>,
              <b> gecikme cezası tavanı %15</b>. Bu üç madde, teklife yaklaşık {money(riskProvision, project.currency)} karşılık eklenmesini
              gerektiriyor ve marjı hedefin altına, {pct(margin, 1)} seviyesine indiriyor.
              Zeyilname ile ceza tavanı ve ödeme süresi iyileştirilirse yaklaşık {moneyShort(1_900_000, project.currency)} geri kazanılır;
              bu durumda teklif rekabetçi olur. İş deneyim oranı tek başımıza karşılanmadığı için iş ortaklığı kararı
              2 Ekim’e kadar netleşmelidir.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone="ok">Teknik uyum güçlü</Badge>
              <Badge tone="warn">Marj hedefin altında</Badge>
              <Badge tone="crit">Sözleşme dengesiz</Badge>
              <Badge tone="warn">Ortaklık gerekli</Badge>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

function SummaryCard({ title, lines, children, onGo, addon }: {
  title: string
  lines: [string, string][]
  children: React.ReactNode
  onGo: () => void
  addon?: boolean
}) {
  return (
    <section className="flex flex-col rounded-lg border border-[var(--border)] bg-[var(--surface)]">
      <header className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
        <h3 className="text-[13px] font-semibold text-[var(--ink)]">{title}</h3>
        {addon && <span className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase" style={{ background: 'var(--gold-bg)', color: 'var(--gold)', border: '1px solid var(--gold-border)' }}>Ek</span>}
        <button onClick={onGo} className="ml-auto text-[11.5px] font-medium text-[var(--accent)] hover:underline">Aç →</button>
      </header>
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {lines.map(([l, r]) => (
            <div key={l + r} className="text-[12px]">
              <span className="text-[var(--muted)]">{l}</span>
              <span className="ml-1.5 font-semibold text-[var(--ink)] tnum">{r}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] pt-3">{children}</div>
      </div>
    </section>
  )
}

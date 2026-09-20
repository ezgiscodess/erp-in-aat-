import { useMemo } from 'react'
import { goNoGoCriteria } from '../data/mock'
import { Badge, Bar, Btn, Card, Kpi, PageHead, ReadOnlyNote, Table, Td, Th } from '../components/ui'
import { num, pct } from '../lib/format'

const THRESHOLD = 60

/** Ağırlıklı kriterlerle teklife girme kararı. Skor kuraldan gelir; karar insana aittir. */
export function GoNoGo({ writable, role }: { writable: boolean; role: string }) {
  const { total, groups } = useMemo(() => {
    const w = goNoGoCriteria.reduce((a, c) => a + c.weight, 0)
    const s = goNoGoCriteria.reduce((a, c) => a + c.weight * c.score, 0) / w
    const map = new Map<string, { weight: number; score: number }>()
    for (const c of goNoGoCriteria) {
      const g = map.get(c.group) ?? { weight: 0, score: 0 }
      g.weight += c.weight
      g.score += c.weight * c.score
      map.set(c.group, g)
    }
    return {
      total: s,
      groups: [...map.entries()].map(([name, g]) => ({ name, weight: g.weight, score: g.score / g.weight })),
    }
  }, [])

  const verdict = total >= THRESHOLD + 10 ? 'GO' : total >= THRESHOLD - 10 ? 'ŞARTLI GO' : 'NO-GO'
  const verdictTone = verdict === 'GO' ? 'ok' : verdict === 'ŞARTLI GO' ? 'warn' : 'crit'

  const conditions = [
    'Gecikme cezası tavanının %15’ten %10’a indirilmesi zeyilname ile talep edilsin.',
    'Ödeme süresi çelişkisi (60/90 gün) yazılı olarak netleşsin; 90 gün kalırsa teklife finansman maliyeti eklensin.',
    'Rıhtımın doğu ucu için ek sondaj yapılsın veya kazık kalemi birim fiyatlı kalsın.',
    'İş deneyim oranı için iş ortaklığı kurgusu 2 Ekim’e kadar netleşsin.',
  ]

  return (
    <>
      <PageHead
        title="Go / No-Go Analiz"
        note="Kriterler ağırlıklandırılır, skor otomatik hesaplanır. Nihai karar yönetime aittir ve gerekçesiyle kaydedilir."
        right={<>
          <Btn disabled={!writable}>Kriter ekle</Btn>
          <Btn disabled={!writable}>Ağırlıkları düzenle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Card title="Sonuç" help={`Ağırlıklı kriter puanlarının ortalaması. Eşik değeri ${THRESHOLD} puandır: üstü GO, 10 puan altına kadar ŞARTLI GO, daha düşüğü NO-GO önerisi verir.`}>
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="text-[52px] font-extrabold leading-none tnum"
                style={{ color: verdictTone === 'ok' ? 'var(--ok)' : verdictTone === 'warn' ? 'var(--warn)' : 'var(--crit)' }}>
                {num(total, 1)}
              </div>
              <Badge tone={verdictTone} dot>{verdict}</Badge>
              <div className="w-full">
                <Bar value={total} tone={verdictTone} height={10} />
                <div className="mt-1 flex justify-between text-[11px] text-[var(--faint)] tnum">
                  <span>0</span><span>eşik {THRESHOLD}</span><span>100</span>
                </div>
              </div>
              <p className="text-center text-[12.5px] leading-relaxed text-[var(--muted)]">
                Teknik ve stratejik uyum güçlü; ticari ve sözleşmesel koşullar zayıf.
                Aşağıdaki dört koşul karşılanırsa teklife girilmesi öneriliyor.
              </p>
            </div>
          </Card>

          <div className="mt-4">
            <Card title="Şartlı GO koşulları" help="Teklife girilmesi için karşılanması gereken koşullar. Karşılanmazsa karar No-Go’ya döner.">
              <ol className="flex list-decimal flex-col gap-2 pl-4 text-[12.5px] leading-relaxed text-[var(--ink)]">
                {conditions.map((c) => <li key={c}>{c}</li>)}
              </ol>
              <div className="mt-3 flex gap-2">
                <Btn disabled={!writable}>No-Go öner</Btn>
                <Btn primary disabled={!writable}>Şartlı GO onayına gönder</Btn>
              </div>
              <p className="mt-2 text-[11.5px] text-[var(--faint)]">
                Onay yetkisi C-Suite rolündedir; karar ve gerekçesi kayıt altına alınır.
              </p>
            </Card>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:col-span-8">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Beklenen marj" value={pct(7.4, 1)} sub="Hedef %10" tone="warn"
              help="Ön maliyet çalışmasına göre beklenen kâr marjı. Metraj × havuz fiyatı üzerinden hesaplanır; risk karşılıkları düşüldükten sonraki nettir." />
            <Kpi label="En düşük skor" value="Nakit yükü 38" sub="90 gün ödeme + avans yok" tone="crit"
              help="Kriterler arasında en düşük puanı alan başlık. Kararı en çok zorlayan konuyu gösterir." />
            <Kpi label="Karar tarihi" value="2 Eki 2026" sub="Yönetim kurulu" tone="accent"
              help="Go / No-Go kararının alınacağı tarih. Teklif teslim tarihinden geriye doğru planlanır." />
          </div>

          <Card title="Kriter grupları" help="Kriterler gruplara ayrılır; her grubun toplam ağırlığı ve ağırlıklı puanı gösterilir.">
            <div className="flex flex-col gap-3">
              {groups.map((g) => (
                <div key={g.name}>
                  <div className="mb-1 flex items-center justify-between text-[12.5px]">
                    <span className="font-medium text-[var(--ink)]">{g.name}</span>
                    <span className="text-[var(--muted)] tnum">{num(g.score, 0)} / 100 · ağırlık {pct(g.weight)}</span>
                  </div>
                  <Bar value={g.score} tone={g.score >= 70 ? 'ok' : g.score >= 50 ? 'warn' : 'crit'} />
                </div>
              ))}
            </div>
          </Card>

          <Card title="Kriterler" help="Ağırlık: kriterin karara etkisi. Puan: 0–100 arası değerlendirme. Kaynak: bilginin hangi çalışmadan geldiği." pad={false}>
            <Table head={
              <tr>
                <Th w={150}>Grup</Th>
                <Th w={230}>Kriter</Th>
                <Th w={70} right>Ağırlık</Th>
                <Th w={150}>Puan</Th>
                <Th w={240}>Not</Th>
                <Th w={150}>Kaynak</Th>
              </tr>
            }>
              {goNoGoCriteria.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--surface-2)]">
                  <Td nowrap><span className="text-[var(--muted)]">{c.group}</span></Td>
                  <Td><span className="font-medium text-[var(--ink)]">{c.label}</span></Td>
                  <Td right>{pct(c.weight)}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <div className="w-24"><Bar value={c.score} tone={c.score >= 70 ? 'ok' : c.score >= 50 ? 'warn' : 'crit'} /></div>
                      <span className="tnum text-[12px] text-[var(--muted)]">{c.score}</span>
                    </div>
                  </Td>
                  <Td><span className="text-[12.5px] text-[var(--muted)]">{c.note}</span></Td>
                  <Td nowrap><span className="text-[11.5px] text-[var(--faint)]">{c.source}</span></Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>
      </div>
    </>
  )
}

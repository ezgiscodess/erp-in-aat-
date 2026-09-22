import { useMemo, useState } from 'react'
import { goNoGoCriteria } from '../data/mock'
import { Badge, Bar, Btn, Card, ExportButtons, Kpi, PageHead, ReadOnlyNote, Table, Td, Th } from '../components/ui'
import { num, pct } from '../lib/format'

const THRESHOLD = 60

type TodoState = 'Yapılmadı' | 'Yapıldı' | 'Kabul edildi'

const TODO_TONE: Record<TodoState, 'crit' | 'ok' | 'neutral'> = {
  'Yapılmadı': 'crit',
  'Yapıldı': 'ok',
  'Kabul edildi': 'neutral',
}

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

  /** Şartlı GO koşulları bir yapılacaklar listesidir: her madde işaretlenebilir. */
  const [todos, setTodos] = useState<{ id: string; text: string; state: TodoState; owner: string }[]>([
    { id: 'T1', text: 'Gecikme cezası tavanının %15’ten %10’a indirilmesi zeyilname ile talep edilsin.', state: 'Yapıldı', owner: 'Teklif' },
    { id: 'T2', text: 'Ödeme süresi çelişkisi (60/90 gün) yazılı olarak netleşsin; 90 gün kalırsa teklife finansman maliyeti eklensin.', state: 'Yapılmadı', owner: 'PMO' },
    { id: 'T3', text: 'Rıhtımın doğu ucu için ek sondaj yapılsın veya kazık kalemi birim fiyatlı kalsın.', state: 'Kabul edildi', owner: 'Teknik' },
    { id: 'T4', text: 'İş deneyim oranı için iş ortaklığı kurgusu 2 Ekim’e kadar netleşsin.', state: 'Yapılmadı', owner: 'C-Suite' },
  ])

  /** Açıklamalar elle düzeltilebilir: AI'ın yazdığı nota kullanıcı ekleme yapabilir. */
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(goNoGoCriteria.map((c) => [c.id, c.note])),
  )
  const [editing, setEditing] = useState<string | null>(null)

  const done = todos.filter((t) => t.state !== 'Yapılmadı').length

  return (
    <>
      <PageHead
        title="Go / No-Go Analiz"
        note="Kriterler ağırlıklandırılır, skor otomatik hesaplanır. Nihai karar yönetime aittir ve gerekçesiyle kaydedilir."
        right={<>
          <ExportButtons />
          <Btn disabled={!writable}>Kriter ekle</Btn>
          <Btn disabled={!writable}>Ağırlıkları düzenle</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      {/* Sonuç en başta — beş kutu */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Kpi label="Sonuç" value={num(total, 1)} sub={`${verdict} · eşik ${THRESHOLD}`} tone={verdictTone}
          help={`Ağırlıklı kriter puanlarının ortalaması. Eşik ${THRESHOLD} puandır: üstü GO, 10 puan altına kadar ŞARTLI GO, daha düşüğü NO-GO önerisi verir.`} />
        <Kpi label="Beklenen marj" value={pct(7.4, 1)} sub="Hedef %10" tone="warn"
          help="Ön maliyet çalışmasına göre beklenen kâr marjı. Metraj × havuz fiyatı üzerinden hesaplanır; risk karşılıkları düşüldükten sonraki nettir." />
        <Kpi label="En düşük skor" value="Nakit yükü 38" sub="90 gün ödeme + avans yok" tone="crit"
          help="Kriterler arasında en düşük puanı alan başlık. Kararı en çok zorlayan konuyu gösterir." />
        <Kpi label="Açık koşul" value={todos.length - done} sub={`${done} / ${todos.length} tamamlandı`} tone={done === todos.length ? 'ok' : 'warn'}
          help="Şartlı GO için karşılanması gereken koşullardan henüz kapanmayanlar." />
        <Kpi label="Karar tarihi" value="2 Eki 2026" sub="Yönetim kurulu" tone="accent"
          help="Go / No-Go kararının alınacağı tarih. Teklif teslim tarihinden geriye doğru planlanır." />
      </div>

      {/* Solda kriter grupları, sağda koşul listesi */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card title="Kriter grupları" help="Kriterler gruplara ayrılır; her grubun toplam ağırlığı ve ağırlıklı puanı gösterilir. Kısa çubuk, o başlıkta zayıf olduğumuz anlamına gelir.">
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
              <div className="mt-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-[24px] font-extrabold leading-none tnum" style={{ color: `var(--${verdictTone})` }}>{num(total, 1)}</span>
                  <Badge tone={verdictTone} dot>{verdict}</Badge>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--muted)]">
                  Teknik ve stratejik uyum güçlü; ticari ve sözleşmesel koşullar zayıf.
                  Yandaki dört koşul karşılanırsa teklife girilmesi öneriliyor.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card
            title="Şartlı GO koşulları"
            help="Teklife girilmesi için karşılanması gereken koşullar. Her madde yapıldı, yapılmadı ya da idarece kabul edildi olarak işaretlenir; yeni doküman yüklenip analiz edildiğinde AI bu değişikliği yakalar ve maddeyi günceller."
            right={<Badge tone={done === todos.length ? 'ok' : 'warn'}>{done} / {todos.length}</Badge>}
            pad={false}
          >
            <div className="flex flex-col">
              {todos.map((t, i) => (
                <div key={t.id} className="flex flex-wrap items-start gap-2 border-b border-[var(--border)] px-4 py-2.5 last:border-0">
                  <span className="mono mt-0.5 text-[11px] text-[var(--faint)]">{i + 1}.</span>
                  <span className="min-w-[220px] flex-1 text-[12.5px] leading-relaxed"
                    style={{
                      color: t.state === 'Yapıldı' ? 'var(--faint)' : 'var(--ink)',
                      textDecoration: t.state === 'Yapıldı' ? 'line-through' : undefined,
                    }}>
                    {t.text}
                    <span className="ml-1.5 text-[11px] text-[var(--faint)]">· {t.owner}</span>
                  </span>
                  <span className="flex flex-shrink-0 items-center gap-1">
                    {(['Yapıldı', 'Yapılmadı', 'Kabul edildi'] as TodoState[]).map((st) => {
                      const on = t.state === st
                      return (
                        <button key={st} disabled={!writable}
                          onClick={() => setTodos((list) => list.map((x) => (x.id === t.id ? { ...x, state: st } : x)))}
                          className="rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-45"
                          style={on
                            ? { background: `var(--${TODO_TONE[st]}-bg)`, borderColor: `var(--${TODO_TONE[st]})`, color: `var(--${TODO_TONE[st]})` }
                            : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--faint)' }}>
                          {st}
                        </button>
                      )
                    })}
                  </span>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 bg-[var(--surface-2)] px-4 py-2.5">
                <Btn small disabled={!writable}>+ Koşul ekle</Btn>
                <span className="text-[11.5px] text-[var(--faint)]">
                  Yeni zeyilname analiz edildiğinde karşılanan koşullar otomatik işaretlenir.
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Kriter tablosu — karar düğmeleri burada */}
      <Card
        title="Kriterler"
        help="Ağırlık: kriterin karara etkisi. Puan: 0–100 arası değerlendirme. Açıklamaya tıklayıp elle ekleme yapabilirsiniz; düzeltilen açıklama işaretlenir."
        right={<>
          <Btn small disabled={!writable}>No-Go öner</Btn>
          <Btn small primary disabled={!writable}>Şartlı GO onayına gönder</Btn>
        </>}
        pad={false}
      >
        <Table head={
          <tr>
            <Th w={230}>Kriter</Th>
            <Th w={56} right>Ağırlık</Th>
            <Th w={110}>Puan</Th>
            <Th w={260}>Açıklama</Th>
            <Th w={140}>Kaynak</Th>
          </tr>
        }>
          {goNoGoCriteria.map((c) => (
            <tr key={c.id} className="hover:bg-[var(--surface-2)]">
              <Td>
                <div className="text-[11px] text-[var(--faint)]">{c.group}</div>
                <div className="font-medium text-[var(--ink)]">{c.label}</div>
              </Td>
              <Td right>{pct(c.weight)}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="w-20"><Bar value={c.score} tone={c.score >= 70 ? 'ok' : c.score >= 50 ? 'warn' : 'crit'} /></div>
                  <span className="tnum text-[12px] text-[var(--muted)]">{c.score}</span>
                </div>
              </Td>
              <Td>
                {editing === c.id ? (
                  <textarea
                    autoFocus
                    value={notes[c.id]}
                    onChange={(e) => setNotes((n) => ({ ...n, [c.id]: e.target.value }))}
                    onBlur={() => setEditing(null)}
                    rows={2}
                    className="w-full resize-y rounded border border-[var(--accent)] bg-[var(--surface)] p-1.5 text-[12px] text-[var(--ink)] outline-none"
                  />
                ) : (
                  <button
                    disabled={!writable}
                    onClick={() => setEditing(c.id)}
                    title="Açıklamayı elle düzenle"
                    className="w-full text-left text-[12.5px] text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    {notes[c.id]}
                    {notes[c.id] !== c.note && <span className="ml-1.5 text-[10.5px] text-[var(--gold)]">· elle düzeltildi</span>}
                  </button>
                )}
              </Td>
              <Td nowrap><span className="text-[11.5px] text-[var(--faint)]">{c.source}</span></Td>
            </tr>
          ))}
        </Table>
      </Card>
    </>
  )
}

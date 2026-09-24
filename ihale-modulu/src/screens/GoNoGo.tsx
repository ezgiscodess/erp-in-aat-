import { useMemo, useState } from 'react'
import { goNoGoCriteria } from '../data/mock'
import type { GoNoGoCriterion } from '../data/types'
import { Badge, Bar, Btn, Card, ExportButtons, Field, IconBtn, Kpi, Modal, PageHead, ReadOnlyNote, RowActions, Table, Td, Th } from '../components/ui'
import { num, pct } from '../lib/format'

const THRESHOLD = 60
const ME = 'e.yilmaz'

type TodoState = 'Yapılmadı' | 'Yapıldı' | 'Kabul edildi'

const TODO_TONE: Record<TodoState, 'crit' | 'ok' | 'neutral'> = {
  'Yapılmadı': 'crit',
  'Yapıldı': 'ok',
  'Kabul edildi': 'neutral',
}

/** Görev atanabilecek ekip — ileride kullanıcı yönetiminden gelir. */
const PEOPLE: { id: string; role: string }[] = [
  { id: 'e.yilmaz', role: 'Teklif' },
  { id: 'a.koc', role: 'Teklif' },
  { id: 'm.demir', role: 'Teknik' },
  { id: 's.kaya', role: 'Teknik' },
  { id: 'm.aydin', role: 'PMO' },
  { id: 'b.sahin', role: 'Finans' },
  { id: 'h.arslan', role: 'Hukuk' },
  { id: 'k.ozturk', role: 'C-Suite' },
]

/**
 * Kriter grubunun standart sorumlusu. Her ihalede aynı kalır;
 * sonraki ihale çalışmalarında sabitlenip yalnızca gerekirse değiştirilir.
 */
const GROUP_OWNER: Record<string, string> = {
  'Stratejik uyum': 'k.ozturk',
  'Teknik yeterlilik': 'm.demir',
  'Ticari': 'a.koc',
  'Sözleşmesel risk': 'h.arslan',
  'Kaynak & kapasite': 'm.aydin',
  'Rekabet': 'e.yilmaz',
}

interface Action { by: string; at: string }

interface Todo {
  id: string
  text: string
  /** Bağlı olduğu Go/No-Go kriteri (varsa) */
  criterionId?: string
  assignees: string[]
  state: TodoState
  /** Durumu son değiştiren kişi */
  action?: Action
}

function today() {
  return new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

/** Ağırlıklı kriterlerle teklife girme kararı. Skor kuraldan gelir; karar insana aittir. */
export function GoNoGo({ writable, role }: { writable: boolean; role: string }) {
  const [criteria, setCriteria] = useState<GoNoGoCriterion[]>(goNoGoCriteria)
  /** Eklenen / düzenlenen kriter — 'new': yeni kriter */
  const [adding, setAdding] = useState<GoNoGoCriterion | 'new' | null>(null)
  /** Eklenen / düzenlenen To-Do */
  const [addingTodo, setAddingTodo] = useState<Todo | 'new' | null>(null)

  /**
   * Ağırlıklar arka planda çalışır: ekranda yalnızca puanlar görünür.
   * Henüz puanlanmamış (yeni eklenen) kriterler skora katılmaz.
   */
  const { total, groups } = useMemo(() => {
    const scored = criteria.filter((c) => c.score > 0)
    const w = scored.reduce((a, c) => a + c.weight, 0)
    const s = scored.reduce((a, c) => a + c.weight * c.score, 0) / w
    const map = new Map<string, { weight: number; score: number }>()
    for (const c of scored) {
      const g = map.get(c.group) ?? { weight: 0, score: 0 }
      g.weight += c.weight
      g.score += c.weight * c.score
      map.set(c.group, g)
    }
    return {
      total: s,
      groups: [...map.entries()].map(([name, g]) => ({ name, score: g.score / g.weight })),
    }
  }, [criteria])

  const verdict = total >= THRESHOLD + 10 ? 'GO' : total >= THRESHOLD - 10 ? 'ŞARTLI GO' : 'NO-GO'
  const verdictTone = verdict === 'GO' ? 'ok' : verdict === 'ŞARTLI GO' ? 'warn' : 'crit'

  /** Kriterin sorumlusunun onayı / aksiyonu */
  const [approvals, setApprovals] = useState<Record<string, Action>>({
    G1: { by: 'k.ozturk', at: '18.09' },
    G2: { by: 'k.ozturk', at: '18.09' },
    G3: { by: 'm.demir', at: '19.09' },
    G5: { by: 'm.demir', at: '19.09' },
    G11: { by: 'm.aydin', at: '20.09' },
  })

  /** Teklife girmeden önce yapılacaklar: her madde bir veya birden fazla kişiye atanır. */
  const [todos, setTodos] = useState<Todo[]>([
    { id: 'T1', text: 'Gecikme cezası tavanının %15’ten %10’a indirilmesi zeyilname ile talep edilsin.', criterionId: 'G9', assignees: ['e.yilmaz', 'h.arslan'], state: 'Yapıldı', action: { by: 'e.yilmaz', at: '20.09' } },
    { id: 'T2', text: 'Ödeme süresi çelişkisi (60/90 gün) yazılı olarak netleşsin; 90 gün kalırsa teklife finansman maliyeti eklensin.', criterionId: 'G7', assignees: ['m.aydin', 'b.sahin'], state: 'Yapılmadı' },
    { id: 'T3', text: 'Rıhtımın doğu ucu için ek sondaj yapılsın veya kazık kalemi birim fiyatlı kalsın.', criterionId: 'G3', assignees: ['m.demir'], state: 'Kabul edildi', action: { by: 'm.demir', at: '21.09' } },
    { id: 'T4', text: 'İş deneyim oranı için iş ortaklığı kurgusu 2 Ekim’e kadar netleşsin.', criterionId: 'G1', assignees: ['k.ozturk'], state: 'Yapılmadı' },
  ])

  /** Açıklamalar elle düzeltilebilir: AI'ın yazdığı nota kullanıcı ekleme yapabilir. */
  const [notes, setNotes] = useState<Record<string, string>>(
    Object.fromEntries(goNoGoCriteria.map((c) => [c.id, c.note])),
  )
  const [editing, setEditing] = useState<string | null>(null)

  const done = todos.filter((t) => t.state !== 'Yapılmadı').length
  const labelOf = (id?: string) => criteria.find((c) => c.id === id)?.label

  return (
    <>
      <PageHead
        title="Go / No-Go Analiz"
        note="Her kriterin arka planda bir ağırlığı vardır; skor puanlar ve ağırlıklardan otomatik hesaplanır. Ağırlık, kriter eklenirken girilir. Nihai karar yönetime aittir ve gerekçesiyle kaydedilir."
        right={<>
          <ExportButtons />
          <Btn primary disabled={!writable} onClick={() => setAdding('new')}>+ Kriter ekle</Btn>
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
        <Kpi label="Açık To-Do" value={todos.length - done} sub={`${done} / ${todos.length} tamamlandı`} tone={done === todos.length ? 'ok' : 'warn'}
          help="Teklife girmeden önce kapanması gereken yapılacaklardan henüz tamamlanmayanlar." />
        <Kpi label="Karar tarihi" value="2 Eki 2026" sub="Yönetim kurulu" tone="accent"
          help="Go / No-Go kararının alınacağı tarih. Teklif teslim tarihinden geriye doğru planlanır." />
      </div>

      <Card title="Kriter grupları" help="Kriterler gruplara ayrılır; her grubun ağırlıklı puanı gösterilir. Kısa çubuk, o başlıkta zayıf olduğumuz anlamına gelir.">
        <div className="grid grid-cols-1 gap-x-8 gap-y-3 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.name}>
              <div className="mb-1 flex items-center justify-between text-[12.5px]">
                <span className="font-medium text-[var(--ink)]">{g.name}</span>
                <span className="text-[var(--muted)] tnum">{num(g.score, 0)} / 100</span>
              </div>
              <Bar value={g.score} tone={g.score >= 70 ? 'ok' : g.score >= 50 ? 'warn' : 'crit'} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <span className="text-[24px] font-extrabold leading-none tnum" style={{ color: `var(--${verdictTone})` }}>{num(total, 1)}</span>
          <Badge tone={verdictTone} dot>{verdict}</Badge>
          <p className="min-w-[240px] flex-1 text-[12px] leading-relaxed text-[var(--muted)]">
            Teknik ve stratejik uyum güçlü; ticari ve sözleşmesel koşullar zayıf.
            Aşağıdaki To-Do listesi kapanırsa teklife girilmesi öneriliyor.
          </p>
        </div>
      </Card>

      {/* Kriter tablosu — karar düğmeleri burada */}
      <Card
        title="Kriterler"
        help="Puan: 0–100 arası değerlendirme. Ağırlıklar arka planda tutulur ve skoru hesaplarken kullanılır. Her kriter grubunun standart bir sorumlusu vardır; sorumlu değerlendirmeyi onayladığında kim ve ne zaman onayladığı kaydedilir."
        right={<>
          <Btn small disabled={!writable}>No-Go öner</Btn>
          <Btn small primary disabled={!writable}>Şartlı GO onayına gönder</Btn>
        </>}
        pad={false}
      >
        <Table head={
          <tr>
            <Th w={230}>Kriter</Th>
            <Th w={110}>Puan</Th>
            <Th w={250}>Açıklama</Th>
            <Th w={130}>Kaynak</Th>
            <Th w={100}>Sorumlu</Th>
            <Th w={120} center>Onay / aksiyon</Th>
            <Th w={72} center>İşlem</Th>
          </tr>
        }>
          {criteria.map((c) => {
            const owner = GROUP_OWNER[c.group] ?? '—'
            const ok = approvals[c.id]
            return (
              <tr key={c.id} className="hover:bg-[var(--surface-2)]">
                <Td>
                  <div className="text-[11px] text-[var(--faint)]">{c.group}</div>
                  <div className="font-medium text-[var(--ink)]">{c.label}</div>
                </Td>
                <Td>
                  {c.score > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="w-20"><Bar value={c.score} tone={c.score >= 70 ? 'ok' : c.score >= 50 ? 'warn' : 'crit'} /></div>
                      <span className="tnum text-[12px] text-[var(--muted)]">{c.score}</span>
                    </div>
                  ) : <Badge tone="warn">Puanlanacak</Badge>}
                </Td>
                <Td>
                  {editing === c.id ? (
                    <textarea
                      autoFocus
                      value={notes[c.id] ?? c.note}
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
                      {notes[c.id] ?? c.note}
                      {notes[c.id] != null && notes[c.id] !== c.note && <span className="ml-1.5 text-[10.5px] text-[var(--gold)]">· elle düzeltildi</span>}
                    </button>
                  )}
                </Td>
                <Td nowrap><span className="text-[11.5px] text-[var(--faint)]">{c.source}</span></Td>
                <Td nowrap><span className="mono text-[11.5px] text-[var(--ink)]">{owner}</span></Td>
                <Td nowrap center>
                  {ok ? (
                    <div className="text-[11.5px]">
                      <Badge tone="ok" dot>Onaylandı</Badge>
                      <div className="mono mt-0.5 text-[10.5px] text-[var(--faint)]">{ok.by} · {ok.at}</div>
                    </div>
                  ) : (
                    <Btn small minW={72} disabled={!writable}
                      onClick={() => setApprovals((a) => ({ ...a, [c.id]: { by: ME, at: today() } }))}>Onayla</Btn>
                  )}
                </Td>
                <Td nowrap center>
                  <RowActions name={c.label} disabled={!writable} onEdit={() => setAdding(c)}
                    onDelete={() => setCriteria((list) => list.filter((x) => x.id !== c.id))} />
                </Td>
              </tr>
            )
          })}
        </Table>
      </Card>

      {/* To-Do — teklife girmeden önce yapılacaklar */}
      <Card
        title="To-Do"
        help="Teklife girilmesi için kapanması gereken işler. Her madde bir kritere bağlanabilir ve bir veya birden fazla kişiye atanır. Durum değiştiğinde kimin ve ne zaman aksiyon aldığı kaydedilir; yeni doküman analiz edildiğinde AI karşılanan maddeleri yakalar."
        right={<>
          <Badge tone={done === todos.length ? 'ok' : 'warn'}>{done} / {todos.length}</Badge>
          <IconBtn icon="add" primary title="To-Do ekle" disabled={!writable} onClick={() => setAddingTodo('new')} />
        </>}
        pad={false}
      >
        <Table head={
          <tr>
            <Th w={28}>#</Th>
            <Th w={360}>Yapılacak iş ve bağlı kriter</Th>
            <Th w={160}>Atanan</Th>
            <Th w={250} center>Durum</Th>
            <Th w={120} center>Aksiyon alan</Th>
            <Th w={72} center>İşlem</Th>
          </tr>
        }>
          {todos.map((t, i) => (
            <tr key={t.id} className="hover:bg-[var(--surface-2)]">
              <Td><span className="mono text-[11px] text-[var(--faint)]">{i + 1}</span></Td>
              <Td>
                <div className="text-[12.5px] leading-relaxed"
                  style={{
                    color: t.state === 'Yapıldı' ? 'var(--faint)' : 'var(--ink)',
                    textDecoration: t.state === 'Yapıldı' ? 'line-through' : undefined,
                  }}>
                  {t.text}
                </div>
                {t.criterionId && <div className="mt-0.5 text-[11px] text-[var(--accent)]">↳ {labelOf(t.criterionId)}</div>}
              </Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {t.assignees.map((a) => <span key={a} className="mono rounded bg-[var(--surface-3)] px-1.5 py-0.5 text-[11px] text-[var(--ink)]">{a}</span>)}
                </div>
              </Td>
              <Td nowrap center>
                <span className="inline-flex items-center gap-1">
                  {(['Yapıldı', 'Yapılmadı', 'Kabul edildi'] as TodoState[]).map((st) => {
                    const on = t.state === st
                    return (
                      <button key={st} disabled={!writable}
                        onClick={() => setTodos((list) => list.map((x) => (x.id === t.id ? { ...x, state: st, action: { by: ME, at: today() } } : x)))}
                        className="rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors disabled:opacity-45"
                        style={on
                          ? { background: `var(--${TODO_TONE[st]}-bg)`, borderColor: `var(--${TODO_TONE[st]})`, color: `var(--${TODO_TONE[st]})` }
                          : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--faint)' }}>
                        {st}
                      </button>
                    )
                  })}
                </span>
              </Td>
              <Td nowrap center>
                {t.action
                  ? <span className="mono text-[11px] text-[var(--muted)]">{t.action.by} · {t.action.at}</span>
                  : <span className="text-[var(--faint)]">—</span>}
              </Td>
              <Td nowrap center>
                <RowActions name="Bu To-Do" disabled={!writable} onEdit={() => setAddingTodo(t)}
                  onDelete={() => setTodos((list) => list.filter((x) => x.id !== t.id))} />
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      {adding && (
        <AddCriterion
          criterion={adding === 'new' ? null : adding}
          groups={[...new Set(criteria.map((c) => c.group))]}
          onClose={() => setAdding(null)}
          onAdd={(c) => {
            setCriteria((list) => (list.some((x) => x.id === c.id) ? list.map((x) => (x.id === c.id ? c : x)) : [...list, c]))
            setNotes((n) => ({ ...n, [c.id]: c.note }))
            setAdding(null)
          }}
        />
      )}

      {addingTodo && (
        <AddTodo
          todo={addingTodo === 'new' ? null : addingTodo}
          criteria={criteria}
          onClose={() => setAddingTodo(null)}
          onAdd={(t) => {
            setTodos((list) => (list.some((x) => x.id === t.id) ? list.map((x) => (x.id === t.id ? t : x)) : [...list, t]))
            setAddingTodo(null)
          }}
        />
      )}
    </>
  )
}

/** Yeni To-Do: bir kriterden seçilir ya da serbest yazılır; bir veya birden fazla kişiye atanır. */
function AddTodo({ todo, criteria, onClose, onAdd }: {
  todo: Todo | null; criteria: GoNoGoCriterion[]; onClose: () => void; onAdd: (t: Todo) => void
}) {
  const [criterionId, setCriterionId] = useState(todo?.criterionId ?? '')
  const [text, setText] = useState(todo?.text ?? '')
  const [assignees, setAssignees] = useState<string[]>(todo?.assignees ?? [])
  const ready = text.trim().length > 5 && assignees.length > 0

  function toggle(id: string) {
    setAssignees((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]))
  }

  return (
    <Modal
      title={todo ? 'To-Do düzenle' : 'To-Do ekle'}
      note="Yapılacak işi yazın, isterseniz bir Go/No-Go kriterine bağlayın ve bir veya birden fazla kişiye atayın."
      onClose={onClose}
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{ready ? `${assignees.length} kişiye atanacak` : 'Açıklama ve en az bir atama zorunlu'}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={() => onAdd({
            ...(todo ?? { id: `T${Date.now()}`, state: 'Yapılmadı' as TodoState }),
            text: text.trim(), criterionId: criterionId || undefined, assignees,
          })}>{todo ? 'Kaydet' : 'Ekle'}</Btn>
        </span>
      </>}
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Bağlı kriter</span>
          <select value={criterionId} onChange={(e) => setCriterionId(e.target.value)}
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]">
            <option value="">— Kritere bağlı değil —</option>
            {criteria.map((c) => <option key={c.id} value={c.id}>{c.group} · {c.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">To-Do açıklaması</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
            placeholder="Ör. Kesin teminat için bankadan ek limit teyidi alınsın."
            className="resize-y rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
        </label>
        <div>
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Görev atama</div>
          <div className="flex flex-wrap gap-1.5">
            {PEOPLE.map((p) => {
              const on = assignees.includes(p.id)
              return (
                <button key={p.id} onClick={() => toggle(p.id)}
                  className="rounded-full border px-2.5 py-1 text-[12px] transition-colors"
                  style={on
                    ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                    : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--muted)' }}>
                  {on ? '✓ ' : ''}{p.id} <span className="opacity-60">· {p.role}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </Modal>
  )
}

/** Yeni kriter: adı, açıklaması ve ağırlığı kullanıcı tarafından girilir; puanı sonra verilir. */
function AddCriterion({ criterion, groups, onClose, onAdd }: {
  criterion: GoNoGoCriterion | null; groups: string[]; onClose: () => void; onAdd: (c: GoNoGoCriterion) => void
}) {
  const [label, setLabel] = useState(criterion?.label ?? '')
  const [note, setNote] = useState(criterion?.note ?? '')
  const [weight, setWeight] = useState(String(criterion?.weight ?? 5))
  const [group, setGroup] = useState(criterion?.group ?? groups[0] ?? 'Diğer')
  const ready = label.trim().length > 2 && Number(weight) > 0

  return (
    <Modal
      title={criterion ? 'Kriteri düzenle' : 'Kriter ekle'}
      note="Kriterin adını, ne anlama geldiğini ve karara ne kadar etki edeceğini (ağırlık) yazın. Puan, kriter eklendikten sonra verilir."
      onClose={onClose}
      footer={<>
        <span className="text-[11.5px] text-[var(--faint)]">{ready ? 'Eklenmeye hazır' : 'Kriter adı ve ağırlık zorunlu'}</span>
        <span className="ml-auto flex gap-2">
          <Btn onClick={onClose}>Vazgeç</Btn>
          <Btn primary disabled={!ready} onClick={() => onAdd({
            ...(criterion ?? { id: `N${Date.now()}`, score: 0, source: 'Elle eklendi' }),
            group, label: label.trim(), weight: Number(weight), note: note.trim() || '—',
          })}>{criterion ? 'Kaydet' : 'Ekle'}</Btn>
        </span>
      </>}
    >
      <div className="flex flex-col gap-3">
        <Field label="Kriter" value={label} onChange={setLabel} placeholder="Ör. Bölgede daha önce iş yapmış olmak" />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Açıklama</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Kriter neyi ölçüyor, nasıl puanlanacak?"
            className="resize-y rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ağırlık (%)" value={weight} onChange={setWeight} type="number"
            hint="Karara etkisi — diğer ağırlıklar buna göre oranlanır" />
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Grup</span>
            <select value={group} onChange={(e) => setGroup(e.target.value)}
              className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]">
              {groups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </label>
        </div>
      </div>
    </Modal>
  )
}

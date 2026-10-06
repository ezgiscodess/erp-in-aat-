import { useState } from 'react'
import { Badge, Btn, Chips, IconBtn, Modal, PageHead, RowActions } from '../../components/ui'

/**
 * Communication: uygulama içi sohbet (birebir ve grup) ve not defteri.
 * Not defteri yapılacaklar listesi mantığında çalışır: kişiye özel not ya da görev eklenir,
 * bir başkasıyla paylaşılır veya ona atanır.
 */

export const ME = 'e.yilmaz'
const PEOPLE = ['h.demir', 'b.yildiz', 'o.kara', 'm.aydin', 'k.aslan', 't.celik', 's.kaya']
const stamp = () => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

interface Msg { by: string; at: string; text: string }
interface Conv { id: string; name: string; group: boolean; members: string[]; unread: number; messages: Msg[] }

const seed: Conv[] = [
  {
    id: 'c1', name: 'Şantiye genel', group: true, members: ['h.demir', 'b.yildiz', 'o.kara', 'k.aslan', 't.celik'], unread: 3,
    messages: [
      { by: 'h.demir', at: '08:02', text: 'Günaydın. Bugün Depo C aks 8–12 makas montajına başlıyoruz, vinç 07:30’da hazır.' },
      { by: 'b.yildiz', at: '08:10', text: 'Gece ekibi aks 4–7’yi bitirdi, bulon kontrolleri öğlene kadar tamam.' },
      { by: 'k.aslan', at: '08:25', text: 'Dünkü kayıtlar onayınızda: SA-1045, SA-1046.' },
      { by: 'o.kara', at: '09:14', text: 'Sprinkler hidrostatik test pompası için SAS-123 açtım, onay bekliyor.' },
    ],
  },
  {
    id: 'c2', name: 'Planlama', group: true, members: ['m.aydin', 'h.demir', 's.kaya'], unread: 0,
    messages: [
      { by: 'm.aydin', at: 'Dün', text: 'Recovery planı RP-1 hazır, 30 gün kazanıyoruz. Yarın ana programa aktarmayı konuşalım.' },
      { by: 's.kaya', at: 'Dün', text: 'Haftalık rapor onayımda, akşam bakıyorum.' },
    ],
  },
  { id: 'c3', name: 'h.demir', group: false, members: ['h.demir'], unread: 1, messages: [{ by: 'h.demir', at: '09:40', text: 'CL-03 bildirim yazısı bugün çıkmalı, son gün 6 Ekim.' }] },
  { id: 'c4', name: 's.kaya', group: false, members: ['s.kaya'], unread: 0, messages: [{ by: ME, at: 'Pzt', text: 'Aylık rapor taslağı hazır, onayınıza gönderdim.' }] },
]

export interface Note {
  id: string
  text: string
  kind: 'Not' | 'Görev'
  done: boolean
  owner: string
  /** Görev birden fazla kişiye atanabilir */
  assignees?: string[]
  shared: string[]
  due?: string
}

export const seedNotes: Note[] = [
  { id: 'n1', text: 'CL-03 elektrik izni bildirim yazısını hazırla', kind: 'Görev', done: false, owner: ME, assignees: ['h.demir', 'o.kara'], shared: [], due: '2026-10-03' },
  { id: 'n2', text: 'Mobil vinç kira sözleşmesi Kasım uzatması', kind: 'Görev', done: false, owner: 'm.aydin', assignees: [ME], shared: [], due: '2026-10-10' },
  { id: 'n3', text: 'İşveren toplantısında rampa sayısı (CO-02) konuşulacak', kind: 'Not', done: false, owner: ME, shared: ['h.demir', 'm.aydin'] },
  { id: 'n4', text: 'Tuğla ekibi verim takibi — haftalık inxsa', kind: 'Görev', done: true, owner: ME, assignees: ['b.yildiz'], shared: [] },
  { id: 'n5', text: 'Kasım rüzgâr tahminlerini planlamaya gönder', kind: 'Not', done: false, owner: ME, shared: [] },
]

type NoteFilter = 'Tümü' | 'Notlarım' | 'Bana atanan' | 'Atadıklarım'

export function Communication() {
  const [convs, setConvs] = useState<Conv[]>(seed)
  const [sel, setSel] = useState('c1')
  const [draft, setDraft] = useState('')
  const [notes, setNotes] = useState<Note[]>(seedNotes)
  const [filter, setFilter] = useState<NoteFilter>('Tümü')
  const [newText, setNewText] = useState('')
  const [newKind, setNewKind] = useState<Note['kind']>('Not')
  const [target, setTarget] = useState<{ note: Note; mode: 'ata' | 'paylas' } | null>(null)
  const [newChat, setNewChat] = useState(false)
  const [editing, setEditing] = useState<Note | null>(null)

  const conv = convs.find((c) => c.id === sel)!
  function send() {
    if (!draft.trim()) return
    setConvs((l) => l.map((c) => (c.id === sel ? { ...c, messages: [...c.messages, { by: ME, at: stamp(), text: draft.trim() }] } : c)))
    setDraft('')
  }
  const shownNotes = notes.filter((n) => {
    if (filter === 'Notlarım') return n.owner === ME && !n.assignees?.length
    if (filter === 'Bana atanan') return !!n.assignees?.includes(ME)
    if (filter === 'Atadıklarım') return n.owner === ME && !!n.assignees?.some((a) => a !== ME)
    return n.owner === ME || !!n.assignees?.includes(ME) || n.shared.includes(ME)
  })
  const upd = (id: string, patch: Partial<Note>) => setNotes((l) => l.map((n) => (n.id === id ? { ...n, ...patch } : n)))

  return (
    <>
      <PageHead title="Communication" note="Uygulama içi sohbet (birebir ve grup) ve akıllı not defteri. Not defterine eklenen not ve görevler bir başkasıyla paylaşılabilir ya da ona atanabilir; atanan görev ilgili kişinin not defterine ve ana sayfasına düşer." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12" style={{ minHeight: 'calc(100vh - 220px)' }}>
        {/* ---------- 1. Sohbet ---------- */}
        <div className="flex overflow-hidden card xl:col-span-8">
          <div className="flex w-[230px] flex-shrink-0 flex-col border-r border-[var(--border)]">
            <div className="flex items-center border-b border-[var(--border)] px-3 py-2">
              <span className="text-[13px] font-semibold text-[var(--ink)]">Sohbetler</span>
              <span className="ml-auto"><IconBtn icon="add" title="Yeni sohbet" onClick={() => setNewChat(true)} /></span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {convs.map((c) => (
                <button key={c.id} onClick={() => { setSel(c.id); setConvs((l) => l.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x))) }}
                  className="flex w-full items-center gap-2.5 border-b border-[var(--border)] px-3 py-2.5 text-left hover:bg-[var(--surface-2)]"
                  style={sel === c.id ? { background: 'var(--accent-soft)' } : undefined}>
                  <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-[11px] font-bold"
                    style={{ background: c.group ? 'var(--accent-soft)' : 'var(--surface-3)', color: c.group ? 'var(--accent)' : 'var(--muted)' }}>
                    {c.group ? '#' : c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1">
                      <span className="truncate text-[12.5px] font-semibold text-[var(--ink)]">{c.name}</span>
                      <span className="ml-auto text-[10.5px] text-[var(--faint)]">{c.messages[c.messages.length - 1]?.at}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="truncate text-[11.5px] text-[var(--muted)]">{c.messages[c.messages.length - 1]?.text}</span>
                      {c.unread > 0 && <span className="ml-auto grid h-4 min-w-4 place-items-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">{c.unread}</span>}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2.5">
              <span className="text-[13.5px] font-semibold text-[var(--ink)]">{conv.group ? `# ${conv.name}` : conv.name}</span>
              <span className="text-[11.5px] text-[var(--muted)]">{conv.group ? `${conv.members.length + 1} kişi · ${conv.members.join(', ')}` : 'Birebir'}</span>
            </div>
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto bg-[var(--surface-2)] px-4 py-3" style={{ maxHeight: 'calc(100vh - 330px)' }}>
              {conv.messages.map((m, i) => {
                const mine = m.by === ME
                return (
                  <div key={i} className={`flex max-w-[75%] flex-col ${mine ? 'self-end items-end' : 'self-start'}`}>
                    {!mine && <span className="mono mb-0.5 text-[10.5px] text-[var(--muted)]">{m.by}</span>}
                    <span className="rounded-lg px-3 py-1.5 text-[12.5px] leading-relaxed"
                      style={mine ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}>
                      {m.text}
                    </span>
                    <span className="mt-0.5 text-[10px] text-[var(--faint)]">{m.at}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-2 border-t border-[var(--border)] px-3 py-2">
              <button title="Dosya ekle" className="grid h-8 w-8 place-items-center rounded-md border border-[var(--border)] text-[14px] text-[var(--muted)]">📎</button>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                placeholder="Mesaj yazın…" className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
              <Btn primary onClick={send}>Gönder</Btn>
            </div>
          </div>
        </div>

        {/* ---------- 2. Not defteri ---------- */}
        <div className="flex flex-col card xl:col-span-4">
          <div className="flex items-center border-b border-[var(--border)] px-3 py-2">
            <span className="text-[13px] font-semibold text-[var(--ink)]">Not defteri</span>
            <span className="ml-auto text-[11.5px] text-[var(--muted)]">{notes.filter((n) => n.assignees?.includes(ME) && !n.done).length} açık görevim</span>
          </div>
          <div className="border-b border-[var(--border)] p-3">
            <div className="flex gap-1.5">
              {(['Not', 'Görev'] as const).map((k) => (
                <button key={k} onClick={() => setNewKind(k)} className="rounded-full border px-2.5 py-0.5 text-[12px]"
                  style={newKind === k ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>{k}</button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input value={newText} onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newText.trim()) { setNotes((l) => [{ id: `n${Date.now()}`, text: newText.trim(), kind: newKind, done: false, owner: ME, shared: [] }, ...l]); setNewText('') } }}
                placeholder={newKind === 'Not' ? 'Not yazın…' : 'Görev yazın…'}
                className="flex-1 rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5 text-[12.5px] text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
              <IconBtn icon="add" primary title="Ekle" onClick={() => { if (newText.trim()) { setNotes((l) => [{ id: `n${Date.now()}`, text: newText.trim(), kind: newKind, done: false, owner: ME, shared: [] }, ...l]); setNewText('') } }} />
            </div>
          </div>
          <div className="border-b border-[var(--border)] px-3 py-2">
            <Chips<NoteFilter> value={filter} onChange={setFilter} items={(['Tümü', 'Notlarım', 'Bana atanan', 'Atadıklarım'] as NoteFilter[]).map((k) => ({ key: k, label: k }))} />
          </div>
          <div className="flex-1 overflow-y-auto">
            {shownNotes.map((n) => (
              <div key={n.id} className="flex items-start gap-2.5 border-b border-[var(--border)] px-3 py-2.5 last:border-0">
                {n.kind === 'Görev'
                  ? <input type="checkbox" checked={n.done} onChange={() => upd(n.id, { done: !n.done })} className="mt-1" />
                  : <span className="mt-0.5 text-[12px]">📝</span>}
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] leading-snug" style={{ color: n.done ? 'var(--faint)' : 'var(--ink)', textDecoration: n.done ? 'line-through' : undefined }}>{n.text}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-[10.5px]">
                    <Badge tone={n.kind === 'Görev' ? 'accent' : 'neutral'}>{n.kind}</Badge>
                    {!!n.assignees?.length && <span className="mono text-[var(--muted)]">{n.owner === ME ? `→ ${n.assignees.join(', ')}` : `${n.owner} atadı`}</span>}
                    {n.shared.length > 0 && <span className="text-[var(--muted)]">paylaşıldı: <span className="mono">{n.shared.join(', ')}</span></span>}
                    {n.due && <span className="text-[var(--warn-ink)]">son gün {new Date(n.due).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })}</span>}
                  </div>
                </div>
                <span className="flex flex-shrink-0 items-center gap-1">
                  <button onClick={() => setTarget({ note: n, mode: 'ata' })} className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--muted)] hover:text-[var(--accent)]">Ata</button>
                  <button onClick={() => setTarget({ note: n, mode: 'paylas' })} className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--muted)] hover:text-[var(--accent)]">Paylaş</button>
                  {n.owner === ME && <RowActions name="Bu not" onEdit={() => setEditing(n)} onDelete={() => setNotes((l) => l.filter((x) => x.id !== n.id))} />}
                </span>
              </div>
            ))}
            {shownNotes.length === 0 && <div className="px-3 py-6 text-center text-[12px] text-[var(--faint)]">Bu filtrede not yok.</div>}
          </div>
        </div>
      </div>

      {target && <AssignModal note={target.note} mode={target.mode} onClose={() => setTarget(null)}
        onSave={(people) => {
          if (target.mode === 'ata') upd(target.note.id, { assignees: people, kind: 'Görev' })
          else upd(target.note.id, { shared: people })
          setTarget(null)
        }} />}
      {editing && <NoteEditModal note={editing} onClose={() => setEditing(null)} onSave={(patch) => { upd(editing.id, patch); setEditing(null) }} />}
      {newChat && <NewChatModal onClose={() => setNewChat(false)} onCreate={(c) => { setConvs((l) => [c, ...l]); setSel(c.id); setNewChat(false) }} />}
    </>
  )
}

/** Ata ve Paylaş: bir veya birden fazla kişi (atanan not göreve döner) */
function AssignModal({ note, mode, onClose, onSave }: { note: Note; mode: 'ata' | 'paylas'; onClose: () => void; onSave: (p: string[]) => void }) {
  const [sel, setSel] = useState<string[]>(mode === 'ata' ? note.assignees ?? [] : note.shared)
  const toggle = (p: string) => setSel((s) => (s.includes(p) ? s.filter((x) => x !== p) : [...s, p]))
  return (
    <Modal title={mode === 'ata' ? 'Görev ata' : 'Paylaş'} onClose={onClose} note={note.text}
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn><Btn primary disabled={sel.length === 0} onClick={() => onSave(sel)}>{mode === 'ata' ? 'Ata' : 'Paylaş'}</Btn></span>}>
      <p className="mb-2 text-[12px] text-[var(--muted)]">{mode === 'ata' ? 'Birden fazla kişi seçebilirsiniz; görev seçilen herkesin not defterine ve ana sayfasına düşer.' : 'Seçilen kişiler notu kendi not defterlerinde görür.'}</p>
      <div className="mb-2 flex items-center gap-3 text-[11.5px]">
        <button className="font-medium text-[var(--accent)]" onClick={() => setSel(PEOPLE)}>Tümünü seç</button>
        <button className="text-[var(--muted)]" onClick={() => setSel([])}>Temizle</button>
        <span className="ml-auto text-[var(--muted)]">{sel.length} kişi seçili</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {PEOPLE.map((p) => {
          const on = sel.includes(p)
          return <button key={p} onClick={() => toggle(p)} className="mono rounded-full border px-2.5 py-1 text-[12px]"
            style={on ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>{on ? '✓ ' : ''}{p}</button>
        })}
      </div>
    </Modal>
  )
}

/** Not / görev düzenleme: metin, tür ve son gün */
function NoteEditModal({ note, onClose, onSave }: { note: Note; onClose: () => void; onSave: (p: Partial<Note>) => void }) {
  const [text, setText] = useState(note.text)
  const [kind, setKind] = useState<Note['kind']>(note.kind)
  const [due, setDue] = useState(note.due ?? '')
  const input = 'rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]'
  return (
    <Modal title={kind === 'Görev' ? 'Görevi düzenle' : 'Notu düzenle'} onClose={onClose}
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn><Btn primary disabled={!text.trim()} onClick={() => onSave({ text: text.trim(), kind, due: due || undefined })}>Kaydet</Btn></span>}>
      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5">
          {(['Not', 'Görev'] as const).map((k) => (
            <button key={k} onClick={() => setKind(k)} className="rounded-full border px-2.5 py-0.5 text-[12px]"
              style={kind === k ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>{k}</button>
          ))}
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Metin</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className={input} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Son gün</span>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={input} />
        </label>
      </div>
    </Modal>
  )
}

function NewChatModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Conv) => void }) {
  const [sel, setSel] = useState<string[]>([])
  const [name, setName] = useState('')
  const group = sel.length > 1
  return (
    <Modal title="Yeni sohbet" onClose={onClose} note="Bir kişi seçerseniz birebir, birden fazla seçerseniz grup sohbeti açılır."
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn>
        <Btn primary disabled={sel.length === 0 || (group && !name.trim())} onClick={() => onCreate({ id: `c${Date.now()}`, name: group ? name.trim() : sel[0], group, members: sel, unread: 0, messages: [] })}>Başlat</Btn></span>}>
      <div className="flex flex-wrap gap-1.5">
        {PEOPLE.map((p) => {
          const on = sel.includes(p)
          return <button key={p} onClick={() => setSel((s) => (on ? s.filter((x) => x !== p) : [...s, p]))} className="mono rounded-full border px-2.5 py-1 text-[12px]"
            style={on ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>{on ? '✓ ' : ''}{p}</button>
        })}
      </div>
      {group && (
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Grup adı</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ör. Çatı ekibi"
            className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none focus:border-[var(--accent)]" />
        </label>
      )}
    </Modal>
  )
}

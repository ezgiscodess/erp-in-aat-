import { useState } from 'react'
import { docs, project } from '../data/mock'
import { Badge, Btn, Card, DocViewer, Field, IconBtn, Kpi, Modal, PageHead, ReadOnlyNote, RowActions, StickyPane, Switch, Table, Td, Th } from '../components/ui'
import type { Tone } from '../components/ui'
import { moneyShort } from '../lib/format'

/**
 * Alternatif Teklif. Ana teklif, Kontrat Hazırlama'daki dokümanların şartlarına birebir uyularak hazırlanır.
 * Bu sayfada AI aynı şartları okuyup "şu şekilde de yapabilirsiniz" der: yöntem, malzeme, tasarım,
 * program ve ticari alternatifler. Seçilen öneriler alternatif teklifi oluşturur.
 */

type Category = 'Yöntem' | 'Malzeme' | 'Tasarım' | 'Program' | 'Ticari'
type Fit = 'Şartnameye uygun' | 'İşveren onayı gerekir' | 'Şartnameden sapma'

interface Proposal {
  id: string
  title: string
  category: Category
  /** Dokümandaki şart — ana teklif buna göre hazırlandı */
  requirement: string
  doc: string
  page: number
  clause: string
  /** AI önerisi */
  suggestion: string
  why: string
  /** Bedel farkı (EUR, eksi = tasarruf) ve süre farkı (gün, eksi = kısalma) */
  cost: number
  days: number
  risk: 'Düşük' | 'Orta' | 'Yüksek'
  fit: Fit
  watch: string
  included: boolean
}

const seed: Proposal[] = [
  {
    id: 'AT-01', title: 'Çelik boru kazık yerine öngerilmeli beton kazık (PHC)', category: 'Malzeme',
    requirement: 'Rıhtım kazıkları Ø1016 mm, 16 mm et kalınlığında spiral kaynaklı çelik boru kazık olarak imal edilecek ve katodik koruma uygulanacaktır.',
    doc: 'D3', page: 64, clause: 'Teknik Şartname 5.3.2',
    suggestion: 'Aynı taşıma kapasitesini Ø1000 mm PHC kazık ile sağlayabilirsiniz. Mersin’de iki üretici var; çelik boru ithalatına bağlı 60 günlük tedarik riski (R7) ortadan kalkar.',
    why: 'Zemin etüdü (D5, s.31) sürtünme kazığına uygun sıkı kum tabakası gösteriyor. Beton kazıkta katodik koruma gerekmez; bakım bedeli düşer.',
    cost: -3_900_000, days: -45, risk: 'Orta', fit: 'İşveren onayı gerekir',
    watch: 'Çakma sırasında kazık başı kırılma riski; deneme kazığı ve dinamik yükleme testi teklife eklenmeli.', included: true,
  },
  {
    id: 'AT-02', title: 'Tarama malzemesinin saha dolgusunda kullanılması', category: 'Yöntem',
    requirement: 'Tarama malzemesi İdare’nin gösterdiği 12 deniz mili uzaklıktaki döküm sahasına taşınacak; saha dolgusu ocak malzemesiyle yapılacaktır.',
    doc: 'D3', page: 38, clause: 'Teknik Şartname 3.4.1',
    suggestion: 'Kum ağırlıklı tarama malzemesini elekten geçirip saha dolgusunda kullanabilirsiniz. Hem döküm taşıması hem ocak malzemesi alımı azalır.',
    why: 'Zemin etüdünde tarama bölgesindeki malzemenin %70’i SP-SM sınıfında; dolgu şartını (Tek. Şart. 3.6) sağlıyor.',
    cost: -1_650_000, days: -20, risk: 'Düşük', fit: 'Şartnameye uygun',
    watch: 'Çevre izni (ÇED) kapsamında malzemenin yeniden kullanımı için bildirim yapılmalı.', included: true,
  },
  {
    id: 'AT-03', title: 'Tabliyede yarı prekast sistem', category: 'Tasarım',
    requirement: 'Rıhtım tabliyesi yerinde dökme betonarme olarak, iskele üzerinde kalıp kurularak yapılacaktır.',
    doc: 'D3', page: 71, clause: 'Teknik Şartname 5.6.1',
    suggestion: 'Tabliyeyi prekast plak + yerinde döküm tabaka olarak yapabilirsiniz. Deniz üzerindeki kalıp işçiliği azalır, hava koşullarına bağımlılık düşer.',
    why: 'Prekast kiriş imalatı zaten sahada (iş kalemi 10). Aynı tesis plak üretimine de yeter.',
    cost: -820_000, days: -35, risk: 'Orta', fit: 'İşveren onayı gerekir',
    watch: 'Tasarım sorumluluğu yükleniciye geçer; statik hesap ve bağımsız kontrol bedeli teklife eklenmeli.', included: false,
  },
  {
    id: 'AT-04', title: 'Rıhtımı iki bölgede paralel yürütme', category: 'Program',
    requirement: 'İşin tamamı 720 takvim gününde bitirilecek ve tek seferde geçici kabule sunulacaktır.',
    doc: 'D1', page: 22, clause: 'İdari Şartname md. 12',
    suggestion: 'Rıhtımı kuzey ve güney bölgesine ayırıp ikinci kazık ekibiyle paralel yürütebilirsiniz. Kuzey bölge 14. ayda kısmi kabule hazır olur; işveren erken işletmeye başlar.',
    why: 'Kritik yol kazık çakımından geçiyor (8 iş). İkinci ekip kritik yolu 60 gün kısaltıyor.',
    cost: 640_000, days: -60, risk: 'Düşük', fit: 'İşveren onayı gerekir',
    watch: 'Kısmi kabul sözleşmede tanımlı değil; ayrı bir madde ile önerilmeli.', included: true,
  },
  {
    id: 'AT-05', title: 'Konteyner sahasında parke taşı yerine silindirle sıkıştırılmış beton (RCC)', category: 'Malzeme',
    requirement: 'Konteyner stok sahası 10 cm beton parke taşı ile kaplanacaktır.',
    doc: 'D3', page: 112, clause: 'Teknik Şartname 8.2',
    suggestion: 'Stok sahasını 30 cm RCC ile kaplayabilirsiniz. Ağır istif makinelerinde oturma ve bakım ihtiyacı azalır.',
    why: 'Benzer liman sahalarında RCC kaplama 15 yıllık bakım maliyetini yaklaşık yarıya indiriyor.',
    cost: 380_000, days: -10, risk: 'Düşük', fit: 'Şartnameden sapma',
    watch: 'İşveren kaplama tipini işletme gerekçesiyle seçmiş olabilir; soru-cevap listesinde sorulmalı.', included: false,
  },
  {
    id: 'AT-06', title: 'Çelik için fiyat farkı klozu', category: 'Ticari',
    requirement: 'Sözleşme bedeli sabittir; fiyat farkı ödenmez.',
    doc: 'D2', page: 48, clause: 'Özel Şartlar 13.8',
    suggestion: 'Alternatif teklifte çelik kalemlerine endeksli fiyat farkı önerebilirsiniz. Böylece ana teklifteki %6 çelik risk payını bedelden çıkarırsınız.',
    why: 'Teklif Riskleri’ndeki çelik fiyat riski karşılığı 1,9 M EUR. Endeksleme ile bu pay teklif bedelinden düşer.',
    cost: -1_900_000, days: 0, risk: 'Yüksek', fit: 'Şartnameden sapma',
    watch: 'İşveren kabul etmezse alternatif teklif değerlendirme dışı kalabilir; ana teklifle karıştırılmamalı.', included: false,
  },
]

const FIT_TONE: Record<Fit, Tone> = { 'Şartnameye uygun': 'ok', 'İşveren onayı gerekir': 'warn', 'Şartnameden sapma': 'crit' }
const RISK_TONE: Record<Proposal['risk'], Tone> = { Düşük: 'ok', Orta: 'warn', Yüksek: 'crit' }
const signed = (v: number, unit: string) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${unit === 'EUR' ? moneyShort(Math.abs(v), 'EUR') : `${Math.abs(v)} ${unit}`}`

export function AlternatifTeklif({ writable, role }: { writable: boolean; role: string }) {
  const [list, setList] = useState<Proposal[]>(seed)
  const [selId, setSelId] = useState(seed[0].id)
  const [editing, setEditing] = useState<Proposal | 'new' | null>(null)
  const [asking, setAsking] = useState(false)
  const sel = list.find((p) => p.id === selId) ?? list[0]
  const doc = docs.find((d) => d.id === sel?.doc)

  const chosen = list.filter((p) => p.included)
  const base = project.estimatedValue
  const altCost = base + chosen.reduce((a, p) => a + p.cost, 0)
  const altDays = project.durationDays + chosen.reduce((a, p) => a + p.days, 0)
  const toggle = (id: string) => setList((l) => l.map((p) => (p.id === id ? { ...p, included: !p.included } : p)))

  return (
    <>
      <PageHead
        title="Alternatif Teklif"
        note="Ana teklif, Kontrat Hazırlama’daki dokümanların şartlarına birebir uyularak hazırlanır. Burada AI aynı şartları okuyup “şu şekilde de yapabilirsiniz” der. Açık olan öneriler alternatif teklifi oluşturur; ana teklif değişmez."
        right={<>
          <Btn disabled={!writable} onClick={() => setAsking(true)}>AI’dan öneri iste</Btn>
          <Btn primary>Karşılaştırma raporu</Btn>
        </>}
      />

      {!writable && <ReadOnlyNote role={role} />}

      <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--ok)] bg-[var(--ok-bg)] px-3 py-2 text-[12.5px] text-[var(--ink)]">
        <Badge tone="ok" dot>Alternatif teklife izin var</Badge>
        İdari Şartname md. 23: alternatif teklif, ana teklifle birlikte ve ayrı zarfta verilebilir. Ana teklif verilmeden alternatif değerlendirilmez.
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Ana teklif" value={moneyShort(base, 'EUR')} sub={`${project.durationDays} gün · dokümana birebir uygun`}
          help="Kontrat Hazırlama’daki şartlara göre hazırlanan teklif." />
        <Kpi label="Alternatif teklif" value={moneyShort(altCost, 'EUR')} sub={`${altDays} gün · ${chosen.length} öneri açık`} tone="accent"
          help="Ana teklif + açık olan önerilerin bedel ve süre etkisi." />
        <Kpi label="Bedel farkı" value={signed(altCost - base, 'EUR')} sub={`Ana teklife göre ${altCost < base ? '−' : '+'}%${Math.abs(((altCost - base) / base) * 100).toLocaleString('tr-TR', { maximumFractionDigits: 1 })}`}
          tone={altCost <= base ? 'ok' : 'crit'} />
        <Kpi label="Süre farkı" value={signed(altDays - project.durationDays, 'gün')} sub="Kritik yol üzerinden" tone={altDays <= project.durationDays ? 'ok' : 'crit'} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-7">
          <Card title={`AI önerileri (${list.length})`} help="Her öneri dokümandaki bir şarta dayanır. Satıra tıklayınca sağda şartın geçtiği sayfa ve önerinin gerekçesi açılır. Anahtar önerinin alternatif teklife girip girmeyeceğini belirler; kapalı öneri listede kalır."
            right={<IconBtn icon="add" title="Öneri ekle" disabled={!writable} onClick={() => setEditing('new')} />} pad={false}>
            <Table dense head={<tr><Th w={46} center>Teklifte</Th><Th w={60}>No</Th><Th>Öneri</Th><Th w={80}>Tür</Th><Th right w={86}>Bedel</Th><Th right w={64}>Süre</Th><Th w={150}>Uygunluk</Th><Th w={84} center>İşlem</Th></tr>}>
              {list.map((p) => (
                <tr key={p.id} onClick={() => setSelId(p.id)} className="cursor-pointer hover:bg-[var(--surface-2)]"
                  style={{ background: sel?.id === p.id ? 'var(--accent-soft)' : undefined, opacity: p.included ? 1 : 0.7 }}>
                  <Td center><Switch on={p.included} disabled={!writable} onChange={() => toggle(p.id)} title={p.included ? 'Alternatif teklifte — çıkar' : 'Alternatif teklife ekle'} /></Td>
                  <Td mono nowrap>{p.id}</Td>
                  <Td><span className="text-[12.5px] font-medium text-[var(--ink)]">{p.title}</span></Td>
                  <Td nowrap><span className="text-[12px] text-[var(--muted)]">{p.category}</span></Td>
                  <Td right nowrap><span style={{ color: p.cost < 0 ? 'var(--ok)' : p.cost > 0 ? 'var(--crit)' : 'var(--muted)' }}>{signed(p.cost, 'EUR')}</span></Td>
                  <Td right nowrap><span style={{ color: p.days < 0 ? 'var(--ok)' : 'var(--muted)' }}>{p.days ? signed(p.days, 'gün') : '—'}</span></Td>
                  <Td nowrap><Badge tone={FIT_TONE[p.fit]}>{p.fit}</Badge></Td>
                  <Td center nowrap>
                    <RowActions name={p.id} disabled={!writable} onEdit={() => setEditing(p)}
                      onDelete={() => { setList((l) => l.filter((x) => x.id !== p.id)); if (selId === p.id) setSelId(list[0].id) }} />
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Ana teklif ile karşılaştırma" help="Açık olan önerilerle oluşan alternatif teklifin ana teklifle yan yana hâli." pad={false}>
            <Table dense head={<tr><Th w={200}>Kalem</Th><Th>Ana teklif</Th><Th>Alternatif teklif</Th><Th>Fark</Th></tr>}>
              {[
                ['Teklif bedeli', moneyShort(base, 'EUR'), moneyShort(altCost, 'EUR'), signed(altCost - base, 'EUR')],
                ['Süre', `${project.durationDays} gün`, `${altDays} gün`, signed(altDays - project.durationDays, 'gün')],
                ['Kısmi kabul', 'Yok', chosen.some((p) => p.id === 'AT-04') ? 'Kuzey bölge 14. ay' : 'Yok', '—'],
                ['Tasarım sorumluluğu', 'İşveren', chosen.some((p) => p.category === 'Tasarım') ? 'Tabliye yükleniciye geçer' : 'İşveren', '—'],
                ['İşveren onayı gereken', '—', `${chosen.filter((p) => p.fit !== 'Şartnameye uygun').length} öneri`, '—'],
              ].map(([k, a, b, d]) => (
                <tr key={k}>
                  <Td><span className="font-medium text-[var(--ink)]">{k}</span></Td>
                  <Td>{a}</Td><Td><b className="text-[var(--ink)]">{b}</b></Td><Td nowrap>{d}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </div>

        <div className="xl:col-span-5">
          <StickyPane>
            {sel && (
              <div className="flex flex-col gap-3">
                <Card title={sel.title} subtitle={sel.id}>
                  <div className="flex flex-col gap-3 text-[12.5px] leading-relaxed">
                    <div>
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Dokümandaki şart · {sel.clause}</div>
                      <div className="text-[var(--muted)]">{sel.requirement}</div>
                    </div>
                    <div className="rounded-md border-l-[3px] border-[var(--accent)] bg-[var(--accent-soft)] px-3 py-2">
                      <div className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--accent)]">AI · şu şekilde de yapabilirsiniz</div>
                      <div className="text-[var(--ink)]">{sel.suggestion}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Gerekçe</div>
                      <div className="text-[var(--muted)]">{sel.why}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['Bedel', signed(sel.cost, 'EUR'), sel.cost <= 0 ? 'ok' : 'crit'],
                        ['Süre', sel.days ? signed(sel.days, 'gün') : '—', sel.days <= 0 ? 'ok' : 'crit'],
                        ['Risk', sel.risk, RISK_TONE[sel.risk]],
                      ].map(([l, v, t]) => (
                        <div key={l} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1.5">
                          <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--faint)]">{l}</div>
                          <div className="text-[14px] font-bold tnum" style={{ color: `var(--${t})` }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-md border border-[var(--warn)] bg-[var(--warn-bg)] px-3 py-2 text-[12px] text-[var(--ink)]">
                      <b>Dikkat:</b> {sel.watch}
                    </div>
                  </div>
                </Card>
                {doc && <DocViewer doc={doc.name} page={sel.page} pages={doc.pages} clause={sel.clause} body={sel.requirement} />}
              </div>
            )}
          </StickyPane>
        </div>
      </div>

      {editing && (
        <ProposalForm p={editing === 'new' ? null : editing} onClose={() => setEditing(null)}
          onSave={(p) => {
            setList((l) => (editing === 'new' ? [...l, p] : l.map((x) => (x.id === editing.id ? p : x))))
            setSelId(p.id)
            setEditing(null)
          }} nextId={`AT-${String(list.length + 1).padStart(2, '0')}`} />
      )}
      {asking && <AskModal onClose={() => setAsking(false)} />}
    </>
  )
}

function ProposalForm({ p, nextId, onClose, onSave }: { p: Proposal | null; nextId: string; onClose: () => void; onSave: (p: Proposal) => void }) {
  const [v, setV] = useState({ title: p?.title ?? '', suggestion: p?.suggestion ?? '', clause: p?.clause ?? '', cost: String(p?.cost ?? 0), days: String(p?.days ?? 0), category: p?.category ?? 'Yöntem' as Category })
  const set = (k: keyof typeof v) => (x: string) => setV((o) => ({ ...o, [k]: x }))
  return (
    <Modal title={p ? `${p.id} düzenle` : 'Öneri ekle'} wide onClose={onClose}
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn>
        <Btn primary disabled={!v.title.trim()} onClick={() => onSave({
          ...(p ?? { id: nextId, requirement: '—', doc: 'D3', page: 1, why: 'Ekip tarafından eklendi.', risk: 'Orta', fit: 'İşveren onayı gerekir', watch: 'Değerlendirilecek.', included: false }),
          title: v.title.trim(), suggestion: v.suggestion, clause: v.clause || '—', cost: Number(v.cost) || 0, days: Number(v.days) || 0, category: v.category,
        } as Proposal)}>Kaydet</Btn></span>}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Öneri" value={v.title} onChange={set('title')} /></div>
        <div className="sm:col-span-2"><Field label="Açıklama" value={v.suggestion} onChange={set('suggestion')} /></div>
        <Field label="Dayandığı madde" value={v.clause} onChange={set('clause')} placeholder="Teknik Şartname 5.3.2" />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Tür</span>
          <select value={v.category} onChange={(e) => set('category')(e.target.value)} className="rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-2 text-[13px] text-[var(--ink)] outline-none">
            {(['Yöntem', 'Malzeme', 'Tasarım', 'Program', 'Ticari'] as Category[]).map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <Field label="Bedel farkı (EUR)" value={v.cost} onChange={set('cost')} type="number" hint="Eksi değer tasarruf" />
        <Field label="Süre farkı (gün)" value={v.days} onChange={set('days')} type="number" hint="Eksi değer kısalma" />
      </div>
    </Modal>
  )
}

/** AI'ya yönlendirilmiş öneri isteği — hangi başlıkta alternatif arandığı seçilir */
function AskModal({ onClose }: { onClose: () => void }) {
  const [focus, setFocus] = useState<string[]>(['Yöntem', 'Program'])
  const [text, setText] = useState('')
  return (
    <Modal title="AI’dan öneri iste" onClose={onClose}
      note="AI, Kontrat Hazırlama’daki dokümanları ve ana teklifin kalemlerini okuyup seçilen başlıklarda alternatif arar. Her öneri madde ve sayfa referansıyla gelir."
      footer={<span className="ml-auto flex gap-2"><Btn onClick={onClose}>Vazgeç</Btn><Btn primary onClick={onClose}>Önerileri getir</Btn></span>}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {['Yöntem', 'Malzeme', 'Tasarım', 'Program', 'Ticari'].map((c) => {
            const on = focus.includes(c)
            return (
              <button key={c} onClick={() => setFocus((f) => (on ? f.filter((x) => x !== c) : [...f, c]))}
                className="rounded-full border px-3 py-1 text-[12px] font-medium"
                style={on ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}>{c}</button>
            )
          })}
        </div>
        <Field label="Ek yönlendirme (isteğe bağlı)" value={text} onChange={setText} placeholder="Ör. deniz üstü işlerde süreyi kısaltacak yöntemler" />
      </div>
    </Modal>
  )
}

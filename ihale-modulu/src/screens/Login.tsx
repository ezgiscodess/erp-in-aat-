import { useState } from 'react'
import { project } from '../data/mock'
import { Btn, Field } from '../components/ui'
import { personas } from '../lib/roles'
import type { Persona } from '../lib/roles'

/**
 * Giriş ekranı. Kullanıcı tipi (ihale ekibi, patron, proje ekibi) girişte seçilir ve
 * yalnızca o tipin ekranları açılır. İnce yetkiler arka planda tanımlanır.
 */
export function Login({ onLogin }: { onLogin: (p: Persona) => void }) {
  const [mail, setMail] = useState('e.yilmaz@anadoluinsaat.com.tr')
  const [pass, setPass] = useState('••••••••')
  const [persona, setPersona] = useState<Persona>('ihale')

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-2)] p-6">
      <div className="w-full max-w-[880px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm md:grid md:grid-cols-2">
        {/* Sol: marka tarafı */}
        <div className="flex flex-col justify-between gap-8 p-8" style={{ background: 'var(--accent-soft)' }}>
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg text-[14px] font-extrabold text-white" style={{ background: 'var(--accent)' }}>İK</span>
            <div>
              <div className="text-[15px] font-bold tracking-tight text-[var(--ink)]">İnşaat ERP</div>
              <div className="text-[11.5px] text-[var(--muted)]">İhale, kontrat ve proje yönetimi</div>
            </div>
          </div>

          <div>
            <h1 className="text-[20px] font-bold leading-snug text-[var(--ink)]">
              İhale dosyasını yükleyin,<br />analiz sizi beklesin.
            </h1>
            <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--muted)]">
              Şartname ve sözleşme dosyaları taranır; kritik şartlar, riskler ve metraj kalemleri
              kaynak maddesiyle birlikte çıkarılır. Her işin verisi kendi alanında, diğer işlerden yalıtılmış durur.
            </p>
          </div>

          <div className="text-[11.5px] text-[var(--muted)]">{project.company}</div>
        </div>

        {/* Sağ: giriş formu */}
        <div className="flex flex-col gap-4 p-8">
          <div>
            <h2 className="text-[16px] font-bold text-[var(--ink)]">Giriş yapın</h2>
            <p className="mt-0.5 text-[12px] text-[var(--muted)]">Kurumsal hesabınızla devam edin.</p>
          </div>

          <Field label="E-posta" value={mail} onChange={setMail} placeholder="ad.soyad@firma.com" />
          <Field label="Parola" value={pass} onChange={setPass} type="password" />

          <div>
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--faint)]">Giriş tipi</div>
            <div className="grid grid-cols-3 gap-2">
              {personas.map((p) => {
                const on = persona === p.key
                return (
                  <button key={p.key} onClick={() => setPersona(p.key)}
                    className="rounded-lg border px-2.5 py-2 text-left transition-colors"
                    style={on
                      ? { borderColor: 'var(--accent)', background: 'var(--accent-soft)' }
                      : { borderColor: 'var(--border)', background: 'var(--surface)' }}>
                    <span className="block text-[12.5px] font-semibold" style={{ color: on ? 'var(--accent)' : 'var(--ink)' }}>{p.label}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-snug text-[var(--muted)]">{p.note}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[12px] text-[var(--muted)]">
            <input type="checkbox" defaultChecked /> Beni hatırla
            <span className="ml-auto cursor-pointer text-[var(--accent)]">Parolamı unuttum</span>
          </div>

          <button
            onClick={() => onLogin(persona)}
            className="rounded-md px-3 py-2.5 text-[13.5px] font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            Giriş yap
          </button>

          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-[11px] text-[var(--faint)]">veya</span>
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>
          <Btn onClick={() => onLogin(persona)}>Kurumsal hesapla (SSO) giriş</Btn>

          <p className="mt-1 text-[11px] leading-relaxed text-[var(--faint)]">
            Görsel prototip — herhangi bir bilgiyle giriş yapabilirsiniz. Gerçek sistemde giriş tipi
            hesaba bağlı gelir; ince yetkiler (PMO, kısım şefi, şantiye şefi…) arka planda tanımlanır.
          </p>
        </div>
      </div>
    </div>
  )
}

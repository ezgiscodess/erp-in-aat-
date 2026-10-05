import type { BoqItem, WorkGroup } from '../data/types'
import { boqItems } from '../data/mock'

/**
 * Birim fiyat / ölçüm standardı. Pool sekmesinde seçilir; Take-Offs bu standardın kod kırılımıyla
 * metraj çıkarır, BOQ aynı kodlarla birim fiyatı eşleştirir.
 */
export type MethodKey = 'rics' | 'cesmm4' | 'master' | 'inhouse' | 'import'

export interface MethodDef {
  key: MethodKey
  label: string
  /** Kısa açıklama — standardın ne olduğu */
  note: string
  /** Kod kırılımının seviyeleri, üstten alta */
  levels: string[]
  /** Örnek kod biçimi */
  pattern: string
}

export const methods: MethodDef[] = [
  {
    key: 'rics', label: 'RICS', pattern: '7.2.1.1',
    note: 'RICS NRM2 — İngiliz ölçüm kuralları. Bina ve genel inşaat işlerinde iş bölümü (work section) bazlı kırılım.',
    levels: ['İş bölümü (work section)', 'Kalem', 'Alt kalem', 'Ayrıntı'],
  },
  {
    key: 'cesmm4', label: 'CESMM4', pattern: 'P.3.4.2',
    note: 'Civil Engineering Standard Method of Measurement 4. baskı — altyapı ve liman gibi inşaat mühendisliği işleri için sınıf (class) bazlı kırılım.',
    levels: ['Sınıf (class)', '1. bölüm', '2. bölüm', '3. bölüm'],
  },
  {
    key: 'master', label: 'Master Method', pattern: '03 30 00',
    note: 'MasterFormat tipi bölüm (division) kırılımı. Uluslararası projelerde ve şartname numaralandırmasında kullanılır.',
    levels: ['Bölüm (division)', 'Alt bölüm', 'Kalem'],
  },
  {
    key: 'inhouse', label: 'In-House', pattern: '1000487',
    note: 'Firmanın kendi poz numaraları. Geçmiş projelerde kullanılan birim fiyat havuzu bu kodlarla tutulur.',
    levels: ['İş grubu', 'Poz no'],
  },
  {
    key: 'import', label: 'Import', pattern: 'Firmaya özel',
    note: 'Firmanın kendi metodu varsa Excel veya PDF olarak yüklenir; AI kod kırılımını okuyup Take-Offs ve BOQ’ya uygular.',
    levels: ['Yüklenen dosyadaki seviyeler'],
  },
]

export function methodOf(key: MethodKey): MethodDef {
  return methods.find((m) => m.key === key)!
}

/** İş grubunun her standarttaki üst seviye karşılığı */
const GROUP_CODE: Record<WorkGroup, { rics: string; cesmm4: string; master: string }> = {
  'Mobilizasyon': { rics: '1', cesmm4: 'A', master: '01 50' },
  'Kazı İşleri': { rics: '5', cesmm4: 'E', master: '31 23' },
  'Zemin İşleri': { rics: '7', cesmm4: 'P', master: '31 60' },
  'Betonarme İşleri': { rics: '11', cesmm4: 'F', master: '03 30' },
  'İnce İşler': { rics: '28', cesmm4: 'V', master: '09 90' },
  'Mekanik İşleri': { rics: '33', cesmm4: 'I', master: '33 40' },
  'Elektrik İşleri': { rics: '39', cesmm4: 'Z', master: '26 05' },
  'IT': { rics: '40', cesmm4: 'Z', master: '27 10' },
  'Cephe & Çatı İşleri': { rics: '18', cesmm4: 'W', master: '07 40' },
  'Peyzaj': { rics: '35', cesmm4: 'R', master: '32 90' },
  'Test ve Devreye Alma': { rics: '1', cesmm4: 'B', master: '01 91' },
}

/** Bir metraj kaleminin seçilen standarttaki kodu. Prototipte grup içindeki sıradan türetilir. */
export function codeFor(b: BoqItem, method: MethodKey): string {
  if (method === 'inhouse' || method === 'import') return b.no
  const n = boqItems.filter((x) => x.group === b.group).findIndex((x) => x.id === b.id) + 1 || 1
  const g = GROUP_CODE[b.group]
  if (method === 'rics') return `${g.rics}.${n}.1.${(n % 3) + 1}`
  if (method === 'cesmm4') return `${g.cesmm4}.${n}.${(n % 4) + 1}.${(n % 5) + 1}`
  return `${g.master} ${String(n * 10).padStart(2, '0')}`
}

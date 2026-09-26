import { PageHead } from '../../components/ui'
import { findItem } from '../menu'

/** Kurgusu yazılmış ama ekranı henüz çizilmemiş sayfalar — kullanıcının tarifi burada durur. */
export function Placeholder({ page }: { page: string }) {
  const { group, item } = findItem(page)
  const title = item ? `${group?.label} · ${item.label}` : group?.label ?? page
  const note = item?.note ?? group?.note ?? 'Bu ekranın kurgusu henüz yazılmadı.'
  return (
    <>
      <PageHead title={title} note={note} />
      <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface)] p-6 text-center">
        <div className="text-[13.5px] font-semibold text-[var(--ink)]">Bu ekran sıradaki adımlarda çizilecek</div>
        <p className="mx-auto mt-2 max-w-xl text-[12.5px] leading-relaxed text-[var(--muted)]">{note}</p>
        {item && group?.note && <p className="mx-auto mt-2 max-w-xl text-[12px] leading-relaxed text-[var(--faint)]">{group.label}: {group.note}</p>}
      </div>
    </>
  )
}

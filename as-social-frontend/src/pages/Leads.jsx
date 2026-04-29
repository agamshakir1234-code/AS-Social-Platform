import { useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { getLeads, createLead, updateLead, deleteLead } from '@/services/api'
import { useToast } from '@/context/ToastContext'
import PageHeader from '@/components/ui/PageHeader'
import Table from '@/components/ui/Table'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { formatDate, formatCurrency, LEAD_SOURCES } from '@/utils/helpers'

const EMPTY = { name: '', email: '', phone: '', source: 'instagram', status: 'new', value: '', notes: '' }
const STATUSES = ['new','contacted','qualified','converted','lost']

export default function Leads() {
  const { toast } = useToast()
  const { data, loading, refetch } = useApi(getLeads)

  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('')
  const [modal,    setModal]    = useState(false)
  const [confirm,  setConfirm]  = useState(null)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const openCreate = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit   = (row) => { setEditing(row); setForm({ ...EMPTY, ...row }); setModal(true) }
  const closeModal = () => { setModal(false); setEditing(null) }

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, value: form.value ? parseFloat(form.value) : 0 }
      if (editing) { await updateLead(editing.id, payload); toast('Lead updated', 'success') }
      else         { await createLead(payload);              toast('Lead created', 'success') }
      closeModal(); refetch()
    } catch (err) { toast(err?.response?.data?.message || 'Failed to save', 'error') }
    finally { setSaving(false) }
  }

  const doDelete = async () => {
    setDeleting(true)
    try { await deleteLead(confirm); toast('Lead deleted', 'success'); setConfirm(null); refetch() }
    catch { toast('Failed to delete', 'error') }
    finally { setDeleting(false) }
  }

  let rows = data?.data || data || []
  if (filter) rows = rows.filter((l) => l.status === filter)
  if (search) rows = rows.filter((l) =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    { key: 'name',   label: 'Name',   render: (v) => <span className="font-medium text-slate-100">{v}</span> },
    { key: 'email',  label: 'Email' },
    { key: 'source', label: 'Source', render: (v) => <span className="capitalize">{v}</span> },
    { key: 'status', label: 'Status', render: (v) => <Badge status={v} /> },
    { key: 'value',  label: 'Value',  render: (v) => v ? formatCurrency(v) : '—' },
    { key: 'createdAt', label: 'Created', render: (v) => formatDate(v) },
    {
      key: '_actions', label: '',
      render: (_, row) => (
        <div className="flex items-center gap-1 justify-end">
          <button onClick={() => openEdit(row)} className="btn-secondary px-2 py-1.5"><Pencil size={13} /></button>
          <button onClick={() => setConfirm(row.id)} className="btn-danger px-2 py-1.5"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Leads"
        subtitle={`${rows.length} lead${rows.length !== 1 ? 's' : ''}`}
        action={<button onClick={openCreate} className="btn-primary"><Plus size={15} /> New Lead</button>}
      />

      <div className="card">
        <div className="px-5 py-4 border-b border-bg-border flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input className="input pl-8 h-9 text-xs" placeholder="Search leads…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-auto h-9 text-xs" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
        </div>
        <Table columns={columns} data={rows} loading={loading} emptyMessage="No leads yet — add your first!" />
      </div>

      <Modal open={modal} onClose={closeModal} title={editing ? 'Edit Lead' : 'New Lead'}>
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={set('name')} required placeholder="Maria Oliveira" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="maria@email.com" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="+55 11 9999-9999" />
            </div>
            <div>
              <label className="label">Source</label>
              <select className="input" value={form.source} onChange={set('source')}>
                {LEAD_SOURCES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Estimated Value (R$)</label>
              <input className="input" type="number" min="0" step="0.01" value={form.value} onChange={set('value')} placeholder="1500.00" />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input resize-none" rows={3} value={form.notes} onChange={set('notes')} placeholder="Lead notes…" />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm} onClose={() => setConfirm(null)} onConfirm={doDelete}
        loading={deleting} title="Delete Lead"
        message="This lead will be permanently removed."
      />
    </div>
  )
}

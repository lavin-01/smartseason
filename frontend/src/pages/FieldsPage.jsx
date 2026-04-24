import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFields, createField, deleteField, getAgents } from '../api/services';
import FieldCard from '../components/FieldCard';
import styles from './FieldsPage.module.css';

const STAGES = ['PLANTED', 'GROWING', 'READY', 'HARVESTED'];
const STATUSES = ['ACTIVE', 'AT_RISK', 'COMPLETED'];

function CreateFieldModal({ onClose, onCreated }) {
  const [agents, setAgents] = useState([]);
  const [form, setForm] = useState({
    name: '', cropType: '', plantingDate: '', stage: 'PLANTED',
    location: '', sizeHectares: '', assignedAgentId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAgents().then(r => setAgents(r.data.agents)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await createField(form);
      onCreated(res.data.field);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create field');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add New Field</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Field Name *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. North Valley Plot A" />
            </div>
            <div className={styles.formField}>
              <label>Crop Type *</label>
              <input name="cropType" value={form.cropType} onChange={handleChange} required placeholder="e.g. Maize" />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Planting Date *</label>
              <input name="plantingDate" type="date" value={form.plantingDate} onChange={handleChange} required />
            </div>
            <div className={styles.formField}>
              <label>Initial Stage</label>
              <select name="stage" value={form.stage} onChange={handleChange}>
                {STAGES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Location</label>
              <input name="location" value={form.location} onChange={handleChange} placeholder="e.g. Nakuru North" />
            </div>
            <div className={styles.formField}>
              <label>Size (hectares)</label>
              <input name="sizeHectares" type="number" step="0.1" value={form.sizeHectares} onChange={handleChange} placeholder="e.g. 3.5" />
            </div>
          </div>
          <div className={styles.formField}>
            <label>Assign to Agent</label>
            <select name="assignedAgentId" value={form.assignedAgentId} onChange={handleChange}>
              <option value="">— Unassigned —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          {error && <div className={styles.formError}>{error}</div>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creating…' : 'Create Field'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FieldsPage() {
  const { isAdmin } = useAuth();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterStage, setFilterStage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadFields();
  }, []);

  const loadFields = async () => {
    try {
      const res = await getFields();
      setFields(res.data.fields);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreated = (field) => setFields((p) => [field, ...p]);

  const filtered = [...fields].filter((f) => {
    if (filterStage && f.stage !== filterStage) return false;
    if (filterStatus && f.status !== filterStatus) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) &&
        !f.cropType.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((left, right) => right.insight.priorityScore - left.insight.priorityScore);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fields</h1>
          <p className={styles.sub}>{fields.length} field{fields.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button className={styles.addBtn} onClick={() => setShowCreate(true)}>
            + Add Field
          </button>
        )}
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          placeholder="Search by name or crop…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className={styles.filter} value={filterStage} onChange={(e) => setFilterStage(e.target.value)}>
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
        <select className={styles.filter} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
        </select>
      </div>

      {!loading && filtered.length > 0 && (
        <div className={styles.resultsMeta}>
          Showing {filtered.length} field{filtered.length === 1 ? '' : 's'}, ranked by operational priority.
        </div>
      )}

      {loading ? (
        <div className={styles.grid}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="skeleton" style={{height: 150, borderRadius: 'var(--radius)'}} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🌾</div>
          <div>No fields found</div>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((f, i) => (
            <div key={f.id} style={{ animationDelay: `${i * 0.04}s` }}>
              <FieldCard field={f} showAgent={isAdmin} />
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateFieldModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

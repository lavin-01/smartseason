import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { addFieldUpdate, deleteField, getAgents, getField, updateField } from '../api/services';
import { PriorityBadge, StageBadge, StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import styles from './FieldDetailPage.module.css';

const STAGES = ['PLANTED', 'GROWING', 'READY', 'HARVESTED'];

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateValue) {
  return new Date(dateValue).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function severityLabel(severity) {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'medium':
      return 'Medium';
    default:
      return 'Low';
  }
}

export default function FieldDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updateNote, setUpdateNote] = useState('');
  const [updateStage, setUpdateStage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [agents, setAgents] = useState([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadField();

    if (isAdmin) {
      getAgents()
        .then((response) => setAgents(response.data.agents))
        .catch(() => {});
    }
  }, [id, isAdmin]);

  const loadField = async () => {
    try {
      const response = await getField(id);
      setField(response.data.field);
    } catch (requestError) {
      setError('Field not found or access denied.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpdate = async (event) => {
    event.preventDefault();
    if (!updateNote && !updateStage) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      await addFieldUpdate(id, { note: updateNote, stage: updateStage || undefined });
      setUpdateNote('');
      setUpdateStage('');
      await loadField();
    } catch (requestError) {
      setSubmitError(requestError.response?.data?.error || 'Failed to submit update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setEditForm({
      name: field.name,
      cropType: field.cropType,
      plantingDate: new Date(field.plantingDate).toISOString().split('T')[0],
      stage: field.stage,
      location: field.location || '',
      sizeHectares: field.sizeHectares || '',
      assignedAgentId: field.assignedAgent?.id || '',
    });
    setEditMode(true);
  };

  const handleEditSave = async (event) => {
    event.preventDefault();

    try {
      const response = await updateField(id, editForm);
      setField(response.data.field);
      setEditMode(false);
    } catch (requestError) {
      alert(requestError.response?.data?.error || 'Failed to update');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${field.name}"? This cannot be undone.`)) return;

    setDeleting(true);

    try {
      await deleteField(id);
      navigate('/fields');
    } catch (requestError) {
      alert('Failed to delete field');
      setDeleting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!field) return null;

  const isAssigned = field.assignedAgent?.id === user.id;
  const canUpdate = isAdmin || isAssigned;
  const insight = field.insight;
  const daysInGround = insight?.metrics?.daysSincePlanting ?? 0;
  const lastUpdateDays = insight?.metrics?.daysSinceUpdate ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <button onClick={() => navigate('/fields')} className={styles.back}>
          Back to fields
        </button>
      </div>

      <div className={styles.layout}>
        <div className={styles.main}>
          <div className={styles.fieldHeader}>
            {editMode ? (
              <form onSubmit={handleEditSave} className={styles.editForm}>
                <div className={styles.editRow}>
                  <div className={styles.editField}>
                    <label>Name</label>
                    <input
                      value={editForm.name}
                      onChange={(event) =>
                        setEditForm((previous) => ({ ...previous, name: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className={styles.editField}>
                    <label>Crop Type</label>
                    <input
                      value={editForm.cropType}
                      onChange={(event) =>
                        setEditForm((previous) => ({ ...previous, cropType: event.target.value }))
                      }
                      required
                    />
                  </div>
                </div>

                <div className={styles.editRow}>
                  <div className={styles.editField}>
                    <label>Planting Date</label>
                    <input
                      type="date"
                      value={editForm.plantingDate}
                      onChange={(event) =>
                        setEditForm((previous) => ({ ...previous, plantingDate: event.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className={styles.editField}>
                    <label>Stage</label>
                    <select
                      value={editForm.stage}
                      onChange={(event) =>
                        setEditForm((previous) => ({ ...previous, stage: event.target.value }))
                      }
                    >
                      {STAGES.map((stage) => (
                        <option key={stage} value={stage}>
                          {stage.charAt(0) + stage.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.editRow}>
                  <div className={styles.editField}>
                    <label>Location</label>
                    <input
                      value={editForm.location}
                      onChange={(event) =>
                        setEditForm((previous) => ({ ...previous, location: event.target.value }))
                      }
                    />
                  </div>
                  <div className={styles.editField}>
                    <label>Size (ha)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editForm.sizeHectares}
                      onChange={(event) =>
                        setEditForm((previous) => ({
                          ...previous,
                          sizeHectares: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className={styles.editField}>
                  <label>Assigned Agent</label>
                  <select
                    value={editForm.assignedAgentId}
                    onChange={(event) =>
                      setEditForm((previous) => ({
                        ...previous,
                        assignedAgentId: event.target.value,
                      }))
                    }
                  >
                    <option value="">Unassigned</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.editActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                  <button type="submit" className={styles.saveBtn}>
                    Save changes
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className={styles.fieldTitleRow}>
                  <div>
                    <h1 className={styles.fieldTitle}>{field.name}</h1>
                    <div className={styles.fieldMeta}>
                      <span>{field.cropType}</span>
                      {field.location && <span>{field.location}</span>}
                      {field.sizeHectares && <span>{field.sizeHectares} ha</span>}
                      <span>Planted {formatDate(field.plantingDate)}</span>
                      <span>{daysInGround} days in ground</span>
                    </div>
                  </div>
                  <div className={styles.badges}>
                    <StatusBadge status={field.status} />
                    <StageBadge stage={field.stage} />
                    <PriorityBadge
                      bucket={insight.priorityBucket}
                      label={`${insight.priorityLabel} ${insight.priorityScore}`}
                    />
                  </div>
                </div>

                <div className={styles.ownerRow}>
                  <div className={`${styles.agentTag} ${!field.assignedAgent ? styles.agentTagMuted : ''}`}>
                    {field.assignedAgent ? `Assigned to ${field.assignedAgent.name}` : 'No agent assigned'}
                  </div>
                  <div className={styles.headerMetric}>Last update {lastUpdateDays}d ago</div>
                </div>

                <div className={styles.headerInsight}>
                  <div className={styles.headerInsightEyebrow}>Operations summary</div>
                  <p className={styles.headerInsightCopy}>{insight.summary}</p>
                </div>
              </>
            )}
          </div>

          <div className={styles.updatesSection}>
            <h2 className={styles.sectionTitle}>Update History</h2>
            {field.updates?.length === 0 ? (
              <div className={styles.noUpdates}>No updates yet.</div>
            ) : (
              <div className={styles.timeline}>
                {field.updates.map((update) => (
                  <div key={update.id} className={styles.timelineItem}>
                    <div className={styles.timelineLeft}>
                      <div className={styles.timelineDot} />
                      <div className={styles.timelineLine} />
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineHeader}>
                        <span className={styles.timelineAgent}>{update.agent.name}</span>
                        <span className={styles.timelineDate}>{formatDateTime(update.createdAt)}</span>
                      </div>
                      {update.stage && (
                        <div className={styles.stageChange}>
                          Stage updated to{' '}
                          <strong>{update.stage.charAt(0) + update.stage.slice(1).toLowerCase()}</strong>
                        </div>
                      )}
                      {update.note && <div className={styles.timelineNote}>{update.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Operations Insight</h3>
              <PriorityBadge
                bucket={insight.priorityBucket}
                label={`${insight.priorityLabel} ${insight.priorityScore}`}
              />
            </div>

            <div className={styles.insightSummary}>{insight.summary}</div>

            <div className={styles.nextActionBox}>
              <div className={styles.nextActionLabel}>Recommended next action</div>
              <div className={styles.nextActionCopy}>{insight.nextAction}</div>
            </div>

            <div className={styles.reasonList}>
              {insight.reasons.map((reason) => (
                <div key={reason.code} className={styles.reasonItem}>
                  <div className={styles.reasonTop}>
                    <span className={`${styles.reasonSeverity} ${styles[`severity${severityLabel(reason.severity)}`]}`}>
                      {severityLabel(reason.severity)}
                    </span>
                    <span className={styles.reasonTitle}>{reason.title}</span>
                  </div>
                  <div className={styles.reasonCopy}>{reason.detail}</div>
                </div>
              ))}
            </div>

            <div className={styles.profileGrid}>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>Check cadence</span>
                <span className={styles.profileValue}>
                  every {insight.cropProfile.staleAfterDays} days
                </span>
              </div>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>Harvest window</span>
                <span className={styles.profileValue}>
                  {insight.cropProfile.readyAfterDays} days
                </span>
              </div>
              <div className={styles.profileItem}>
                <span className={styles.profileLabel}>Expected cycle</span>
                <span className={styles.profileValue}>
                  {insight.cropProfile.maxGrowingDays} days
                </span>
              </div>
            </div>
          </div>

          {canUpdate && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Log Update</h3>
              <form onSubmit={handleAddUpdate} className={styles.updateForm}>
                <div className={styles.formField}>
                  <label>Change stage</label>
                  <select value={updateStage} onChange={(event) => setUpdateStage(event.target.value)}>
                    <option value="">No change</option>
                    {STAGES.map((stage) => (
                      <option key={stage} value={stage} disabled={stage === field.stage}>
                        {stage.charAt(0) + stage.slice(1).toLowerCase()}
                        {stage === field.stage ? ' (current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label>Observation</label>
                  <textarea
                    value={updateNote}
                    onChange={(event) => setUpdateNote(event.target.value)}
                    rows={4}
                    placeholder="Describe what you observed in the field..."
                  />
                </div>

                {submitError && <div className={styles.submitError}>{submitError}</div>}

                <button
                  type="submit"
                  className={styles.updateBtn}
                  disabled={submitting || (!updateNote && !updateStage)}
                >
                  {submitting ? 'Saving...' : 'Log update'}
                </button>
              </form>
            </div>
          )}

          {isAdmin && !editMode && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Admin Actions</h3>
              <div className={styles.adminActions}>
                <button className={styles.editBtn} onClick={handleEdit}>
                  Edit field
                </button>
                <button className={styles.deleteBtn} onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete field'}
                </button>
              </div>
            </div>
          )}

          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Details</h3>
            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Total updates</span>
                <span className={styles.infoValue}>{field.updates?.length ?? 0}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Days growing</span>
                <span className={styles.infoValue}>{daysInGround}</span>
              </div>
              {field.sizeHectares && (
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Area</span>
                  <span className={styles.infoValue}>{field.sizeHectares} ha</span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Created</span>
                <span className={styles.infoValue}>{formatDate(field.createdAt)}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Last updated</span>
                <span className={styles.infoValue}>{formatDate(field.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PriorityBadge, StageBadge, StatusBadge } from './StatusBadge';
import styles from './FieldCard.module.css';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
}

export default function FieldCard({ field, showAgent = false }) {
  const navigate = useNavigate();
  const insight = field.insight;
  const daysInGround = insight?.metrics?.daysSincePlanting ?? daysSince(field.plantingDate);
  const daysSinceUpdate = insight?.metrics?.daysSinceUpdate;

  return (
    <div
      className={`${styles.card} ${field.status === 'AT_RISK' ? styles.atRisk : ''}`}
      onClick={() => navigate(`/fields/${field.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/fields/${field.id}`)}
    >
      <div className={styles.header}>
        <div className={styles.headerMain}>
          <div className={styles.title}>{field.name}</div>
          <div className={styles.crop}>
            <span className={styles.cropLabel}>🌾</span>
            <span>{field.cropType}</span>
            {field.location && (
              <span className={styles.location}>· 📍 {field.location}</span>
            )}
          </div>
        </div>
        <StatusBadge status={field.status} />
      </div>

      <div className={styles.meta}>
        <StageBadge stage={field.stage} />
        {insight && (
          <PriorityBadge
            bucket={insight.priorityBucket}
            label={`${insight.priorityLabel} ${insight.priorityScore}`}
          />
        )}
      </div>

      {insight && (
        <div className={styles.insightBlock}>
          <div className={styles.insightLabel}>Why now</div>
          <div className={styles.insightSummary}>{insight.summary}</div>
          <div className={styles.nextAction}>Next: {insight.nextAction}</div>
        </div>
      )}

      <div className={styles.metricsRow}>
        <span className={styles.metric}>{daysInGround}d in ground</span>
        {typeof daysSinceUpdate === 'number' && (
          <span className={styles.metric}>Last update {daysSinceUpdate}d ago</span>
        )}
      </div>

      <div className={styles.footer}>
        <span className={styles.planted}>Planted {formatDate(field.plantingDate)}</span>
        {showAgent && (
          <span className={`${styles.tag} ${!field.assignedAgent ? styles.tagMuted : ''}`}>
            {field.assignedAgent ? `Agent ${field.assignedAgent.name}` : 'Unassigned'}
          </span>
        )}
        {field._count && (
          <span className={styles.tag}>{field._count.updates} updates</span>
        )}
      </div>
    </div>
  );
}

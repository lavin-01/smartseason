import React from 'react';
import styles from './StatusBadge.module.css';

const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', cls: 'active' },
  AT_RISK: { label: 'At Risk', cls: 'risk' },
  COMPLETED: { label: 'Completed', cls: 'complete' },
};

const STAGE_CONFIG = {
  PLANTED: { label: 'Planted', cls: 'planted', emoji: '🌱' },
  GROWING: { label: 'Growing', cls: 'growing', emoji: '🌿' },
  READY: { label: 'Ready', cls: 'ready', emoji: '🌾' },
  HARVESTED: { label: 'Harvested', cls: 'harvested', emoji: '✓' },
};

const PRIORITY_CONFIG = {
  IMMEDIATE: { label: 'Immediate', cls: 'priorityCritical' },
  HIGH: { label: 'High', cls: 'priorityHigh' },
  MONITOR: { label: 'Monitor', cls: 'priorityWatch' },
  ROUTINE: { label: 'Routine', cls: 'priorityRoutine' },
  CLOSED: { label: 'Closed', cls: 'priorityClosed' },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ACTIVE;

  return (
    <span className={`${styles.badge} ${styles[config.cls]}`}>
      {config.label}
    </span>
  );
}

export function StageBadge({ stage }) {
  const config = STAGE_CONFIG[stage] || STAGE_CONFIG.PLANTED;

  return (
    <span className={`${styles.stageBadge} ${styles[config.cls]}`}>
      {config.emoji} {config.label}
    </span>
  );
}

export function PriorityBadge({ bucket, label }) {
  const config = PRIORITY_CONFIG[bucket] || PRIORITY_CONFIG.ROUTINE;

  return (
    <span className={`${styles.badge} ${styles.priority} ${styles[config.cls]}`}>
      {label || config.label}
    </span>
  );
}

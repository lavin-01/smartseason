const DAY_MS = 1000 * 60 * 60 * 24;

const DEFAULT_PROFILE = {
  key: 'default',
  label: 'Field crop',
  staleAfterDays: 7,
  readyAfterDays: 14,
  maxGrowingDays: 150,
};

const CROP_PROFILES = {
  maize: {
    key: 'maize',
    label: 'Maize',
    staleAfterDays: 6,
    readyAfterDays: 10,
    maxGrowingDays: 120,
  },
  wheat: {
    key: 'wheat',
    label: 'Wheat',
    staleAfterDays: 7,
    readyAfterDays: 12,
    maxGrowingDays: 135,
  },
  beans: {
    key: 'beans',
    label: 'Beans',
    staleAfterDays: 5,
    readyAfterDays: 7,
    maxGrowingDays: 75,
  },
  sorghum: {
    key: 'sorghum',
    label: 'Sorghum',
    staleAfterDays: 8,
    readyAfterDays: 12,
    maxGrowingDays: 130,
  },
  cassava: {
    key: 'cassava',
    label: 'Cassava',
    staleAfterDays: 10,
    readyAfterDays: 21,
    maxGrowingDays: 365,
  },
  sunflower: {
    key: 'sunflower',
    label: 'Sunflower',
    staleAfterDays: 6,
    readyAfterDays: 8,
    maxGrowingDays: 110,
  },
};

const SEVERITY_WEIGHT = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function pluralize(value, noun = 'day') {
  return `${value} ${noun}${value === 1 ? '' : 's'}`;
}

function daysSince(dateValue) {
  return Math.max(0, Math.floor((Date.now() - new Date(dateValue).getTime()) / DAY_MS));
}

function normalizeCropType(cropType = '') {
  return cropType.trim().toLowerCase();
}

function getCropProfile(cropType = '') {
  const normalized = normalizeCropType(cropType);

  if (CROP_PROFILES[normalized]) {
    return CROP_PROFILES[normalized];
  }

  const alias = Object.keys(CROP_PROFILES).find((key) => normalized.includes(key));
  if (alias) {
    return CROP_PROFILES[alias];
  }

  return {
    ...DEFAULT_PROFILE,
    label: cropType || DEFAULT_PROFILE.label,
  };
}

function hasAssignedAgent(field) {
  return Boolean(field.assignedAgentId || field.assignedAgent?.id);
}

function compareReasons(a, b) {
  return (SEVERITY_WEIGHT[a.severity] ?? 99) - (SEVERITY_WEIGHT[b.severity] ?? 99);
}

function computePriorityScore({ field, reasons, metrics, profile }) {
  if (field.stage === 'HARVESTED') {
    return 0;
  }

  let score = 12;

  if (field.stage === 'READY') score += 20;
  if (field.stage === 'GROWING') score += 12;
  if (field.stage === 'PLANTED') score += 8;

  if (typeof field.sizeHectares === 'number') {
    score += Math.min(Math.round(field.sizeHectares * 2), 12);
  }

  reasons.forEach((reason) => {
    switch (reason.code) {
      case 'READY_OVERDUE':
        score += 38 + Math.min(metrics.daysSinceUpdate - profile.readyAfterDays, 20);
        break;
      case 'STALE_MONITORING':
        score += 24 + Math.min(metrics.daysSinceUpdate - profile.staleAfterDays, 18);
        break;
      case 'OVERDUE_GROWTH':
        score += 26 + Math.min(metrics.daysSincePlanting - profile.maxGrowingDays, 20);
        break;
      case 'UNASSIGNED_FIELD':
        score += 18;
        break;
      case 'NO_EARLY_CHECK':
        score += 12;
        break;
      default:
        break;
    }
  });

  return clamp(score, 0, 100);
}

function getPriorityMeta(status, score) {
  if (status === 'COMPLETED') {
    return {
      priorityBucket: 'CLOSED',
      priorityLabel: 'Closed',
      priorityTone: 'closed',
    };
  }

  if (score >= 80) {
    return {
      priorityBucket: 'IMMEDIATE',
      priorityLabel: 'Immediate',
      priorityTone: 'critical',
    };
  }

  if (score >= 60) {
    return {
      priorityBucket: 'HIGH',
      priorityLabel: 'High',
      priorityTone: 'high',
    };
  }

  if (score >= 35) {
    return {
      priorityBucket: 'MONITOR',
      priorityLabel: 'Monitor',
      priorityTone: 'watch',
    };
  }

  return {
    priorityBucket: 'ROUTINE',
    priorityLabel: 'Routine',
    priorityTone: 'routine',
  };
}

function buildReason(code, severity, title, detail) {
  return { code, severity, title, detail };
}

function chooseNextAction({ field, reasons, profile }) {
  const reasonCodes = new Set(reasons.map((reason) => reason.code));

  if (reasonCodes.has('READY_OVERDUE')) {
    return `Escalate harvest logistics for ${profile.label.toLowerCase()} within 24 hours and confirm labor, transport, and storage.`;
  }

  if (reasonCodes.has('STALE_MONITORING')) {
    return 'Schedule a site visit in the next 24-48 hours and log a fresh observation before the monitoring gap widens.';
  }

  if (reasonCodes.has('OVERDUE_GROWTH')) {
    return 'Review crop maturity and blockers with the field agent, then decide whether to harvest, re-stage, or investigate delays.';
  }

  if (reasonCodes.has('UNASSIGNED_FIELD')) {
    return 'Assign an owner for the next visit so accountability is clear before the field falls behind.';
  }

  if (reasonCodes.has('NO_EARLY_CHECK')) {
    return 'Complete the first germination or emergence check and record stand establishment notes.';
  }

  if (field.stage === 'HARVESTED') {
    return 'Close out yield notes and any post-harvest observations. No urgent action is required.';
  }

  if (field.stage === 'READY') {
    return `Keep harvest arrangements warm and log the next readiness confirmation within ${profile.readyAfterDays} days.`;
  }

  if (field.stage === 'GROWING') {
    return `Maintain the ${profile.label.toLowerCase()} monitoring cadence and capture the next update within ${profile.staleAfterDays} days.`;
  }

  return 'Record the next field visit with early growth observations to confirm establishment.';
}

function buildSummary({ field, status, reasons, profile }) {
  if (status === 'COMPLETED') {
    return `${profile.label} has been harvested and only needs closeout follow-up.`;
  }

  if (reasons.length > 0) {
    return reasons[0].detail;
  }

  if (field.stage === 'READY') {
    return `${profile.label} is harvest-ready and still inside the recommended action window.`;
  }

  if (field.stage === 'GROWING') {
    return `${profile.label} is being monitored within the current cadence and is progressing normally.`;
  }

  return `${profile.label} is newly planted and waiting for the next emergence check.`;
}

function computeFieldInsight(field) {
  const profile = getCropProfile(field.cropType);
  const metrics = {
    daysSinceUpdate: daysSince(field.updatedAt),
    daysSincePlanting: daysSince(field.plantingDate),
    staleAfterDays: profile.staleAfterDays,
    readyAfterDays: profile.readyAfterDays,
    maxGrowingDays: profile.maxGrowingDays,
    hasAssignedAgent: hasAssignedAgent(field),
    updateCount: field._count?.updates ?? field.updates?.length ?? 0,
  };

  const reasons = [];

  if (field.stage === 'HARVESTED') {
    reasons.push(
      buildReason(
        'HARVEST_COMPLETE',
        'low',
        'Harvest completed',
        'This field is already harvested and can move into yield and closeout review.'
      )
    );
  } else {
    if (!metrics.hasAssignedAgent) {
      reasons.push(
        buildReason(
          'UNASSIGNED_FIELD',
          field.stage === 'READY' ? 'high' : 'medium',
          'No agent assigned',
          'This field has no current owner, so the next visit and follow-up work are not clearly assigned.'
        )
      );
    }

    if (field.stage === 'READY' && metrics.daysSinceUpdate > profile.readyAfterDays) {
      const overdueDays = metrics.daysSinceUpdate - profile.readyAfterDays;
      reasons.push(
        buildReason(
          'READY_OVERDUE',
          'critical',
          'Harvest window is slipping',
          `${profile.label} has been sitting at ready stage for ${pluralize(metrics.daysSinceUpdate)}, which is ${pluralize(overdueDays)} beyond the recommended harvest window.`
        )
      );
    }

    if (
      (field.stage === 'PLANTED' || field.stage === 'GROWING') &&
      metrics.daysSinceUpdate > profile.staleAfterDays
    ) {
      const overdueDays = metrics.daysSinceUpdate - profile.staleAfterDays;
      reasons.push(
        buildReason(
          'STALE_MONITORING',
          'high',
          'Monitoring gap detected',
          `No field update has been logged for ${pluralize(metrics.daysSinceUpdate)}, which is ${pluralize(overdueDays)} beyond the ${pluralize(profile.staleAfterDays)} monitoring cadence for ${profile.label.toLowerCase()}.`
        )
      );
    }

    if (field.stage === 'GROWING' && metrics.daysSincePlanting > profile.maxGrowingDays) {
      const overdueDays = metrics.daysSincePlanting - profile.maxGrowingDays;
      reasons.push(
        buildReason(
          'OVERDUE_GROWTH',
          'high',
          'Crop cycle looks overdue',
          `${profile.label} has been in the field for ${pluralize(metrics.daysSincePlanting)}, which is ${pluralize(overdueDays)} beyond the expected growing window.`
        )
      );
    }

    if (
      field.stage === 'PLANTED' &&
      metrics.updateCount === 0 &&
      metrics.daysSincePlanting >= Math.min(5, profile.staleAfterDays)
    ) {
      reasons.push(
        buildReason(
          'NO_EARLY_CHECK',
          'medium',
          'No early establishment check',
          `The field was planted ${pluralize(metrics.daysSincePlanting)} ago, but there is still no germination or emergence note on record.`
        )
      );
    }
  }

  reasons.sort(compareReasons);

  const status = field.stage === 'HARVESTED'
    ? 'COMPLETED'
    : reasons.length > 0
      ? 'AT_RISK'
      : 'ACTIVE';

  const priorityScore = computePriorityScore({ field, reasons, metrics, profile });
  const priorityMeta = getPriorityMeta(status, priorityScore);

  return {
    status,
    summary: buildSummary({ field, status, reasons, profile }),
    nextAction: chooseNextAction({ field, reasons, profile }),
    priorityScore,
    ...priorityMeta,
    reasons,
    cropProfile: {
      key: profile.key,
      name: profile.label,
      staleAfterDays: profile.staleAfterDays,
      readyAfterDays: profile.readyAfterDays,
      maxGrowingDays: profile.maxGrowingDays,
    },
    metrics,
  };
}

function computeFieldStatus(field) {
  return computeFieldInsight(field).status;
}

function enrichField(field) {
  const insight = computeFieldInsight(field);

  return {
    ...field,
    status: insight.status,
    insight,
  };
}

module.exports = { computeFieldStatus, computeFieldInsight, enrichField, getCropProfile };

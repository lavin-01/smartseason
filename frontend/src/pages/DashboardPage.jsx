import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFields, getFieldsSummary, getRecentUpdates } from '../api/services';
import FieldCard from '../components/FieldCard';
import { PriorityBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import styles from './DashboardPage.module.css';

function StatCard({ value, label, color, icon }) {
  return (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function UpdateFeed({ updates }) {
  if (!updates.length) return <div className={styles.empty}>No recent updates.</div>;

  return (
    <div className={styles.feed}>
      {updates.map((update) => (
        <div key={update.id} className={styles.feedItem}>
          <div className={styles.feedDot} />
          <div className={styles.feedBody}>
            <div className={styles.feedTop}>
              <span className={styles.feedField}>{update.field.name}</span>
              <span className={styles.feedTime}>
                {new Date(update.createdAt).toLocaleDateString('en-KE', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
            <div className={styles.feedAgent}>by {update.agent.name}</div>
            {update.note && <div className={styles.feedNote}>{update.note}</div>}
            {update.stage && (
              <div className={styles.feedStage}>
                Stage changed to {update.stage.toLowerCase()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PriorityQueue({ fields, onOpen, showAgent }) {
  if (!fields.length) {
    return <div className={styles.empty}>No priority fields right now.</div>;
  }

  return (
    <div className={styles.queue}>
      {fields.map((field) => (
        <button
          key={field.id}
          type="button"
          className={styles.queueItem}
          onClick={() => onOpen(field.id)}
        >
          <div className={styles.queueTop}>
            <div>
              <div className={styles.queueField}>{field.name}</div>
              <div className={styles.queueMeta}>
                {field.cropType}
                {field.location ? ` - ${field.location}` : ''}
              </div>
            </div>
            <PriorityBadge
              bucket={field.insight.priorityBucket}
              label={`${field.insight.priorityLabel} ${field.insight.priorityScore}`}
            />
          </div>
          <div className={styles.queueSummary}>{field.insight.summary}</div>
          <div className={styles.queueAction}>{field.insight.nextAction}</div>
          <div className={styles.queueFooter}>
            <span>Last update {field.insight.metrics.daysSinceUpdate}d ago</span>
            {showAgent && (
              <span>
                {field.assignedAgent ? field.assignedAgent.name : 'Unassigned'}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function WorkPlan({ fields, onOpen }) {
  if (!fields.length) {
    return <div className={styles.empty}>Your field list is clear for now.</div>;
  }

  return (
    <div className={styles.planList}>
      {fields.map((field, index) => (
        <button
          key={field.id}
          type="button"
          className={styles.planItem}
          onClick={() => onOpen(field.id)}
        >
          <div className={styles.planCount}>0{index + 1}</div>
          <div className={styles.planBody}>
            <div className={styles.planTitle}>{field.name}</div>
            <div className={styles.planCopy}>{field.insight.nextAction}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [fields, setFields] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [summaryResponse, fieldsResponse] = await Promise.all([
          getFieldsSummary(),
          getFields(),
        ]);

        setSummary(summaryResponse.data.summary);
        setFields(fieldsResponse.data.fields);

        if (isAdmin) {
          const updatesResponse = await getRecentUpdates(8);
          setRecentUpdates(updatesResponse.data.updates);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.skeletonTitle} />
        <div className={styles.statsRow}>
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              className={`${styles.statCard} skeleton`}
              style={{ height: 98 }}
            />
          ))}
        </div>
      </div>
    );
  }

  const sortedByPriority = [...fields].sort(
    (left, right) => right.insight.priorityScore - left.insight.priorityScore
  );
  const priorityQueue = sortedByPriority
    .filter((field) => field.status !== 'COMPLETED')
    .slice(0, 4);
  const atRiskFields = sortedByPriority
    .filter((field) => field.status === 'AT_RISK')
    .slice(0, 4);
  const immediateCount = summary?.byPriority?.IMMEDIATE ?? 0;
  const highCount = summary?.byPriority?.HIGH ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>
            {greeting()}, {user.name.split(' ')[0]}
          </h1>
          <p className={styles.sub}>
            {isAdmin
              ? 'Prioritize the riskiest fields before the rest of the operation.'
              : 'These are the field decisions that need your attention first.'}
          </p>
        </div>
        {isAdmin && (
          <button className={styles.addBtn} onClick={() => navigate('/fields')}>
            Manage fields
          </button>
        )}
      </div>

      <div className={styles.focusBanner}>
        <div className={styles.focusEyebrow}>Operations focus</div>
        <div className={styles.focusTitle}>
          {immediateCount > 0
            ? `${immediateCount} field${immediateCount === 1 ? '' : 's'} need immediate action.`
            : 'No immediate escalations right now.'}
        </div>
        <p className={styles.focusCopy}>
          {highCount > 0
            ? `${highCount} more field${highCount === 1 ? '' : 's'} should be reviewed this week.`
            : 'The rest of the portfolio is currently on routine monitoring.'}
        </p>
      </div>

      {summary && (
        <div className={styles.statsRow}>
          <StatCard value={summary.total} label="Total Fields" color="neutral" icon="Map" />
          <StatCard
            value={summary.byPriority.IMMEDIATE}
            label="Immediate"
            color="risk"
            icon="Now"
          />
          <StatCard
            value={summary.byPriority.HIGH}
            label="High Attention"
            color="warning"
            icon="Up"
          />
          <StatCard value={summary.byStatus.AT_RISK} label="At Risk" color="risk" icon="Risk" />
          <StatCard
            value={summary.byStatus.COMPLETED}
            label="Harvested"
            color="complete"
            icon="Done"
          />
        </div>
      )}

      {summary && (
        <div className={styles.stageRow}>
          {['PLANTED', 'GROWING', 'READY', 'HARVESTED'].map((stage) => (
            <div key={stage} className={styles.stageChip}>
              <span className={styles.stageCount}>{summary.byStage[stage]}</span>
              <span className={styles.stageLabel}>
                {stage.charAt(0) + stage.slice(1).toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.bottom}>
        <div className={styles.leftColumn}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Today's Priority Queue</h2>
              <button className={styles.viewAll} onClick={() => navigate('/fields')}>
                Open fields list
              </button>
            </div>
            <PriorityQueue
              fields={priorityQueue}
              showAgent={isAdmin}
              onOpen={(fieldId) => navigate(`/fields/${fieldId}`)}
            />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>At Risk Fields</h2>
              <button className={styles.viewAll} onClick={() => navigate('/fields')}>
                View all
              </button>
            </div>
            {atRiskFields.length === 0 ? (
              <div className={styles.allGood}>
                <span>All fields are within their current operating window.</span>
              </div>
            ) : (
              <div className={styles.cardGrid}>
                {atRiskFields.map((field) => (
                  <FieldCard key={field.id} field={field} showAgent={isAdmin} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightColumn}>
          {isAdmin ? (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent Activity</h2>
              </div>
              <UpdateFeed updates={recentUpdates} />
            </div>
          ) : (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Your Work Plan</h2>
              </div>
              <WorkPlan
                fields={priorityQueue.slice(0, 3)}
                onOpen={(fieldId) => navigate(`/fields/${fieldId}`)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRightLeft,
  AlertTriangle,
  User,
  Bot,
  MessageSquare,
  CheckSquare,
  Layers,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { fetchActivities } from '../data/db';
import { TaskActivity } from '../types';
import { timeAgo } from '../utils/timeAgo';

interface ActivityDescProps {
  activity: TaskActivity;
  developerName?: string;
}

function ActivityDescription({ activity, developerName }: ActivityDescProps) {
  const p = activity.payload;
  switch (activity.eventType) {
    case 'status_changed':
      return (
        <span>
          Status changed from{' '}
          <span className="font-medium" style={{ color: '#3f3f46' }}>{String(p.from)}</span>
          {' '}to{' '}
          <span className="font-medium" style={{ color: '#3f3f46' }}>{String(p.to)}</span>
        </span>
      );
    case 'priority_changed':
      return (
        <span>
          Priority changed from{' '}
          <span className="font-medium" style={{ color: '#3f3f46' }}>{String(p.from)}</span>
          {' '}to{' '}
          <span className="font-medium" style={{ color: '#3f3f46' }}>{String(p.to)}</span>
        </span>
      );
    case 'assigned':
      if (p.developerId) {
        const name = developerName ?? String(p.developerId);
        return <span>Assigned to <span className="font-medium" style={{ color: '#3f3f46' }}>{name}</span></span>;
      }
      return <span>Assignment updated</span>;
    case 'agent_action':
      return (
        <span>
          Agent performed:{' '}
          <span className="font-medium" style={{ color: '#3f3f46' }}>{String(p.action ?? 'action')}</span>
        </span>
      );
    case 'comment_added':
      return (
        <span>
          Comment added by{' '}
          <span className="font-medium" style={{ color: '#3f3f46' }}>
            {activity.actor === 'user' ? 'You' : activity.actor}
          </span>
        </span>
      );
    case 'criteria_checked':
      return (
        <span>
          Acceptance criterion{' '}
          <span className="font-medium" style={{ color: '#3f3f46' }}>
            {p.checked ? 'checked' : 'unchecked'}
          </span>
        </span>
      );
    case 'sprint_added':
      return <span>Added to sprint</span>;
    case 'blocker_set':
      return (
        <span>
          Marked as blocked
          {p.reason ? (
            <>: <span className="font-medium" style={{ color: '#3f3f46' }}>{String(p.reason)}</span></>
          ) : null}
        </span>
      );
    case 'blocker_resolved':
      return <span>Blocker resolved</span>;
    default:
      return <span>Activity recorded</span>;
  }
}

function ActivityIcon({ eventType }: { eventType: TaskActivity['eventType'] }) {
  const iconProps = { className: 'w-3 h-3' };
  switch (eventType) {
    case 'status_changed':    return <ArrowRightLeft {...iconProps} />;
    case 'priority_changed':  return <AlertTriangle {...iconProps} />;
    case 'assigned':          return <User {...iconProps} />;
    case 'agent_action':      return <Bot {...iconProps} />;
    case 'comment_added':     return <MessageSquare {...iconProps} />;
    case 'criteria_checked':  return <CheckSquare {...iconProps} />;
    case 'sprint_added':      return <Layers {...iconProps} />;
    case 'blocker_set':       return <ShieldAlert {...iconProps} />;
    case 'blocker_resolved':  return <ShieldCheck {...iconProps} />;
    default:                  return <ArrowRightLeft {...iconProps} />;
  }
}

interface Props {
  taskId: string;
}

export function ActivityFeed({ taskId }: Props) {
  const { activeProjectId, developers } = useApp();
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const data = await fetchActivities(activeProjectId, taskId);
      setActivities(data);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, taskId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="py-6 text-center">
        <p className="text-xs" style={{ color: '#a1a1aa' }}>Loading activity...</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-xs py-4 text-center" style={{ color: '#a1a1aa' }}>
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity) => {
        const dev = activity.eventType === 'assigned' && activity.payload.developerId
          ? developers.find((d) => d.id === String(activity.payload.developerId))
          : undefined;
        return (
          <div key={activity.id} className="flex gap-2.5 items-start">
            {/* Icon dot */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: '#f4f4f5', color: '#71717a' }}
            >
              <ActivityIcon eventType={activity.eventType} />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
                <ActivityDescription activity={activity} developerName={dev?.name} />
              </p>
              <p className="text-[0.6rem] mt-0.5" style={{ color: '#a1a1aa' }}>
                {timeAgo(activity.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

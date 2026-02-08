'use client';

import { useState, useEffect, useCallback } from 'react';
import { subscriptionService } from '@/services/subscriptionService';
import Icon from '@/components/ui/AppIcon';

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  targetUserId: string;
  targetUserEmail: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

interface AuditLogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function AuditLogPanel({ isOpen, onToggle }: AuditLogPanelProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: loadError } = await subscriptionService.getAuditLogsAdmin({
      page,
      limit: pageSize,
    });

    if (loadError) {
      setError(loadError);
    } else if (data) {
      setLogs(data.logs);
      setHasMore(data.hasMore);
      setTotalCount(data.totalCount);
    }

    setIsLoading(false);
  }, [page]);

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, loadLogs]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionInfo = (action: string) => {
    switch (action) {
      case 'gift_appreciation':
        return {
          label: 'Gifted Appreciation',
          icon: 'GiftIcon',
          color: 'text-purple-600 bg-purple-100',
        };
      case 'remove_appreciation':
        return {
          label: 'Removed Appreciation',
          icon: 'MinusCircleIcon',
          color: 'text-orange-600 bg-orange-100',
        };
      case 'cancel_subscription':
        return {
          label: 'Cancelled Subscription',
          icon: 'XCircleIcon',
          color: 'text-red-600 bg-red-100',
        };
      case 'link_subscription':
        return {
          label: 'Linked Subscription',
          icon: 'LinkIcon',
          color: 'text-blue-600 bg-blue-100',
        };
      default:
        return { label: action, icon: 'DocumentTextIcon', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const formatDetails = (details: Record<string, unknown> | null) => {
    if (!details) return null;
    const entries = Object.entries(details).filter(([key]) => !key.startsWith('_'));
    if (entries.length === 0) return null;

    return (
      <div className="mt-2 text-xs text-text-secondary space-y-1">
        {entries.map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
            <span>{String(value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header - Clickable to toggle */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon name="ClipboardDocumentListIcon" size={20} className="text-text-secondary" />
          <span className="font-medium text-text-primary">Admin Audit Log</span>
          {totalCount > 0 && (
            <span className="text-sm text-text-secondary">({totalCount} entries)</span>
          )}
        </div>
        <Icon
          name="ChevronDownIcon"
          size={20}
          className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="border-t border-border">
          {/* Error State */}
          {error && (
            <div className="p-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <Icon
                  name="ExclamationCircleIcon"
                  size={20}
                  className="text-red-600 flex-shrink-0 mt-0.5"
                />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && logs.length === 0 && (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              <span className="text-text-secondary">Loading audit log...</span>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && logs.length === 0 && (
            <div className="p-8 text-center">
              <Icon
                name="DocumentTextIcon"
                size={40}
                className="text-text-secondary mx-auto mb-2"
              />
              <p className="text-text-secondary">No audit log entries yet</p>
              <p className="text-sm text-text-secondary mt-1">
                Admin actions will be recorded here
              </p>
            </div>
          )}

          {/* Log Entries */}
          {logs.length > 0 && (
            <>
              <div className="max-h-96 overflow-y-auto divide-y divide-border">
                {logs.map((log) => {
                  const actionInfo = getActionInfo(log.action);
                  return (
                    <div key={log.id} className="p-4 hover:bg-muted/30">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${actionInfo.color}`}>
                          <Icon name={actionInfo.icon} size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-text-primary">
                              {actionInfo.label}
                            </span>
                            <span className="text-sm text-text-secondary">•</span>
                            <span className="text-sm text-text-secondary">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm text-text-secondary mt-1">
                            <span className="font-medium">Target:</span>{' '}
                            <span>{log.targetUserEmail}</span>
                          </div>
                          <div className="text-sm text-text-secondary">
                            <span className="font-medium">By:</span> <span>{log.adminEmail}</span>
                          </div>
                          {formatDetails(log.details)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="px-4 py-3 border-t border-border flex items-center justify-between bg-muted/30">
                <span className="text-sm text-text-secondary">
                  Page {page} of {Math.ceil(totalCount / pageSize)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || isLoading}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!hasMore || isLoading}
                    className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

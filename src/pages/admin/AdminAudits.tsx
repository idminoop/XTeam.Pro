import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Search,
  Square,
  CheckSquare,
  Trash2,
  XCircle,
} from 'lucide-react';

import { useAdminStore } from '@/store/adminStore';
import { adminApiCall } from '@/utils/adminApi';
import TableSkeleton from '@/components/admin/TableSkeleton';
import EmptyState from '@/components/admin/EmptyState';
import BulkActionBar from '@/components/admin/BulkActionBar';

interface AuditRow {
  audit_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  submitted_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  maturity_score: number | null;
  estimated_roi: number | null;
  industry: string;
  company_size: string;
}

const STATUS_CONFIG = {
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-700', icon: AlertCircle },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800', icon: XCircle },
} as const;

export default function AdminAudits() {
  const authToken = useAdminStore(state => state.authToken);
  const navigate = useNavigate();

  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status_filter', statusFilter);
      if (search) params.set('search', search);
      const res = await adminApiCall(`/api/admin/audits?${params}`, authToken);
      const data = await res.json();
      const nextAudits = Array.isArray(data) ? data : data.items ?? [];
      setAudits(nextAudits);
      setSelectedIds(prev => prev.filter(id => nextAudits.some((audit: AuditRow) => audit.audit_id === id)));
    } catch {
      toast.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  }, [authToken, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this audit? This action cannot be undone.')) return;
    try {
      await adminApiCall(`/api/admin/submissions/${id}`, authToken, { method: 'DELETE' });
      toast.success('Audit deleted');
      setAudits(prev => prev.filter(item => item.audit_id !== id));
      setSelectedIds(prev => prev.filter(item => item !== id));
    } catch {
      toast.error('Failed to delete audit');
    }
  };

  const handleExport = async () => {
    try {
      const res = await adminApiCall('/api/admin/export?format=csv', authToken);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audits.csv';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      toast.error('Export failed');
    }
  };

  const allSelected = useMemo(
    () => audits.length > 0 && audits.every(audit => selectedIds.includes(audit.audit_id)),
    [audits, selectedIds],
  );

  const toggleOne = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(audits.map(audit => audit.audit_id));
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} selected audits?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          adminApiCall(`/api/admin/submissions/${id}`, authToken, {
            method: 'DELETE',
          }),
        ),
      );
      toast.success('Selected audits deleted');
      setSelectedIds([]);
      await load();
    } catch {
      toast.error('Failed to delete selected audits');
    } finally {
      setBulkDeleting(false);
    }
  };

  const fmtDate = (value: string) =>
    new Date(value).toLocaleString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const fmtCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company, email, or industry"
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        {loading ? (
          <TableSkeleton columns={9} rows={8} className="border-0 rounded-none" />
        ) : audits.length === 0 ? (
          <div className="p-6">
            <EmptyState title="No audits found" description="No records match your current filters." icon={Search} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <button onClick={toggleAll} className="text-gray-500 hover:text-gray-700">
                      {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  {['Company', 'Contact', 'Industry', 'Status', 'Score', 'ROI', 'Date', ''].map(header => (
                    <th key={header} className="whitespace-nowrap px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map(audit => {
                  const config = STATUS_CONFIG[audit.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = config.icon;
                  return (
                    <tr key={audit.audit_id} className="transition-colors hover:bg-gray-50">
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(audit.audit_id)}
                          onChange={() => toggleOne(audit.audit_id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{audit.company_name}</div>
                        <div className="text-xs text-gray-400">{audit.company_size}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-gray-700">{audit.contact_name}</div>
                        <div className="text-xs text-gray-400">{audit.email}</div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{audit.industry}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${config.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {audit.maturity_score != null ? `${audit.maturity_score}/100` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-gray-700">
                        {audit.estimated_roi != null ? fmtCurrency(audit.estimated_roi) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-gray-400">{fmtDate(audit.submitted_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/audits/${audit.audit_id}`)}
                            className="text-blue-500 transition-colors hover:text-blue-700"
                            title="Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/audit/results/${audit.audit_id}`, '_blank')}
                            className="text-gray-400 transition-colors hover:text-gray-700"
                            title="Open result page"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(audit.audit_id)}
                            className="text-red-400 transition-colors hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])}>
        <button
          onClick={handleBulkDelete}
          disabled={bulkDeleting}
          className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {bulkDeleting ? 'Deleting...' : 'Bulk Delete'}
        </button>
      </BulkActionBar>
    </motion.div>
  );
}


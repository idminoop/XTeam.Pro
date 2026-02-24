import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, User, Calendar, Tag, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '@/utils/api';
import { useAdminStore } from '@/store/adminStore';

interface ContactDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  inquiry_type: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  assigned_to: string | null;
  source: string | null;
  preferred_contact_method: string | null;
  budget_range: string | null;
  timeline: string | null;
  is_newsletter_subscribed: boolean;
  is_gdpr_compliant: boolean;
  is_spam: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string | null;
  updated_at: string | null;
  contacted_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  closed:    'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high:   'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low:    'bg-gray-100 text-gray-600',
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-500 w-40 shrink-0">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

export default function AdminContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authToken } = useAdminStore();

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/contacts/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error();
        const data: ContactDetail = await res.json();
        setContact(data);
        setStatus(data.status);
        setPriority(data.priority);
        setAssignedTo(data.assigned_to ?? '');
      } catch {
        navigate('/admin/contacts');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, authToken, navigate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          priority,
          assigned_to: assignedTo || null,
        }),
      });
      setContact(prev => prev ? { ...prev, status, priority, assigned_to: assignedTo || null } : prev);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!contact || !confirm(`Удалить обращение от ${contact.name}? Это действие необратимо.`)) return;
    setDeleting(true);
    try {
      await apiCall(`/api/admin/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Обращение удалено');
      navigate('/admin/contacts');
    } catch {
      toast.error('Не удалось удалить обращение');
    } finally {
      setDeleting(false);
    }
  };

  const handleMarkSpam = async () => {
    if (!contact || !confirm('Mark as spam?')) return;
    await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_spam: true }),
    });
    setContact(prev => prev ? { ...prev, is_spam: true } : prev);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Loading…</div>
  );
  if (!contact) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link
          to="/admin/contacts"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">#{contact.id} — {contact.name}</h1>
        {contact.is_spam && (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">SPAM</span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="xl:col-span-2 space-y-4">
          {/* Contact info */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Contact Information</h2>
            <InfoRow label="Name" value={<span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gray-400" />{contact.name}</span>} />
            <InfoRow label="Email" value={<a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{contact.email}</a>} />
            <InfoRow label="Phone" value={contact.phone && <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{contact.phone}</a>} />
            <InfoRow label="Company" value={contact.company && <span className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-gray-400" />{contact.company}</span>} />
            <InfoRow label="Position" value={contact.position} />
            <InfoRow label="Preferred contact" value={contact.preferred_contact_method} />
          </div>

          {/* Inquiry details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Inquiry Details</h2>
            <InfoRow label="Type" value={<span className="capitalize">{contact.inquiry_type}</span>} />
            <InfoRow label="Subject" value={contact.subject} />
            <InfoRow label="Budget range" value={contact.budget_range} />
            <InfoRow label="Timeline" value={contact.timeline} />
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-500 mb-2">Message</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
                {contact.message}
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Metadata</h2>
            <InfoRow label="Source" value={contact.source} />
            <InfoRow label="UTM Source" value={contact.utm_source} />
            <InfoRow label="UTM Medium" value={contact.utm_medium} />
            <InfoRow label="UTM Campaign" value={contact.utm_campaign} />
            <InfoRow label="Newsletter" value={contact.is_newsletter_subscribed ? 'Subscribed' : 'No'} />
            <InfoRow label="GDPR" value={contact.is_gdpr_compliant ? 'Compliant' : 'Not compliant'} />
            <InfoRow label="Created" value={contact.created_at ? new Date(contact.created_at).toLocaleString() : null} />
            <InfoRow label="Last updated" value={contact.updated_at ? new Date(contact.updated_at).toLocaleString() : null} />
            <InfoRow label="Contacted at" value={contact.contacted_at ? new Date(contact.contacted_at).toLocaleString() : null} />
          </div>
        </div>

        {/* Sidebar: status management */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Status & Assignment</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${STATUS_COLORS[status] ?? ''}`}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${PRIORITY_COLORS[priority] ?? ''}`}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Assigned to</label>
              <input
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                placeholder="Staff member name"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Quick tags */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-800">Flags</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className={`px-2 py-1 rounded-full font-medium ${STATUS_COLORS[contact.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {contact.status}
              </span>
              <span className={`px-2 py-1 rounded-full font-medium ${PRIORITY_COLORS[contact.priority] ?? 'bg-gray-100 text-gray-600'}`}>
                {contact.priority}
              </span>
              {contact.is_newsletter_subscribed && (
                <span className="px-2 py-1 rounded-full bg-teal-100 text-teal-700 font-medium">newsletter</span>
              )}
              {contact.is_spam && (
                <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 font-medium">spam</span>
              )}
            </div>

            {!contact.is_spam && (
              <button
                onClick={handleMarkSpam}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors mt-2"
              >
                <AlertCircle className="w-4 h-4" />
                Mark as Spam
              </button>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Quick Actions</h3>
            <a
              href={`mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject)}`}
              className="w-full flex items-center gap-2 text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Send Email
            </a>
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="w-full flex items-center gap-2 text-sm text-green-600 border border-green-200 rounded-lg px-3 py-2 hover:bg-green-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
                Call
              </a>
            )}
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full flex items-center gap-2 text-sm text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 mt-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleting ? 'Удаление…' : 'Удалить обращение'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

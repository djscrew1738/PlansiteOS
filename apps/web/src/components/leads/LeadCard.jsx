import { MapPin, Phone, Mail, Calendar, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function LeadCard({ lead, onStatusChange, onViewDetails }) {
  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-purple-100 text-purple-800',
      won: 'bg-green-100 text-green-800',
      lost: 'bg-red-100 text-red-800',
      spam: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'border-red-500 bg-red-50',
      high: 'border-orange-500 bg-orange-50',
      medium: 'border-yellow-500 bg-yellow-50',
      low: 'border-green-500 bg-green-50'
    };
    return colors[priority] || 'border-gray-300 bg-white';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`card p-6 border-l-4 ${getPriorityColor(lead.priority)} hover:shadow-lg transition-shadow`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {lead.jobType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown Job Type'}
            </h3>
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lead.status)}`}>
              {lead.status.toUpperCase()}
            </span>
            {lead.priority === 'urgent' && (
              <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 animate-pulse">
                URGENT
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            {lead.city && (
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>{lead.city}, {lead.county}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(lead.createdAt), 'MMM d, yyyy h:mm a')}</span>
            </div>
          </div>

          <p className="text-gray-700 line-clamp-2 mb-3">{lead.postText}</p>

          {lead.contactInfo && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {lead.contactInfo.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  <span>{lead.contactInfo.phone}</span>
                </div>
              )}
              {lead.contactInfo.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{lead.contactInfo.email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-gray-400" />
              <span className={`text-2xl font-bold ${getScoreColor(lead.aiScore)}`}>
                {lead.aiScore}
              </span>
            </div>
            <p className="text-xs text-gray-500">AI Score</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onViewDetails(lead)}
          className="btn-outline flex-1"
        >
          View Details
        </button>

        {lead.status === 'new' && (
          <button
            onClick={() => onStatusChange(lead.id, 'contacted')}
            className="btn-primary flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Contacted
          </button>
        )}

        {lead.status === 'contacted' && (
          <button
            onClick={() => onStatusChange(lead.id, 'quoted')}
            className="btn-primary flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Mark Quoted
          </button>
        )}

        {lead.status === 'quoted' && (
          <>
            <button
              onClick={() => onStatusChange(lead.id, 'won')}
              className="btn-success flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Won
            </button>
            <button
              onClick={() => onStatusChange(lead.id, 'lost')}
              className="btn-outline flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Lost
            </button>
          </>
        )}
      </div>
    </div>
  );
}

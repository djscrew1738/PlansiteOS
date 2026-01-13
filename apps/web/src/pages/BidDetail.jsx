import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, DollarSign, FileText, Calendar, User, Mail, Phone, MapPin,
  Clock, CheckCircle, XCircle, Send, Download, Printer, Edit2, Plus,
  Trash2, Save, X, Building, Wrench, Package, AlertCircle
} from 'lucide-react';
import { api } from '../api/client';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function BidDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddLineItem, setShowAddLineItem] = useState(false);

  // Fetch bid details
  const { data: bidData, isLoading, error } = useQuery({
    queryKey: ['bid', id],
    queryFn: () => api.get(`/api/v1/bids/${id}`),
  });

  // Update bid mutation
  const updateBidMutation = useMutation({
    mutationFn: (updates) => api.put(`/api/v1/bids/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries(['bid', id]);
      setIsEditing(false);
      toast.success('Bid updated successfully');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: (status) => api.patch(`/api/v1/bids/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bid', id]);
      toast.success('Bid status updated');
    },
  });

  // Delete line item mutation
  const deleteLineItemMutation = useMutation({
    mutationFn: (lineItemId) => api.delete(`/api/v1/bids/${id}/line-items/${lineItemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['bid', id]);
      toast.success('Line item removed');
    },
  });

  const bid = bidData?.data;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    // For now, use print dialog which allows saving as PDF
    window.print();
    toast.success('Use "Save as PDF" in the print dialog');
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="skeleton h-8 w-48"></div>
        <div className="skeleton h-64 w-full rounded-xl"></div>
        <div className="skeleton h-96 w-full rounded-xl"></div>
      </div>
    );
  }

  if (error || !bid) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Bid Not Found</h2>
        <p className="text-gray-600 mb-6">The requested bid could not be found.</p>
        <Link to="/bids" className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Bids
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-700',
      pending_review: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-blue-100 text-blue-700',
      sent: 'bg-purple-100 text-purple-700',
      viewed: 'bg-indigo-100 text-indigo-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      expired: 'bg-orange-100 text-orange-700',
    };
    return badges[status] || badges.draft;
  };

  const canEdit = ['draft', 'pending_review'].includes(bid.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <Link
            to="/bids"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <nav className="text-sm text-gray-500">
              <Link to="/bids" className="hover:text-gray-700">
                Bids
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700">{bid.bidNumber}</span>
            </nav>
            <div className="flex items-center space-x-3 mt-1">
              <h1 className="text-2xl font-bold text-gray-900">{bid.bidNumber}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(bid.status)}`}>
                {bid.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-gray-600">{bid.projectName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button onClick={handlePrint} className="btn-secondary">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </button>
          <button onClick={handleExportPDF} className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </button>
          {bid.status === 'draft' && (
            <button
              onClick={() => updateStatusMutation.mutate('pending_review')}
              className="btn-primary"
            >
              <Send className="w-4 h-4 mr-2" />
              Submit for Review
            </button>
          )}
          {bid.status === 'approved' && (
            <button
              onClick={() => updateStatusMutation.mutate('sent')}
              className="btn-primary bg-green-600 hover:bg-green-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Send to Customer
            </button>
          )}
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block mb-8">
        <div className="flex justify-between items-start border-b-2 border-green-600 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-green-700">CTL Plumbing LLC</h1>
            <p className="text-gray-600">Professional Plumbing Services</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{bid.bidNumber}</p>
            <p className="text-gray-600">Date: {format(new Date(bid.createdAt), 'MMMM d, yyyy')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project & Customer Info */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Project Details</h2>
              {canEdit && (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              )}
            </div>

            {isEditing ? (
              <EditBidForm bid={bid} onSave={(updates) => updateBidMutation.mutate(updates)} onCancel={() => setIsEditing(false)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Project</h3>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900">{bid.projectName}</p>
                        <p className="text-sm text-gray-600 capitalize">{bid.projectType}</p>
                      </div>
                    </div>
                    {bid.projectAddress && (
                      <div className="flex items-start space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <p className="text-gray-700">{bid.projectAddress}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Customer</h3>
                  <div className="space-y-3">
                    {bid.customerName && (
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <p className="text-gray-700">{bid.customerName}</p>
                      </div>
                    )}
                    {bid.customerEmail && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <a href={`mailto:${bid.customerEmail}`} className="text-blue-600 hover:underline">
                          {bid.customerEmail}
                        </a>
                      </div>
                    )}
                    {bid.customerPhone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <a href={`tel:${bid.customerPhone}`} className="text-blue-600 hover:underline">
                          {bid.customerPhone}
                        </a>
                      </div>
                    )}
                    {!bid.customerName && !bid.customerEmail && !bid.customerPhone && (
                      <p className="text-gray-500 italic">No customer information provided</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Line Items */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
              {canEdit && (
                <button
                  onClick={() => setShowAddLineItem(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">#</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-500">Description</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-gray-500">Qty</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Materials</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Labor</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-gray-500">Total</th>
                    {canEdit && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {bid.lineItems?.map((item, index) => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm text-gray-500">{item.lineNumber}</td>
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{item.description}</p>
                          {item.roomLocation && (
                            <p className="text-sm text-gray-500">{item.roomLocation}</p>
                          )}
                          {item.isOptional && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Optional</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center text-gray-700">{item.quantity}</td>
                      <td className="py-3 px-2 text-right text-gray-700">{formatCurrency(item.lineMaterialTotal)}</td>
                      <td className="py-3 px-2 text-right text-gray-700">{formatCurrency(item.lineLaborTotal)}</td>
                      <td className="py-3 px-2 text-right font-medium text-gray-900">{formatCurrency(item.lineTotal)}</td>
                      {canEdit && (
                        <td className="py-3 px-2">
                          <button
                            onClick={() => {
                              if (confirm('Remove this line item?')) {
                                deleteLineItemMutation.mutate(item.id);
                              }
                            }}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {bid.lineItems?.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No line items yet. Add items to build your quote.
              </div>
            )}
          </div>

          {/* Terms */}
          {bid.termsAndConditions && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {bid.termsAndConditions}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          <div className="card bg-gradient-to-br from-green-50 to-white border-green-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quote Summary</h2>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Materials</span>
                <span className="font-medium">{formatCurrency(bid.subtotalMaterials)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Labor</span>
                <span className="font-medium">{formatCurrency(bid.subtotalLabor)}</span>
              </div>
              {bid.subtotalPermits > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Permits</span>
                  <span className="font-medium">{formatCurrency(bid.subtotalPermits)}</span>
                </div>
              )}
              {bid.subtotalOther > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Other</span>
                  <span className="font-medium">{formatCurrency(bid.subtotalOther)}</span>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{formatCurrency(bid.subtotal)}</span>
              </div>

              {bid.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({bid.discountPercent}%)</span>
                  <span>-{formatCurrency(bid.discountAmount)}</span>
                </div>
              )}

              {bid.markupPercent > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Markup ({bid.markupPercent}%)</span>
                  <span className="font-medium">Included</span>
                </div>
              )}

              {bid.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({bid.taxPercent}%)</span>
                  <span className="font-medium">{formatCurrency(bid.taxAmount)}</span>
                </div>
              )}

              <div className="border-t-2 border-green-300 pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(bid.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Validity & Dates */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Validity</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Created
                </span>
                <span className="font-medium">{format(new Date(bid.createdAt), 'MMM d, yyyy')}</span>
              </div>
              {bid.validUntil && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Valid Until
                  </span>
                  <span className="font-medium">{format(new Date(bid.validUntil), 'MMM d, yyyy')}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pricing Tier</span>
                <span className="font-medium capitalize bg-gray-100 px-2 py-0.5 rounded">{bid.pricingTier}</span>
              </div>
            </div>
          </div>

          {/* Linked Blueprint */}
          {bid.blueprintId && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Source Blueprint</h2>
              <Link
                to={`/blueprints/${bid.blueprintId}`}
                className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">{bid.blueprintProjectName || 'View Blueprint'}</p>
                  <p className="text-sm text-blue-600">{bid.blueprintFileName}</p>
                </div>
              </Link>
            </div>
          )}

          {/* Activity Log */}
          {bid.activity && bid.activity.length > 0 && (
            <div className="card print:hidden">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {bid.activity.slice(0, 10).map((activity, index) => (
                  <div key={activity.id} className="flex items-start space-x-3 text-sm">
                    <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                    <div>
                      <p className="text-gray-700">{activity.description}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Line Item Modal */}
      {showAddLineItem && (
        <AddLineItemModal
          bidId={id}
          onClose={() => setShowAddLineItem(false)}
          onSuccess={() => {
            setShowAddLineItem(false);
            queryClient.invalidateQueries(['bid', id]);
          }}
        />
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .card { box-shadow: none; border: 1px solid #e5e7eb; }
        }
      `}</style>
    </div>
  );
}

function EditBidForm({ bid, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    projectName: bid.projectName || '',
    projectAddress: bid.projectAddress || '',
    customerName: bid.customerName || '',
    customerEmail: bid.customerEmail || '',
    customerPhone: bid.customerPhone || '',
    markupPercent: bid.markupPercent || 15,
    discountPercent: bid.discountPercent || 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Project Name"
          value={formData.projectName}
          onChange={e => setFormData({ ...formData, projectName: e.target.value })}
          className="input"
        />
        <input
          type="text"
          placeholder="Project Address"
          value={formData.projectAddress}
          onChange={e => setFormData({ ...formData, projectAddress: e.target.value })}
          className="input"
        />
        <input
          type="text"
          placeholder="Customer Name"
          value={formData.customerName}
          onChange={e => setFormData({ ...formData, customerName: e.target.value })}
          className="input"
        />
        <input
          type="email"
          placeholder="Customer Email"
          value={formData.customerEmail}
          onChange={e => setFormData({ ...formData, customerEmail: e.target.value })}
          className="input"
        />
        <input
          type="tel"
          placeholder="Customer Phone"
          value={formData.customerPhone}
          onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
          className="input"
        />
        <div className="flex space-x-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500">Markup %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.markupPercent}
              onChange={e => setFormData({ ...formData, markupPercent: parseFloat(e.target.value) })}
              className="input"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-500">Discount %</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.discountPercent}
              onChange={e => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })}
              className="input"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>
    </form>
  );
}

function AddLineItemModal({ bidId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    description: '',
    itemType: 'misc',
    quantity: 1,
    unitMaterialCost: 0,
    unitLaborCost: 0,
    roomLocation: '',
    notes: '',
    isOptional: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post(`/api/v1/bids/${bidId}/line-items`, formData);
      toast.success('Line item added');
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.error?.message || 'Failed to add line item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add Line Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="e.g., Additional toilet installation"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.itemType}
                onChange={e => setFormData({ ...formData, itemType: e.target.value })}
                className="input"
              >
                <option value="fixture">Fixture</option>
                <option value="material">Material</option>
                <option value="labor">Labor</option>
                <option value="permit">Permit</option>
                <option value="equipment">Equipment</option>
                <option value="misc">Miscellaneous</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitMaterialCost}
                onChange={e => setFormData({ ...formData, unitMaterialCost: parseFloat(e.target.value) })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Labor Cost ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.unitLaborCost}
                onChange={e => setFormData({ ...formData, unitLaborCost: parseFloat(e.target.value) })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location/Room</label>
            <input
              type="text"
              value={formData.roomLocation}
              onChange={e => setFormData({ ...formData, roomLocation: e.target.value })}
              className="input"
              placeholder="e.g., Master Bathroom"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOptional"
              checked={formData.isOptional}
              onChange={e => setFormData({ ...formData, isOptional: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="isOptional" className="ml-2 text-sm text-gray-700">
              Mark as optional item
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.description}
              className="btn-primary bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Line Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, FileText, MapPin, Calendar, Download, AlertTriangle, Scale, Ruler, Layers, Settings2, Eye, EyeOff } from 'lucide-react';
import { api } from '../api/client';
import { formatDistanceToNow, format } from 'date-fns';
import { useState } from 'react';

// Placeholder for a more advanced blueprint viewer
function BlueprintImageViewer({ src, projectName, analysisData, fileType }) {
  const [showAnnotations, setShowAnnotations] = useState(true);

  if (fileType === 'application/dxf') {
    return (
      <div className="bg-gray-100 rounded-lg p-16 text-center border-2 border-dashed border-gray-300">
        <FileText className="w-20 h-20 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg mb-2">DXF File Loaded</p>
        <p className="text-sm text-gray-500">Vector rendering for DXF files is coming soon. Raw data is available in the 'Raw Data' tab.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
      <img
        src={src}
        alt={projectName}
        className="w-full h-auto object-contain max-h-[70vh]"
      />
      {/* Overlay for annotations - conceptual for now */}
      {showAnnotations && analysisData?.rooms?.map(room => (
        room.fixtures.map((fixture, idx) => (
          <div
            key={`${room.name}-${fixture.type}-${idx}`}
            className="absolute p-1 text-xs bg-blue-500 text-white rounded-full opacity-75"
            style={{ top: '10%', left: `${10 + idx * 5}%` }} // Placeholder positioning
            title={`${fixture.quantity}x ${fixture.type} in ${room.name}`}
          >
            {fixture.type.substring(0, 2).toUpperCase()}
          </div>
        ))
      ))}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowAnnotations(!showAnnotations)}
          className="btn-icon bg-white shadow-md"
          title={showAnnotations ? "Hide Annotations" : "Show Annotations"}
        >
          {showAnnotations ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}


export default function BlueprintDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'details', 'rooms', 'raw'

  const { data: blueprint, isLoading, error } = useQuery({
    queryKey: ['blueprint', id],
    queryFn: () => api.get(`/api/blueprints/${id}`),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-primary-600"></div>
        <p className="ml-4 text-xl text-gray-600">Loading blueprint details...</p>
      </div>
    );
  }

  if (error || !blueprint) {
    return (
      <div className="card text-center py-20">
        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-gray-900 mb-3">Blueprint not found or inaccessible</h3>
        <p className="text-gray-600 mb-8">We couldn't load the details for this blueprint. It might not exist or an error occurred.</p>
        <Link to="/blueprints" className="btn-primary btn-lg">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to All Blueprints
        </Link>
      </div>
    );
  }

  const analysisData = blueprint.analysis_data; // This now comes pre-parsed and validated by Zod!

  const getStatusBadge = status => {
    switch (status) {
      case 'processed-dxf':
        return 'bg-blue-100 text-blue-800';
        return 'bg-emerald-100 text-emerald-800';
      case 'processing':
        return 'bg-amber-100 text-amber-800 animate-pulse';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processed-dxf': // New status for DXF files
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            to="/blueprints"
            className="inline-flex items-center text-gray-500 hover:text-primary-600 transition-colors mb-2 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blueprints
          </Link>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{blueprint.project_name}</h1>
          {blueprint.project_address && (
            <p className="text-gray-600 mt-2 flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-2 text-primary-500" />
              {blueprint.project_address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusBadge(blueprint.status)}`}>
            {blueprint.status}
          </span>
          <button className="btn-secondary btn-lg flex items-center shadow-md hover:shadow-lg">
            <Download className="w-5 h-5 mr-2" />
            <span>Export</span>
          </button>
          <button className="btn-icon btn-lg shadow-md hover:shadow-lg">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Blueprint Viewer & Analysis Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Blueprint Visual</h2>
            {blueprint.file_path ? (
              <BlueprintImageViewer
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${blueprint.file_path.replace(/^\./, '')}`}
                projectName={blueprint.project_name}
                analysisData={analysisData}
                fileType={blueprint.file_type}
              />
            ) : (
              <div className="bg-gray-100 rounded-lg p-16 text-center border-2 border-dashed border-gray-300">
                <FileText className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Blueprint image not available.</p>
              </div>
            )}
          </div>

          {/* Analysis Data Tabs */}
          <div className="card p-4 sm:p-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`${activeTab === 'summary' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Summary
                </button>
                <button
                  onClick={() => setActiveTab('rooms')}
                  className={`${activeTab === 'rooms' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Rooms ({analysisData?.rooms?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Blueprint Details
                </button>
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`${activeTab === 'raw' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
                >
                  Raw Data
                </button>
              </nav>
            </div>

            <div className="mt-6">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  {blueprint.status === 'processed-dxf' ? (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-800">
                      <p className="font-bold">DXF File Processed</p>
                      <p className="text-sm">AI Vision Summary is not available for DXF files. Please refer to the 'Raw Data' tab for parsed DXF geometry.</p>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-gray-800">Overall Analysis Summary</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem label="Total Fixtures" value={analysisData?.summary?.totalFixtures || 'N/A'} />
                        <DetailItem label="Total Rooms" value={analysisData?.summary?.totalRooms || 'N/A'} />
                        <DetailItem label="Scale" value={analysisData?.summary?.scale || 'Not detected'} icon={<Scale className="w-4 h-4 text-gray-500" />} />
                        <DetailItem label="Measurement Unit" value={analysisData?.summary?.measurementUnit || 'N/A'} icon={<Ruler className="w-4 h-4 text-gray-500" />} />
                        <DetailItem label="Floors" value={analysisData?.summary?.floors || 'N/A'} icon={<Layers className="w-4 h-4 text-gray-500" />} />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-800 mt-6">Fixture Totals</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {analysisData?.fixtureTotals && Object.entries(analysisData.fixtureTotals).map(([type, count]) => (
                          <DetailItem key={type} label={type.replace(/_/g, ' ')} value={count} />
                        ))}
                      </div>
                      {analysisData?.notes && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6">
                          <p className="text-sm text-blue-800 font-medium">AI Notes:</p>
                          <p className="text-sm text-blue-700">{analysisData.notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'rooms' && (
                <div className="space-y-6">
                  {blueprint.status === 'processed-dxf' ? (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-blue-800">
                      <p className="font-bold">DXF File Processed</p>
                      <p className="text-sm">Detailed room analysis from AI Vision is not available for DXF files. Please refer to the 'Raw Data' tab for parsed DXF geometry.</p>
                    </div>
                  ) : analysisData?.rooms?.length > 0 ? (
                    analysisData.rooms.map((room, roomIdx) => (
                      <div key={roomIdx} className="border-b pb-4 last:border-b-0">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">{room.name} (Floor: {room.floor || 'N/A'})</h3>
                        <p className="text-sm text-gray-600 mb-3">{room.fixtureCount} fixtures</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {room.fixtures.map((fixture, fixtureIdx) => (
                            <div key={fixtureIdx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <p className="font-semibold text-gray-900 capitalize">{fixture.quantity}x {fixture.type.replace(/_/g, ' ')}</p>
                              <p className="text-sm text-gray-600">
                                {fixture.width && fixture.depth ? `${fixture.width}x${fixture.depth} ${fixture.unit || ''}` : 'Measurements N/A'}
                              </p>
                              {fixture.notes && <p className="text-xs text-gray-500 mt-1">Notes: {fixture.notes}</p>}
                              {fixture.confidence && (
                                <p className="text-xs text-blue-600 mt-1">Confidence: {fixture.confidence}%</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">No detailed room analysis available.</p>
                  )}
                </div>
              )}

              {activeTab === 'details' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-800">Blueprint File Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailItem label="File Name" value={blueprint.file_name || 'N/A'} />
                    <DetailItem label="File Type" value={blueprint.file_type?.split('/')[1]?.toUpperCase() || 'Unknown'} />
                    <DetailItem label="File Size" value={`${(blueprint.file_size / 1024 / 1024).toFixed(2)} MB`} />
                    <DetailItem
                      label="Uploaded On"
                      value={format(new Date(blueprint.created_at), 'MMM d, yyyy HH:mm')}
                      subValue={formatDistanceToNow(new Date(blueprint.created_at), { addSuffix: true })}
                      icon={<Calendar className="w-4 h-4 text-gray-500" />}
                    />
                    {blueprint.analysis_completed_at && (
                      <DetailItem
                        label="Analysis Completed"
                        value={format(new Date(blueprint.analysis_completed_at), 'MMM d, yyyy HH:mm')}
                      />
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'raw' && (
                <pre className="bg-gray-800 text-white p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{JSON.stringify(blueprint, null, 2)}</code>
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Action Card */}
          <div className="card p-4 sm:p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              <button className="btn-primary w-full btn-lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Generate Bid & Report
              </button>
              <button className="btn-secondary w-full btn-lg">
                <Settings2 className="w-5 h-5 mr-2" />
                Adjust Scope Filters
              </button>
              <button className="btn-outline w-full btn-lg text-red-600 border-red-200 hover:bg-red-50">
                <Trash2 className="w-5 h-5 mr-2" />
                Delete Blueprint
              </button>
            </div>
          </div>

          {/* AI Confidence & Warnings */}
          <div className="card p-4 sm:p-6 bg-yellow-50 border-yellow-200">
            <div className="flex items-center mb-3">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <h2 className="text-xl font-bold text-yellow-800">AI Confidence & Review</h2>
            </div>
            <p className="text-yellow-700 text-sm mb-4">
              Review AI-derived data carefully. Low confidence scores or specific warnings might require human verification.
            </p>
            <ul className="space-y-2 text-sm text-yellow-900">
              <li><span className="font-semibold">Overall Confidence:</span> High</li>
              <li><span className="font-semibold">Warnings:</span> None</li>
              <li className="text-primary-600 hover:underline cursor-pointer">
                <Link to="#">View AI Audit Trail</Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, subValue, icon }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center text-sm text-gray-500 mb-1">
        {icon && <span className="mr-2">{icon}</span>}
        {label}
      </div>
      <p className="text-lg font-semibold text-gray-800">{value}</p>
      {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
    </div>
  );
}

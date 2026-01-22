import { useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  Droplets,
  Wrench,
  Cog,
  Truck,
  ChevronRight,
  ExternalLink,
  Tag,
  DollarSign,
  Box,
  MoreVertical,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';

// Material categories
const categories = [
  {
    id: 'fixtures',
    name: 'Fixtures',
    icon: Droplets,
    count: 45,
    gradient: 'from-blue-500 to-blue-600',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    id: 'piping',
    name: 'Piping',
    icon: Cog,
    count: 32,
    gradient: 'from-purple-500 to-purple-600',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
  {
    id: 'fittings',
    name: 'Fittings',
    icon: Wrench,
    count: 78,
    gradient: 'from-emerald-500 to-emerald-600',
    bgLight: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    id: 'equipment',
    name: 'Equipment',
    icon: Truck,
    count: 12,
    gradient: 'from-orange-500 to-orange-600',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-600',
  },
];

// Mock materials data
const mockMaterials = [
  {
    id: 1,
    name: 'Kohler Highline Toilet',
    sku: 'KHL-4829-W',
    category: 'fixtures',
    brand: 'Kohler',
    price: 289.99,
    unit: 'each',
    inStock: 24,
    description: 'Two-piece elongated toilet, white, 1.28 GPF',
    image: null,
  },
  {
    id: 2,
    name: 'Delta Faucet - Chrome',
    sku: 'DLT-9178-C',
    category: 'fixtures',
    brand: 'Delta',
    price: 149.99,
    unit: 'each',
    inStock: 18,
    description: 'Single handle pull-down kitchen faucet, chrome finish',
    image: null,
  },
  {
    id: 3,
    name: 'PVC Pipe 2" x 10ft',
    sku: 'PVC-2-10',
    category: 'piping',
    brand: 'Charlotte',
    price: 12.99,
    unit: 'length',
    inStock: 150,
    description: 'Schedule 40 PVC pipe, 2 inch diameter, 10 foot length',
    image: null,
  },
  {
    id: 4,
    name: 'Copper Elbow 90° 1/2"',
    sku: 'CPE-90-05',
    category: 'fittings',
    brand: 'Nibco',
    price: 2.49,
    unit: 'each',
    inStock: 500,
    description: 'Copper 90 degree elbow fitting, 1/2 inch',
    image: null,
  },
  {
    id: 5,
    name: 'Water Heater 50gal',
    sku: 'RHM-WH50-G',
    category: 'equipment',
    brand: 'Rheem',
    price: 899.99,
    unit: 'each',
    inStock: 5,
    description: 'Gas water heater, 50 gallon capacity, 40,000 BTU',
    image: null,
  },
  {
    id: 6,
    name: 'Moen Shower Valve',
    sku: 'MOE-2520',
    category: 'fixtures',
    brand: 'Moen',
    price: 189.99,
    unit: 'each',
    inStock: 12,
    description: 'Posi-Temp pressure balancing valve, rough-in only',
    image: null,
  },
];

export default function Material() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showActionsMenu, setShowActionsMenu] = useState(null);

  const filteredMaterials = mockMaterials.filter(mat => {
    const matchesSearch = mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mat.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || mat.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg shadow-amber-500/30">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
              Materials
            </h1>
            <p className="text-sm text-gray-600">
              Manage your inventory and pricing
            </p>
          </div>
        </div>
        <button className="btn-primary bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/30">
          <Plus className="w-4 h-4 mr-2" />
          Add Material
        </button>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const isSelected = selectedCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(isSelected ? null : category.id)}
              className={`card p-4 text-left transition-all hover:scale-[1.02] ${
                isSelected
                  ? `ring-2 ring-offset-2 ring-amber-500 ${category.bgLight}`
                  : 'hover:shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 bg-gradient-to-r ${category.gradient} rounded-xl shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`text-2xl font-bold ${category.textColor}`}>
                  {category.count}
                </span>
              </div>
              <p className="font-semibold text-gray-900">{category.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">items in stock</p>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="card bg-gradient-to-br from-white to-amber-50/30">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, SKU, or brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-12 bg-white/80 backdrop-blur-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
        {selectedCategory && (
          <div className="mt-4 flex items-center">
            <span className="text-sm text-gray-500 mr-2">Filtered by:</span>
            <button
              onClick={() => setSelectedCategory(null)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                getCategoryInfo(selectedCategory)?.bgLight
              } ${getCategoryInfo(selectedCategory)?.textColor}`}
            >
              {getCategoryInfo(selectedCategory)?.name}
              <span className="ml-2 hover:bg-white/50 rounded-full p-0.5">&times;</span>
            </button>
          </div>
        )}
      </div>

      {/* Materials Display */}
      {filteredMaterials.length === 0 ? (
        <div className="card text-center py-16 bg-gradient-to-br from-white to-amber-50/30">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
            <Package className="w-10 h-10 text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || selectedCategory ? 'No materials found' : 'No materials yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || selectedCategory
              ? 'Try adjusting your search or filter criteria'
              : 'Add your first material to get started with inventory management'
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <button className="btn-primary bg-gradient-to-r from-amber-500 to-orange-500">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Material
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material, index) => {
            const category = getCategoryInfo(material.category);
            const CategoryIcon = category?.icon || Package;

            return (
              <div
                key={material.id}
                className="card hover:shadow-lg transition-all duration-300 group animate-slide-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 bg-gradient-to-r ${category?.gradient || 'from-gray-500 to-gray-600'} rounded-xl shadow-lg`}>
                    <CategoryIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setShowActionsMenu(showActionsMenu === material.id ? null : material.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {showActionsMenu === material.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowActionsMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border py-1 z-20">
                          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </button>
                          <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </button>
                          <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
                  {material.name}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{material.description}</p>

                <div className="flex items-center flex-wrap gap-2 mb-4">
                  <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${category?.bgLight} ${category?.textColor}`}>
                    {category?.name}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
                    <Tag className="w-3 h-3 mr-1" />
                    {material.sku}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xl font-bold text-amber-600">
                      {formatCurrency(material.price)}
                    </p>
                    <p className="text-xs text-gray-500">per {material.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${material.inStock > 10 ? 'text-green-600' : 'text-amber-600'}`}>
                      {material.inStock} in stock
                    </p>
                    <p className="text-xs text-gray-500">{material.brand}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMaterials.map((material) => {
                  const category = getCategoryInfo(material.category);

                  return (
                    <tr key={material.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{material.name}</p>
                          <p className="text-sm text-gray-500">{material.brand}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-gray-600">{material.sku}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${category?.bgLight} ${category?.textColor}`}>
                          {category?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-amber-600">{formatCurrency(material.price)}</span>
                        <span className="text-xs text-gray-500 ml-1">/{material.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${material.inStock > 10 ? 'text-green-600' : 'text-amber-600'}`}>
                          {material.inStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

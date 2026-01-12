import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { addPricingHistory, createPricingItem, listPricingHistory, listPricingItems } from '../components/api';

export default function PricingHistoryPage() {
  const { projectId } = useParams();
  const [items, setItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [itemForm, setItemForm] = useState({ name: '', unit: '' });
  const [historyForm, setHistoryForm] = useState({ price: '', source: '' });

  useEffect(() => {
    if (!projectId) return;
    listPricingItems(projectId).then(setItems);
  }, [projectId]);

  useEffect(() => {
    if (!selectedItem) return;
    listPricingHistory(selectedItem.id).then(setHistory);
  }, [selectedItem]);

  const addItem = async () => {
    if (!projectId || !itemForm.name || !itemForm.unit) return;
    const created = await createPricingItem({ projectId, name: itemForm.name, unit: itemForm.unit });
    setItems((prev) => [...prev, created]);
    setItemForm({ name: '', unit: '' });
  };

  const addHistory = async () => {
    if (!selectedItem || !historyForm.price) return;
    const created = await addPricingHistory({
      itemId: selectedItem.id,
      price: Number(historyForm.price),
      source: historyForm.source || undefined,
    });
    setHistory((prev) => [...prev, created]);
    setHistoryForm({ price: '', source: '' });
  };

  return (
    <div className="layout">
      <div className="sidebar">
        <h3>Pricing Items</h3>
        <div className="card">
          <input
            className="input"
            placeholder="Item name"
            value={itemForm.name}
            onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Unit (ft, ea, etc)"
            value={itemForm.unit}
            onChange={(e) => setItemForm((prev) => ({ ...prev, unit: e.target.value }))}
          />
          <button className="button" onClick={addItem}>Add Item</button>
        </div>
        <div className="card">
          <label>Active Item</label>
          <select
            className="input"
            value={selectedItem?.id || ''}
            onChange={(e) => setSelectedItem(items.find((item) => item.id === e.target.value))}
          >
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="viewer-panel">
        <div className="viewer-toolbar card">
          <strong>Historical Pricing</strong>
          {selectedItem && <span>{selectedItem.name}</span>}
        </div>
        <div className="card">
          <h3>Add Price Entry</h3>
          <input
            className="input"
            placeholder="Price"
            value={historyForm.price}
            onChange={(e) => setHistoryForm((prev) => ({ ...prev, price: e.target.value }))}
          />
          <input
            className="input"
            placeholder="Source"
            value={historyForm.source}
            onChange={(e) => setHistoryForm((prev) => ({ ...prev, source: e.target.value }))}
          />
          <button className="button" onClick={addHistory} disabled={!selectedItem}>
            Add Price
          </button>
        </div>
        <div className="card">
          <h3>History</h3>
          {history.length === 0 && <p>No history yet.</p>}
          {history.map((entry) => (
            <div key={entry.id} style={{ marginBottom: '8px' }}>
              <strong>${entry.price.toFixed(2)}</strong>
              {entry.source && <span> • {entry.source}</span>}
              <div>{new Date(entry.effectiveDate).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

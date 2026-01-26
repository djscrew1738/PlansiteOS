import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DragDropList, { type DragDropItem } from './DragDropList';

const meta = {
  title: 'UI/DragDropList',
  component: DragDropList,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DragDropList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems: DragDropItem[] = [
  { id: '1', content: 'Task 1: Review pull requests' },
  { id: '2', content: 'Task 2: Update documentation' },
  { id: '3', content: 'Task 3: Fix bugs' },
  { id: '4', content: 'Task 4: Write tests' },
  { id: '5', content: 'Task 5: Deploy to production' },
];

export const Default: Story = {
  render: () => {
    const [items, setItems] = useState(sampleItems);
    return (
      <div>
        <p className="text-sm text-slate-400 mb-4">Drag items to reorder</p>
        <DragDropList items={items} onReorder={setItems} />
      </div>
    );
  },
};

export const WithCustomRendering: Story = {
  render: () => {
    const [items, setItems] = useState<DragDropItem[]>([
      {
        id: '1',
        content: (
          <div>
            <h4 className="font-semibold text-slate-100">High Priority</h4>
            <p className="text-sm text-slate-400">Critical bug fix needed</p>
          </div>
        ),
      },
      {
        id: '2',
        content: (
          <div>
            <h4 className="font-semibold text-slate-100">Medium Priority</h4>
            <p className="text-sm text-slate-400">Feature enhancement</p>
          </div>
        ),
      },
      {
        id: '3',
        content: (
          <div>
            <h4 className="font-semibold text-slate-100">Low Priority</h4>
            <p className="text-sm text-slate-400">Documentation updates</p>
          </div>
        ),
      },
    ]);
    return (
      <div>
        <p className="text-sm text-slate-400 mb-4">Priority list (drag to reorder)</p>
        <DragDropList items={items} onReorder={setItems} />
      </div>
    );
  },
};

export const WithoutHandle: Story = {
  render: () => {
    const [items, setItems] = useState(sampleItems);
    return (
      <div>
        <p className="text-sm text-slate-400 mb-4">Drag anywhere on the item</p>
        <DragDropList items={items} onReorder={setItems} showHandle={false} />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: {
    items: sampleItems,
    disabled: true,
  },
};

export const WithBadges: Story = {
  render: () => {
    const [items, setItems] = useState<DragDropItem[]>([
      {
        id: '1',
        content: (
          <div className="flex items-center justify-between">
            <span className="text-slate-100">Design new landing page</span>
            <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full border border-red-500/20">
              Urgent
            </span>
          </div>
        ),
      },
      {
        id: '2',
        content: (
          <div className="flex items-center justify-between">
            <span className="text-slate-100">Update API documentation</span>
            <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full border border-yellow-500/20">
              In Progress
            </span>
          </div>
        ),
      },
      {
        id: '3',
        content: (
          <div className="flex items-center justify-between">
            <span className="text-slate-100">Setup CI/CD pipeline</span>
            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
              Completed
            </span>
          </div>
        ),
      },
    ]);
    return (
      <div>
        <p className="text-sm text-slate-400 mb-4">Tasks with status badges</p>
        <DragDropList items={items} onReorder={setItems} />
      </div>
    );
  },
};

export const CustomStyling: Story = {
  render: () => {
    const [items, setItems] = useState(sampleItems);
    return (
      <div>
        <p className="text-sm text-slate-400 mb-4">Custom styled items</p>
        <DragDropList
          items={items}
          onReorder={setItems}
          itemClassName="hover:bg-slate-800/50 hover:shadow-lg"
          renderItem={(item, isDragging) => (
            <div className={`p-4 ${isDragging ? 'text-blue-400' : 'text-slate-100'}`}>
              {item.content}
            </div>
          )}
        />
      </div>
    );
  },
};

export const LongList: Story = {
  render: () => {
    const longList: DragDropItem[] = Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      content: `Item ${i + 1}: ${['Low', 'Medium', 'High'][i % 3]} priority task`,
    }));
    const [items, setItems] = useState(longList);
    return (
      <div style={{ maxHeight: '400px', overflow: 'auto' }}>
        <p className="text-sm text-slate-400 mb-4 sticky top-0 bg-slate-950 pb-2">
          Scrollable list with 10 items
        </p>
        <DragDropList items={items} onReorder={setItems} />
      </div>
    );
  },
};

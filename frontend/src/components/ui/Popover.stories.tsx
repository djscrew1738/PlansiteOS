import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Popover from './Popover';
import Button from './Button';
import Input from './Input';

const meta = {
  title: 'UI/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

const SimpleContent = () => (
  <div className="p-4 w-64">
    <p className="text-sm text-slate-300">This is a simple popover content</p>
  </div>
);

export const Default: Story = {
  args: {
    content: <SimpleContent />,
    children: <Button>Click me</Button>,
  },
};

export const BottomPlacement: Story = {
  args: {
    content: <SimpleContent />,
    placement: 'bottom',
    children: <Button>Bottom</Button>,
  },
};

export const TopPlacement: Story = {
  args: {
    content: <SimpleContent />,
    placement: 'top',
    children: <Button>Top</Button>,
  },
};

export const LeftPlacement: Story = {
  args: {
    content: <SimpleContent />,
    placement: 'left',
    children: <Button>Left</Button>,
  },
};

export const RightPlacement: Story = {
  args: {
    content: <SimpleContent />,
    placement: 'right',
    children: <Button>Right</Button>,
  },
};

export const HoverTrigger: Story = {
  args: {
    content: <SimpleContent />,
    trigger: 'hover',
    children: <Button>Hover me</Button>,
  },
};

export const WithForm: Story = {
  render: () => (
    <Popover
      content={
        <div className="p-4 w-80">
          <h3 className="text-lg font-semibold text-slate-100 mb-3">Quick Add</h3>
          <div className="space-y-3">
            <Input label="Name" placeholder="Enter name..." />
            <Input label="Email" type="email" placeholder="Enter email..." />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm">Cancel</Button>
              <Button size="sm">Save</Button>
            </div>
          </div>
        </div>
      }
      children={<Button>Add Item</Button>}
    />
  ),
};

export const WithMenu: Story = {
  render: () => (
    <Popover
      content={
        <div className="py-1 min-w-[160px]">
          <button className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            Profile
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            Settings
          </button>
          <button className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-800 transition-colors">
            Billing
          </button>
          <div className="border-t border-slate-800 my-1"></div>
          <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-800 transition-colors">
            Logout
          </button>
        </div>
      }
      placement="bottom"
      children={<Button>Account</Button>}
    />
  ),
};

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setOpen(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
          >
            Open
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1 bg-slate-700 text-white rounded text-sm"
          >
            Close
          </button>
        </div>

        <Popover
          open={open}
          onOpenChange={setOpen}
          content={
            <div className="p-4 w-64">
              <p className="text-sm text-slate-300">Controlled popover</p>
            </div>
          }
          children={<Button>Target</Button>}
        />
      </div>
    );
  },
};

export const RichContent: Story = {
  render: () => (
    <Popover
      content={
        <div className="p-4 w-80">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">JD</span>
            </div>
            <div>
              <h4 className="font-semibold text-slate-100">John Doe</h4>
              <p className="text-sm text-slate-400">Software Engineer</p>
            </div>
          </div>
          <p className="text-sm text-slate-300 mb-3">
            Building amazing products with modern web technologies.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary">View Profile</Button>
            <Button size="sm">Follow</Button>
          </div>
        </div>
      }
      children={<Button>User Info</Button>}
    />
  ),
};

export const AllPlacements: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-16 p-16">
      <div></div>
      <Popover content={<SimpleContent />} placement="top">
        <Button>Top</Button>
      </Popover>
      <div></div>

      <Popover content={<SimpleContent />} placement="left">
        <Button>Left</Button>
      </Popover>
      <div></div>
      <Popover content={<SimpleContent />} placement="right">
        <Button>Right</Button>
      </Popover>

      <div></div>
      <Popover content={<SimpleContent />} placement="bottom">
        <Button>Bottom</Button>
      </Popover>
      <div></div>
    </div>
  ),
};

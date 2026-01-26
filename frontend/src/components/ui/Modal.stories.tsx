import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Modal from './Modal';
import Button from './Button';

const meta = {
  title: 'UI/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Modal size',
    },
    title: {
      control: 'text',
      description: 'Modal title',
    },
    isOpen: {
      control: 'boolean',
      description: 'Open state',
    },
  },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

const ModalWrapper = ({ size, title, children }: { size?: 'sm' | 'md' | 'lg' | 'xl'; title?: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={size} title={title}>
        {children}
      </Modal>
    </>
  );
};

export const Default: Story = {
  render: () => (
    <ModalWrapper title="Modal Title">
      <p className="text-slate-300">This is a basic modal with default settings.</p>
    </ModalWrapper>
  ),
};

export const Small: Story = {
  render: () => (
    <ModalWrapper title="Small Modal" size="sm">
      <p className="text-slate-300">This is a small modal (max-w-md).</p>
    </ModalWrapper>
  ),
};

export const Medium: Story = {
  render: () => (
    <ModalWrapper title="Medium Modal" size="md">
      <p className="text-slate-300">This is a medium modal (max-w-lg).</p>
    </ModalWrapper>
  ),
};

export const Large: Story = {
  render: () => (
    <ModalWrapper title="Large Modal" size="lg">
      <p className="text-slate-300">This is a large modal (max-w-2xl).</p>
    </ModalWrapper>
  ),
};

export const ExtraLarge: Story = {
  render: () => (
    <ModalWrapper title="Extra Large Modal" size="xl">
      <p className="text-slate-300">This is an extra large modal (max-w-4xl).</p>
    </ModalWrapper>
  ),
};

export const WithForm: Story = {
  render: () => (
    <ModalWrapper title="Create New Project">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Name</label>
          <input
            type="text"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Description</label>
          <textarea
            className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Enter description"
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Create Project</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const WithoutTitle: Story = {
  render: () => (
    <ModalWrapper>
      <div className="text-center py-4">
        <h3 className="text-xl font-semibold text-slate-100 mb-2">Are you sure?</h3>
        <p className="text-slate-400 mb-6">This action cannot be undone.</p>
        <div className="flex justify-center gap-2">
          <Button variant="secondary">Cancel</Button>
          <Button variant="danger">Delete</Button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

import type { Meta, StoryObj } from '@storybook/react';
import Progress from './Progress';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
    label: 'Upload progress',
  },
};

export const Success: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
    label: 'Completed',
  },
};

export const Warning: Story = {
  args: {
    value: 45,
    variant: 'warning',
    showLabel: true,
    label: 'Storage usage',
  },
};

export const Danger: Story = {
  args: {
    value: 90,
    variant: 'danger',
    showLabel: true,
    label: 'Disk space',
  },
};

export const SmallSize: Story = {
  args: {
    value: 50,
    size: 'sm',
    showLabel: true,
  },
};

export const MediumSize: Story = {
  args: {
    value: 50,
    size: 'md',
    showLabel: true,
  },
};

export const LargeSize: Story = {
  args: {
    value: 50,
    size: 'lg',
    showLabel: true,
  },
};

export const Striped: Story = {
  args: {
    value: 65,
    striped: true,
    showLabel: true,
    label: 'Processing',
  },
};

export const Animated: Story = {
  args: {
    value: 40,
    animated: true,
    striped: true,
    showLabel: true,
    label: 'Loading',
  },
};

export const Zero: Story = {
  args: {
    value: 0,
    showLabel: true,
    label: 'Not started',
  },
};

export const Complete: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
    label: 'Complete',
  },
};

export const MultipleProgress: Story = {
  render: () => (
    <div className="space-y-6 w-full">
      <Progress value={25} variant="default" showLabel label="Project A" />
      <Progress value={50} variant="warning" showLabel label="Project B" />
      <Progress value={75} variant="success" showLabel label="Project C" />
      <Progress value={90} variant="danger" showLabel label="Storage" />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <Progress value={60} variant="default" showLabel label="Default" />
      <Progress value={60} variant="success" showLabel label="Success" />
      <Progress value={60} variant="warning" showLabel label="Warning" />
      <Progress value={60} variant="danger" showLabel label="Danger" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4 w-full">
      <Progress value={60} size="sm" showLabel label="Small" />
      <Progress value={60} size="md" showLabel label="Medium" />
      <Progress value={60} size="lg" showLabel label="Large" />
    </div>
  ),
};

export const CustomLabel: Story = {
  args: {
    value: 7,
    max: 10,
    showLabel: true,
    label: (
      <div className="flex items-center gap-2">
        <span>7 of 10 tasks completed</span>
      </div>
    ),
  },
};

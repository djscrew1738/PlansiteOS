import type { Meta, StoryObj } from '@storybook/react';
import Badge from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['blue', 'green', 'yellow', 'red', 'purple', 'slate'],
      description: 'Badge color variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Badge size',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Blue: Story = {
  args: {
    variant: 'blue',
    children: 'In Progress',
  },
};

export const Green: Story = {
  args: {
    variant: 'green',
    children: 'Completed',
  },
};

export const Yellow: Story = {
  args: {
    variant: 'yellow',
    children: 'Pending',
  },
};

export const Red: Story = {
  args: {
    variant: 'red',
    children: 'Urgent',
  },
};

export const Purple: Story = {
  args: {
    variant: 'purple',
    children: 'Review',
  },
};

export const Slate: Story = {
  args: {
    variant: 'slate',
    children: 'Draft',
  },
};

export const SmallSize: Story = {
  args: {
    variant: 'blue',
    size: 'sm',
    children: 'Small',
  },
};

export const MediumSize: Story = {
  args: {
    variant: 'blue',
    size: 'md',
    children: 'Medium',
  },
};

export const LargeSize: Story = {
  args: {
    variant: 'blue',
    size: 'lg',
    children: 'Large',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="blue">Blue</Badge>
      <Badge variant="green">Green</Badge>
      <Badge variant="yellow">Yellow</Badge>
      <Badge variant="red">Red</Badge>
      <Badge variant="purple">Purple</Badge>
      <Badge variant="slate">Slate</Badge>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
};

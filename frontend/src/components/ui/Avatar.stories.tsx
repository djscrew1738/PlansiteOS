import type { Meta, StoryObj } from '@storybook/react';
import Avatar from './Avatar';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Avatar size',
    },
    src: {
      control: 'text',
      description: 'Image URL',
    },
    alt: {
      control: 'text',
      description: 'Alt text',
    },
    fallback: {
      control: 'text',
      description: 'Fallback text when no image',
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithImage: Story = {
  args: {
    src: 'https://i.pravatar.cc/150?img=1',
    alt: 'User avatar',
  },
};

export const WithFallback: Story = {
  args: {
    fallback: 'JD',
  },
};

export const DefaultFallback: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
    fallback: 'SM',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    fallback: 'MD',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    fallback: 'LG',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="sm" fallback="SM" />
      <Avatar size="md" fallback="MD" />
      <Avatar size="lg" fallback="LG" />
    </div>
  ),
};

export const MultipleAvatars: Story = {
  render: () => (
    <div className="flex items-center -space-x-2">
      <Avatar src="https://i.pravatar.cc/150?img=1" />
      <Avatar src="https://i.pravatar.cc/150?img=2" />
      <Avatar src="https://i.pravatar.cc/150?img=3" />
      <Avatar fallback="+5" />
    </div>
  ),
};

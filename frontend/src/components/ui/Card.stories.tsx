import type { Meta, StoryObj } from '@storybook/react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from './Card';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    hover: {
      control: 'boolean',
      description: 'Enable hover effects',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">This is a basic card component with default styling.</p>
        </CardContent>
      </>
    ),
  },
};

export const WithDescription: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Dashboard Overview</CardTitle>
          <CardDescription>View your project metrics and recent activity</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">Card content goes here with additional information.</p>
        </CardContent>
      </>
    ),
  },
};

export const WithHover: Story = {
  args: {
    hover: true,
    children: (
      <>
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-300">Hover over this card to see the effect.</p>
        </CardContent>
      </>
    ),
  },
};

export const Minimal: Story = {
  args: {
    children: <p className="text-slate-300">A minimal card with just content.</p>,
  },
};

export const WithStats: Story = {
  args: {
    children: (
      <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-100 mt-1">$45,231</p>
          </div>
          <div className="bg-green-500/10 p-3 rounded-lg">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </>
    ),
  },
};

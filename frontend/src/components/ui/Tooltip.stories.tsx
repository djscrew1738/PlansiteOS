import type { Meta, StoryObj } from '@storybook/react';
import Tooltip from './Tooltip';
import Button from './Button';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a tooltip',
    children: <Button>Hover me</Button>,
  },
};

export const Top: Story = {
  args: {
    content: 'Tooltip on top',
    placement: 'top',
    children: <Button>Top</Button>,
  },
};

export const Bottom: Story = {
  args: {
    content: 'Tooltip on bottom',
    placement: 'bottom',
    children: <Button>Bottom</Button>,
  },
};

export const Left: Story = {
  args: {
    content: 'Tooltip on left',
    placement: 'left',
    children: <Button>Left</Button>,
  },
};

export const Right: Story = {
  args: {
    content: 'Tooltip on right',
    placement: 'right',
    children: <Button>Right</Button>,
  },
};

export const LongContent: Story = {
  args: {
    content: 'This is a much longer tooltip with more detailed information about the action',
    children: <Button>Hover for details</Button>,
  },
};

export const WithIcon: Story = {
  args: {
    content: (
      <div className="flex items-center gap-2">
        <span>ℹ️</span>
        <span>Additional information</span>
      </div>
    ),
    children: <Button>Info</Button>,
  },
};

export const QuickDelay: Story = {
  args: {
    content: 'Shows immediately',
    delay: 0,
    children: <Button>Instant</Button>,
  },
};

export const SlowDelay: Story = {
  args: {
    content: 'Takes a moment to appear',
    delay: 1000,
    children: <Button>Delayed</Button>,
  },
};

export const Disabled: Story = {
  args: {
    content: "Won't show",
    disabled: true,
    children: <Button>Disabled tooltip</Button>,
  },
};

export const OnText: Story = {
  render: () => (
    <div className="text-slate-300">
      This is some text with a{' '}
      <Tooltip content="Helpful explanation">
        <span className="underline decoration-dotted cursor-help">tooltip word</span>
      </Tooltip>{' '}
      in the middle.
    </div>
  ),
};

export const AllPlacements: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-16 p-16">
      <div></div>
      <Tooltip content="Top tooltip" placement="top">
        <Button>Top</Button>
      </Tooltip>
      <div></div>

      <Tooltip content="Left tooltip" placement="left">
        <Button>Left</Button>
      </Tooltip>
      <div></div>
      <Tooltip content="Right tooltip" placement="right">
        <Button>Right</Button>
      </Tooltip>

      <div></div>
      <Tooltip content="Bottom tooltip" placement="bottom">
        <Button>Bottom</Button>
      </Tooltip>
      <div></div>
    </div>
  ),
};

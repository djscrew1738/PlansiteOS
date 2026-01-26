import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Slider from './Slider';

const meta = {
  title: 'UI/Slider',
  component: Slider,
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
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return <Slider value={value} onChange={setValue} />;
  },
};

export const WithLabel: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return <Slider value={value} onChange={setValue} label="Volume" />;
  },
};

export const WithoutValue: Story = {
  render: () => {
    const [value, setValue] = useState(75);
    return <Slider value={value} onChange={setValue} label="Brightness" showValue={false} />;
  },
};

export const CustomRange: Story = {
  render: () => {
    const [value, setValue] = useState(25);
    return <Slider value={value} onChange={setValue} min={0} max={50} label="Temperature (°C)" />;
  },
};

export const WithStep: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return <Slider value={value} onChange={setValue} min={0} max={100} step={10} label="Step by 10" />;
  },
};

export const WithMarks: Story = {
  render: () => {
    const [value, setValue] = useState(50);
    return (
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={100}
        label="Quality"
        marks={[
          { value: 0, label: 'Low' },
          { value: 50, label: 'Medium' },
          { value: 100, label: 'High' },
        ]}
      />
    );
  },
};

export const PriceRange: Story = {
  render: () => {
    const [value, setValue] = useState(500);
    return (
      <Slider
        value={value}
        onChange={setValue}
        min={0}
        max={1000}
        step={50}
        label="Price ($)"
        marks={[
          { value: 0, label: '$0' },
          { value: 250, label: '$250' },
          { value: 500, label: '$500' },
          { value: 750, label: '$750' },
          { value: 1000, label: '$1000' },
        ]}
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    value: 60,
    disabled: true,
    label: 'Disabled slider',
  },
};

export const MinValue: Story = {
  render: () => {
    const [value, setValue] = useState(0);
    return <Slider value={value} onChange={setValue} label="At minimum" />;
  },
};

export const MaxValue: Story = {
  render: () => {
    const [value, setValue] = useState(100);
    return <Slider value={value} onChange={setValue} label="At maximum" />;
  },
};

export const MultipleSliders: Story = {
  render: () => {
    const [volume, setVolume] = useState(75);
    const [brightness, setBrightness] = useState(50);
    const [contrast, setContrast] = useState(60);

    return (
      <div className="space-y-6">
        <Slider value={volume} onChange={setVolume} label="Volume" />
        <Slider value={brightness} onChange={setBrightness} label="Brightness" />
        <Slider value={contrast} onChange={setContrast} label="Contrast" />
      </div>
    );
  },
};

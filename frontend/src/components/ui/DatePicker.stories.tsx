import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import DatePicker from './DatePicker';

const meta = {
  title: 'UI/DatePicker',
  component: DatePicker,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '320px', minHeight: '500px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        label="Select a date"
        placeholder="Choose date..."
      />
    );
  },
};

export const WithPreselectedDate: Story = {
  render: () => {
    const [date, setDate] = useState<Date>(new Date());
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        label="Appointment date"
      />
    );
  },
};

export const WithMinDate: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();
    const minDate = new Date();
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        label="Future date only"
        placeholder="Select a date..."
        minDate={minDate}
      />
    );
  },
};

export const WithMaxDate: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();
    const maxDate = new Date();
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        label="Past date only"
        placeholder="Select a date..."
        maxDate={maxDate}
      />
    );
  },
};

export const WithDateRange: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();
    const today = new Date();
    const minDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        label="Date in current month"
        placeholder="Select a date..."
        minDate={minDate}
        maxDate={maxDate}
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        label="Birth date"
        placeholder="Select date..."
        error="This field is required"
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    value: new Date(),
    disabled: true,
    label: 'Disabled date picker',
  },
};

export const NoLabel: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        placeholder="Pick a date"
      />
    );
  },
};

export const CustomPlaceholder: Story = {
  render: () => {
    const [date, setDate] = useState<Date>();
    return (
      <DatePicker
        value={date}
        onChange={setDate}
        label="Event date"
        placeholder="When is your event?"
      />
    );
  },
};

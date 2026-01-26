import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Combobox, { type ComboboxOption } from './Combobox';

const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px', minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleOptions: ComboboxOption[] = [
  { value: '1', label: 'Option 1', description: 'First option description' },
  { value: '2', label: 'Option 2', description: 'Second option description' },
  { value: '3', label: 'Option 3', description: 'Third option description' },
  { value: '4', label: 'Option 4', description: 'Fourth option description' },
  { value: '5', label: 'Option 5', description: 'Fifth option description' },
];

const cityOptions: ComboboxOption[] = [
  { value: 'nyc', label: 'New York', description: 'New York, USA' },
  { value: 'lon', label: 'London', description: 'London, UK' },
  { value: 'tok', label: 'Tokyo', description: 'Tokyo, Japan' },
  { value: 'par', label: 'Paris', description: 'Paris, France' },
  { value: 'ber', label: 'Berlin', description: 'Berlin, Germany' },
  { value: 'syd', label: 'Sydney', description: 'Sydney, Australia' },
];

const statusOptions: ComboboxOption[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={sampleOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        label="Select an option"
        placeholder="Choose one..."
      />
    );
  },
};

export const WithSearch: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={cityOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        label="City"
        placeholder="Search cities..."
        searchable={true}
      />
    );
  },
};

export const Multiple: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>([]);
    return (
      <Combobox
        options={cityOptions}
        value={value}
        onChange={(v) => setValue(v as string[])}
        label="Select cities"
        placeholder="Choose multiple..."
        multiple={true}
      />
    );
  },
};

export const MultipleWithPreselected: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['nyc', 'tok']);
    return (
      <Combobox
        options={cityOptions}
        value={value}
        onChange={(v) => setValue(v as string[])}
        label="Favorite cities"
        placeholder="Add more..."
        multiple={true}
      />
    );
  },
};

export const WithError: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={statusOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        label="Status"
        placeholder="Select status..."
        error="Please select a status"
      />
    );
  },
};

export const Disabled: Story = {
  args: {
    options: sampleOptions,
    value: '1',
    disabled: true,
    label: 'Disabled combobox',
  },
};

export const Loading: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={cityOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        label="Loading data"
        placeholder="Please wait..."
        loading={true}
      />
    );
  },
};

export const NotClearable: Story = {
  render: () => {
    const [value, setValue] = useState('nyc');
    return (
      <Combobox
        options={cityOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        label="Destination"
        clearable={false}
      />
    );
  },
};

export const NotSearchable: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={statusOptions}
        value={value}
        onChange={(v) => setValue(v as string)}
        label="Status"
        placeholder="Select..."
        searchable={false}
      />
    );
  },
};

export const WithDisabledOptions: Story = {
  render: () => {
    const [value, setValue] = useState('');
    const options: ComboboxOption[] = [
      { value: '1', label: 'Available Option 1' },
      { value: '2', label: 'Disabled Option 2', disabled: true },
      { value: '3', label: 'Available Option 3' },
      { value: '4', label: 'Disabled Option 4', disabled: true },
    ];
    return (
      <Combobox
        options={options}
        value={value}
        onChange={(v) => setValue(v as string)}
        label="Options"
        placeholder="Select..."
      />
    );
  },
};

export const EmptyState: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <Combobox
        options={[]}
        value={value}
        onChange={(v) => setValue(v as string)}
        label="No options"
        placeholder="Try searching..."
        emptyMessage="No results found"
      />
    );
  },
};

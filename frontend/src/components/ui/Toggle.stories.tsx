import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import Toggle from './Toggle';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Toggle checked={checked} onChange={setChecked} />;
  },
};

export const WithLabel: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Toggle checked={checked} onChange={setChecked} label="Enable notifications" />;
  },
};

export const WithDescription: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Toggle
        checked={checked}
        onChange={setChecked}
        label="Email notifications"
        description="Receive email updates about your account activity"
      />
    );
  },
};

export const Checked: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);
    return <Toggle checked={checked} onChange={setChecked} label="Enabled feature" />;
  },
};

export const Disabled: Story = {
  args: {
    checked: false,
    disabled: true,
    label: 'Disabled toggle',
  },
};

export const DisabledChecked: Story = {
  args: {
    checked: true,
    disabled: true,
    label: 'Disabled (checked)',
  },
};

export const SmallSize: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Toggle checked={checked} onChange={setChecked} size="sm" label="Small toggle" />;
  },
};

export const MediumSize: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Toggle checked={checked} onChange={setChecked} size="md" label="Medium toggle" />;
  },
};

export const LargeSize: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return <Toggle checked={checked} onChange={setChecked} size="lg" label="Large toggle" />;
  },
};

export const AllSizes: Story = {
  render: () => {
    const [sm, setSm] = useState(false);
    const [md, setMd] = useState(false);
    const [lg, setLg] = useState(false);

    return (
      <div className="space-y-4">
        <Toggle checked={sm} onChange={setSm} size="sm" label="Small" />
        <Toggle checked={md} onChange={setMd} size="md" label="Medium" />
        <Toggle checked={lg} onChange={setLg} size="lg" label="Large" />
      </div>
    );
  },
};

export const MultipleToggles: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      notifications: true,
      darkMode: false,
      autoSave: true,
      analytics: false,
    });

    return (
      <div className="space-y-4 w-96">
        <Toggle
          checked={settings.notifications}
          onChange={(checked) => setSettings({ ...settings, notifications: checked })}
          label="Push notifications"
          description="Receive push notifications on your device"
        />
        <Toggle
          checked={settings.darkMode}
          onChange={(checked) => setSettings({ ...settings, darkMode: checked })}
          label="Dark mode"
          description="Use dark theme across the application"
        />
        <Toggle
          checked={settings.autoSave}
          onChange={(checked) => setSettings({ ...settings, autoSave: checked })}
          label="Auto-save"
          description="Automatically save your work every 5 minutes"
        />
        <Toggle
          checked={settings.analytics}
          onChange={(checked) => setSettings({ ...settings, analytics: checked })}
          label="Analytics"
          description="Help us improve by sharing anonymous usage data"
        />
      </div>
    );
  },
};

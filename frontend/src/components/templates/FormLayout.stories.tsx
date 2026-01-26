import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import FormLayout from './FormLayout';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Toggle from '../ui/Toggle';

const meta = {
  title: 'Templates/FormLayout',
  component: FormLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FormLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleColumn: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = () => {
      setLoading(true);
      setTimeout(() => setLoading(false), 2000);
    };

    return (
      <div className="p-8">
        <FormLayout
          title="Create Project"
          description="Add a new project to your workspace"
          onSubmit={handleSubmit}
          isLoading={loading}
          onCancel={() => alert('Cancelled')}
        >
          <Input label="Project Name" placeholder="Enter project name" required />
          <Input label="Client" placeholder="Client name" />
          <Textarea label="Description" placeholder="Project description" rows={4} />
          <Select label="Status">
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </Select>
        </FormLayout>
      </div>
    );
  },
};

export const TwoColumn: Story = {
  render: () => (
    <div className="p-8">
      <FormLayout
        title="User Profile"
        description="Update your profile information"
        layout="two-column"
        onSubmit={() => alert('Saved!')}
      >
        <Input label="First Name" placeholder="John" />
        <Input label="Last Name" placeholder="Doe" />
        <Input label="Email" type="email" placeholder="john@example.com" />
        <Input label="Phone" type="tel" placeholder="(555) 123-4567" />
        <Input label="Company" placeholder="Acme Inc" />
        <Input label="Job Title" placeholder="Software Engineer" />
      </FormLayout>
    </div>
  ),
};

export const WithSections: Story = {
  render: () => {
    const [notifications, setNotifications] = useState(true);
    const [newsletter, setNewsletter] = useState(false);

    return (
      <div className="p-8">
        <FormLayout
          title="Settings"
          description="Manage your account settings and preferences"
          onSubmit={() => alert('Saved!')}
          sections={[
            {
              title: 'Profile Information',
              description: 'Update your personal details',
              fields: (
                <>
                  <Input label="Display Name" placeholder="John Doe" />
                  <Input label="Email" type="email" placeholder="john@example.com" />
                  <Textarea label="Bio" placeholder="Tell us about yourself" rows={3} />
                </>
              ),
            },
            {
              title: 'Preferences',
              description: 'Customize your experience',
              fields: (
                <>
                  <Select label="Language">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </Select>
                  <Select label="Timezone">
                    <option>UTC</option>
                    <option>EST</option>
                    <option>PST</option>
                  </Select>
                </>
              ),
            },
            {
              title: 'Notifications',
              description: 'Control how you receive updates',
              fields: (
                <>
                  <Toggle
                    checked={notifications}
                    onChange={setNotifications}
                    label="Email notifications"
                    description="Receive email updates about your account"
                  />
                  <Toggle
                    checked={newsletter}
                    onChange={setNewsletter}
                    label="Newsletter"
                    description="Get our weekly newsletter"
                  />
                </>
              ),
            },
          ]}
        />
      </div>
    );
  },
};

export const TwoColumnSections: Story = {
  render: () => (
    <div className="p-8">
      <FormLayout
        title="New Estimate"
        description="Create a detailed project estimate"
        layout="two-column"
        onSubmit={() => alert('Created!')}
        submitLabel="Create Estimate"
        sections={[
          {
            title: 'Basic Information',
            fields: (
              <>
                <Input label="Project Name" placeholder="Kitchen Remodel" />
                <Input label="Client" placeholder="John Smith" />
                <Input label="Address" placeholder="123 Main St" />
                <Input label="City" placeholder="Dallas" />
              </>
            ),
          },
          {
            title: 'Estimate Details',
            fields: (
              <>
                <Input label="Total Amount" type="number" placeholder="0.00" />
                <Input label="Discount %" type="number" placeholder="0" />
                <Select label="Status">
                  <option>Draft</option>
                  <option>Sent</option>
                  <option>Approved</option>
                </Select>
                <Input label="Valid Until" type="date" />
              </>
            ),
          },
        ]}
      />
    </div>
  ),
};

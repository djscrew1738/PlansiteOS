import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import WizardLayout from './WizardLayout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Toggle from '../ui/Toggle';

const meta = {
  title: 'Templates/WizardLayout',
  component: WizardLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WizardLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      company: '',
      plan: 'basic',
      newsletter: false,
    });

    const steps = [
      {
        title: 'Account',
        description: 'Create your account',
        content: (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
            />
          </div>
        ),
        isValid: formData.name && formData.email,
      },
      {
        title: 'Company',
        description: 'Tell us about your company',
        content: (
          <div className="space-y-4">
            <Input
              label="Company Name"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Acme Inc"
            />
            <Textarea
              label="Description"
              placeholder="What does your company do?"
              rows={4}
            />
          </div>
        ),
        isValid: formData.company,
      },
      {
        title: 'Plan',
        description: 'Choose your subscription',
        content: (
          <div className="space-y-4">
            <Select
              label="Select Plan"
              value={formData.plan}
              onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
            >
              <option value="basic">Basic - $9/month</option>
              <option value="pro">Pro - $29/month</option>
              <option value="enterprise">Enterprise - $99/month</option>
            </Select>
            <Toggle
              checked={formData.newsletter}
              onChange={(checked) => setFormData({ ...formData, newsletter: checked })}
              label="Subscribe to newsletter"
              description="Get updates and tips delivered to your inbox"
            />
          </div>
        ),
        isValid: true,
      },
      {
        title: 'Review',
        description: 'Review and confirm',
        content: (
          <div className="space-y-4">
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-800">
              <h3 className="font-semibold text-slate-100 mb-3">Summary</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Name:</dt>
                  <dd className="text-slate-100">{formData.name || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Email:</dt>
                  <dd className="text-slate-100">{formData.email || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Company:</dt>
                  <dd className="text-slate-100">{formData.company || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Plan:</dt>
                  <dd className="text-slate-100 capitalize">{formData.plan}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Newsletter:</dt>
                  <dd className="text-slate-100">{formData.newsletter ? 'Yes' : 'No'}</dd>
                </div>
              </dl>
            </div>
          </div>
        ),
        isValid: true,
      },
    ];

    return (
      <div className="p-8">
        <WizardLayout
          steps={steps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          onComplete={() => alert('Completed! Form data: ' + JSON.stringify(formData))}
          onCancel={() => alert('Cancelled')}
        />
      </div>
    );
  },
};

export const WithCompletedSteps: Story = {
  render: () => {
    const [currentStep, setCurrentStep] = useState(2);
    const [completedSteps, setCompletedSteps] = useState([0, 1]);

    const steps = [
      { title: 'Setup', content: <div>Setup content</div> },
      { title: 'Configure', content: <div>Configure content</div> },
      { title: 'Deploy', content: <div>Deploy content</div> },
      { title: 'Complete', content: <div>All done!</div> },
    ];

    return (
      <div className="p-8">
        <WizardLayout
          steps={steps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          completedSteps={completedSteps}
          onComplete={() => setCompletedSteps([...completedSteps, currentStep])}
        />
      </div>
    );
  },
};

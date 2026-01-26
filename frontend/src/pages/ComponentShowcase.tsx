import { useState } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import FileUpload, { type FileWithPreview } from '../components/ui/FileUpload';
import Combobox, { type ComboboxOption } from '../components/ui/Combobox';
import DatePicker from '../components/ui/DatePicker';
import DragDropList, { type DragDropItem } from '../components/ui/DragDropList';
import Toggle from '../components/ui/Toggle';
import Slider from '../components/ui/Slider';
import Tooltip from '../components/ui/Tooltip';
import Popover from '../components/ui/Popover';
import Progress from '../components/ui/Progress';
import Badge from '../components/ui/Badge';
import FormLayout from '../components/templates/FormLayout';
import WizardLayout from '../components/templates/WizardLayout';
import { PlusIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const cityOptions: ComboboxOption[] = [
  { value: 'nyc', label: 'New York', description: 'New York, USA' },
  { value: 'lon', label: 'London', description: 'London, UK' },
  { value: 'tok', label: 'Tokyo', description: 'Tokyo, Japan' },
];

export default function ComponentShowcase() {
  // State for interactive components
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [tasks, setTasks] = useState<DragDropItem[]>([
    { id: '1', content: 'Design mockups' },
    { id: '2', content: 'Develop frontend' },
    { id: '3', content: 'Write tests' },
  ]);
  const [notifications, setNotifications] = useState(true);
  const [volume, setVolume] = useState(75);
  const [uploadProgress, setUploadProgress] = useState(65);

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-4xl font-bold text-slate-100 mb-2">Component Showcase</h1>
        <p className="text-slate-400">
          Explore all the interactive components available in PlansiteOS
        </p>
      </div>

      {/* Interactive Components Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FileUpload */}
        <Card>
          <CardHeader>
            <CardTitle>File Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              accept="image/*,.pdf"
              multiple={true}
              maxSize={10 * 1024 * 1024}
              onFilesChange={setFiles}
              showPreview={true}
            />
          </CardContent>
        </Card>

        {/* Combobox */}
        <Card>
          <CardHeader>
            <CardTitle>Combobox (Searchable Select)</CardTitle>
          </CardHeader>
          <CardContent>
            <Combobox
              options={cityOptions}
              value={selectedCity}
              onChange={(v) => setSelectedCity(v as string)}
              label="Select City"
              placeholder="Search cities..."
              searchable={true}
            />
          </CardContent>
        </Card>

        {/* DatePicker */}
        <Card>
          <CardHeader>
            <CardTitle>Date Picker</CardTitle>
          </CardHeader>
          <CardContent>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              label="Select Date"
              placeholder="Choose a date..."
            />
          </CardContent>
        </Card>

        {/* Toggle */}
        <Card>
          <CardHeader>
            <CardTitle>Toggle Switch</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toggle
              checked={notifications}
              onChange={setNotifications}
              label="Email Notifications"
              description="Receive updates via email"
            />
            <Toggle
              checked={false}
              label="Dark Mode"
              description="Switch to dark theme"
            />
          </CardContent>
        </Card>

        {/* Slider */}
        <Card>
          <CardHeader>
            <CardTitle>Slider</CardTitle>
          </CardHeader>
          <CardContent>
            <Slider
              value={volume}
              onChange={setVolume}
              min={0}
              max={100}
              label="Volume"
              marks={[
                { value: 0, label: 'Mute' },
                { value: 50, label: 'Mid' },
                { value: 100, label: 'Max' },
              ]}
            />
          </CardContent>
        </Card>

        {/* Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Bars</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress
              value={uploadProgress}
              label="Upload Progress"
              showLabel
              variant="default"
            />
            <Progress
              value={100}
              label="Completed"
              showLabel
              variant="success"
            />
            <Progress
              value={45}
              label="Processing"
              showLabel
              variant="warning"
              striped
              animated
            />
          </CardContent>
        </Card>

        {/* Tooltip & Popover */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltip & Popover</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-3">Tooltips on hover:</p>
              <div className="flex gap-2">
                <Tooltip content="This is helpful information">
                  <Button variant="secondary">
                    <InformationCircleIcon className="w-4 h-4 mr-2" />
                    Hover for Tooltip
                  </Button>
                </Tooltip>
              </div>
            </div>

            <div>
              <p className="text-sm text-slate-400 mb-3">Popover on click:</p>
              <Popover
                content={
                  <div className="p-4 w-64">
                    <h4 className="font-semibold text-slate-100 mb-2">Quick Actions</h4>
                    <div className="space-y-2">
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 rounded">
                        Edit
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800 rounded">
                        Share
                      </button>
                      <button className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-800 rounded">
                        Delete
                      </button>
                    </div>
                  </div>
                }
              >
                <Button>Click for Popover</Button>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card>
          <CardHeader>
            <CardTitle>Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="blue">In Progress</Badge>
              <Badge variant="green">Completed</Badge>
              <Badge variant="yellow">Pending</Badge>
              <Badge variant="red">Urgent</Badge>
              <Badge variant="purple">Review</Badge>
              <Badge variant="slate">Draft</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drag & Drop List */}
      <Card>
        <CardHeader>
          <CardTitle>Drag & Drop List (Reorderable)</CardTitle>
        </CardHeader>
        <CardContent>
          <DragDropList
            items={tasks}
            onReorder={setTasks}
            showHandle={true}
          />
        </CardContent>
      </Card>

      {/* Form Layout Example */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Form Layout Template</h2>
        <FormLayout
          title="Sample Form"
          description="Example of using the FormLayout template"
          onSubmit={(e) => {
            e.preventDefault();
            alert('Form submitted!');
          }}
          onCancel={() => alert('Cancelled')}
        >
          <Input label="Full Name" placeholder="John Doe" />
          <Input label="Email" type="email" placeholder="john@example.com" />
          <Combobox
            options={cityOptions}
            label="City"
            placeholder="Select your city"
          />
        </FormLayout>
      </div>
    </div>
  );
}

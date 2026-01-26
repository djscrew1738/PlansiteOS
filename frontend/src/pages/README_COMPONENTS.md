# Component Integration Guide

This document explains how to use the new interactive components in your pages.

## Available Components

### 1. FileUpload
Advanced file upload with drag & drop, preview, and progress tracking.

```tsx
import FileUpload from '../components/ui/FileUpload';

const [files, setFiles] = useState<FileWithPreview[]>([]);

<FileUpload
  accept=".pdf,.png,.jpg"
  multiple={true}
  maxSize={10 * 1024 * 1024}
  onFilesChange={setFiles}
  onUpload={async (files) => {
    // Upload logic here
  }}
  showPreview={true}
/>
```

### 2. Combobox
Searchable dropdown with keyboard navigation.

```tsx
import Combobox from '../components/ui/Combobox';

const options = [
  { value: '1', label: 'Option 1', description: 'First option' },
  { value: '2', label: 'Option 2', description: 'Second option' },
];

<Combobox
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  searchable={true}
  multiple={false}
/>
```

### 3. DatePicker
Calendar-based date selection.

```tsx
import DatePicker from '../components/ui/DatePicker';

<DatePicker
  value={selectedDate}
  onChange={setSelectedDate}
  minDate={new Date()}
  label="Select Date"
/>
```

### 4. DragDropList
Reorderable list with drag & drop.

```tsx
import DragDropList from '../components/ui/DragDropList';

const items = [
  { id: '1', content: 'Task 1' },
  { id: '2', content: 'Task 2' },
];

<DragDropList
  items={items}
  onReorder={setItems}
  showHandle={true}
/>
```

### 5. Toggle
Modern switch component.

```tsx
import Toggle from '../components/ui/Toggle';

<Toggle
  checked={enabled}
  onChange={setEnabled}
  label="Enable Feature"
  description="Turn this feature on or off"
/>
```

### 6. Slider
Range input with visual feedback.

```tsx
import Slider from '../components/ui/Slider';

<Slider
  value={volume}
  onChange={setVolume}
  min={0}
  max={100}
  label="Volume"
  marks={[
    { value: 0, label: 'Min' },
    { value: 100, label: 'Max' }
  ]}
/>
```

### 7. Tooltip
Contextual information on hover.

```tsx
import Tooltip from '../components/ui/Tooltip';

<Tooltip content="Helpful information" placement="top">
  <Button>Hover Me</Button>
</Tooltip>
```

### 8. Popover
Rich content popups on click or hover.

```tsx
import Popover from '../components/ui/Popover';

<Popover
  content={<div>Rich content here</div>}
  trigger="click"
  placement="bottom"
>
  <Button>Click Me</Button>
</Popover>
```

### 9. Progress
Visual progress indicators.

```tsx
import Progress from '../components/ui/Progress';

<Progress
  value={75}
  max={100}
  variant="success"
  showLabel={true}
  animated={true}
/>
```

## Page Templates

### FormLayout
Pre-built form structure with sections and actions.

```tsx
import FormLayout from '../components/templates/FormLayout';

<FormLayout
  title="Create Project"
  description="Add a new project"
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  sections={[
    {
      title: 'Basic Info',
      fields: <Input label="Name" />
    }
  ]}
/>
```

### WizardLayout
Multi-step form wizard.

```tsx
import WizardLayout from '../components/templates/WizardLayout';

<WizardLayout
  steps={[
    {
      title: 'Step 1',
      content: <div>Step content</div>,
      isValid: true
    }
  ]}
  currentStep={currentStep}
  onStepChange={setCurrentStep}
  onComplete={handleComplete}
/>
```

### ListLayout
Standard list page structure.

```tsx
import ListLayout from '../components/templates/ListLayout';

<ListLayout
  title="Items"
  actions={[{ label: 'Add', onClick: handleAdd }]}
  filters={[{ component: <Input /> }]}
>
  {/* List content */}
</ListLayout>
```

### DetailLayout
Detail/view page structure.

```tsx
import DetailLayout from '../components/templates/DetailLayout';

<DetailLayout
  title="Item Details"
  badge={{ label: 'Active', variant: 'green' }}
  actions={[{ label: 'Edit', onClick: handleEdit }]}
  sections={[
    {
      title: 'Information',
      content: <div>Content</div>
    }
  ]}
/>
```

## Enhanced Pages

See the following files for complete integration examples:
- `BlueprintsEnhanced.tsx` - FileUpload, Combobox, DatePicker, Tooltip
- `EstimatesEnhanced.tsx` - Combobox, DatePicker, Slider, Toggle, Tooltip
- `ComponentShowcase.tsx` - All components in action

## Best Practices

1. **Use Tooltips** for additional context on buttons and icons
2. **Use Combobox** instead of Select for better UX with many options
3. **Use DatePicker** for all date inputs
4. **Use FileUpload** for modern file upload experience
5. **Use Progress** to show loading states
6. **Use Templates** to maintain consistent page layouts

import type { Meta, StoryObj } from '@storybook/react';
import FileUpload from './FileUpload';

const meta = {
  title: 'UI/FileUpload',
  component: FileUpload,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onFilesChange: (files) => console.log('Files changed:', files),
  },
};

export const SingleFile: Story = {
  args: {
    multiple: false,
    onFilesChange: (files) => console.log('Files changed:', files),
  },
};

export const ImagesOnly: Story = {
  args: {
    accept: 'image/*',
    showPreview: true,
    onFilesChange: (files) => console.log('Images:', files),
  },
};

export const PDFOnly: Story = {
  args: {
    accept: '.pdf',
    maxFiles: 5,
    onFilesChange: (files) => console.log('PDFs:', files),
  },
};

export const SmallMaxSize: Story = {
  args: {
    maxSize: 1024 * 1024, // 1MB
    onFilesChange: (files) => console.log('Files:', files),
  },
};

export const WithUpload: Story = {
  args: {
    onFilesChange: (files) => console.log('Files changed:', files),
    onUpload: async (files) => {
      console.log('Uploading:', files);
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Upload complete');
    },
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    onFilesChange: (files) => console.log('Files changed:', files),
  },
};

export const NoPreview: Story = {
  args: {
    showPreview: false,
    accept: 'image/*',
    onFilesChange: (files) => console.log('Files changed:', files),
  },
};

export const LimitedFiles: Story = {
  args: {
    maxFiles: 3,
    onFilesChange: (files) => console.log('Files changed:', files),
  },
};

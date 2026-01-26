import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge Component', () => {
  it('should render children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('should apply blue variant by default', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-blue-500/10', 'text-blue-400', 'border-blue-500/20');
  });

  it('should apply green variant correctly', () => {
    const { container } = render(<Badge variant="green">Success</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-500/10', 'text-green-400', 'border-green-500/20');
  });

  it('should apply red variant correctly', () => {
    const { container } = render(<Badge variant="red">Error</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-red-500/10', 'text-red-400', 'border-red-500/20');
  });

  it('should apply yellow variant correctly', () => {
    const { container } = render(<Badge variant="yellow">Warning</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-yellow-500/10', 'text-yellow-400', 'border-yellow-500/20');
  });

  it('should apply purple variant correctly', () => {
    const { container } = render(<Badge variant="purple">Info</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-purple-500/10', 'text-purple-400', 'border-purple-500/20');
  });

  it('should apply slate variant correctly', () => {
    const { container } = render(<Badge variant="slate">Neutral</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-slate-500/10', 'text-slate-400', 'border-slate-500/20');
  });

  it('should apply medium size by default', () => {
    const { container } = render(<Badge>Medium</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
  });

  it('should apply small size correctly', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  it('should apply large size correctly', () => {
    const { container } = render(<Badge size="lg">Large</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
  });

  it('should apply custom className', () => {
    const { container } = render(<Badge className="custom-class">Custom</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('custom-class');
  });

  it('should render as a span element', () => {
    const { container } = render(<Badge>Span</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
  });
});

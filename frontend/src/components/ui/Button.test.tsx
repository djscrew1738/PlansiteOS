import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  it('should render children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply primary variant by default', () => {
    const { container } = render(<Button>Primary</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
  });

  it('should apply secondary variant correctly', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-slate-800', 'text-slate-100', 'hover:bg-slate-700');
  });

  it('should apply ghost variant correctly', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('text-slate-300', 'hover:bg-slate-800');
  });

  it('should apply danger variant correctly', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
  });

  it('should apply medium size by default', () => {
    const { container } = render(<Button>Medium</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-4', 'py-2', 'text-base');
  });

  it('should apply small size correctly', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
  });

  it('should apply large size correctly', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg');
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    const button = screen.getByText('Click');
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);

    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should forward ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref).toHaveBeenCalled();
  });

  it('should pass through additional props', () => {
    render(<Button type="submit" data-testid="submit-btn">Submit</Button>);
    const button = screen.getByTestId('submit-btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
});

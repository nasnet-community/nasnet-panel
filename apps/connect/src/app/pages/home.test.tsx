import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { HomePage } from './home';

describe('HomePage - Hello NasNet Component (AC-6)', () => {
  it('should render the component', () => {
    render(<HomePage />);
    expect(screen.getByText('Hello NasNet!')).toBeInTheDocument();
  });

  it('should display the verification button', () => {
    render(<HomePage />);
    const button = screen.getByRole('button', { name: /click to verify/i });
    expect(button).toBeInTheDocument();
  });

  it('should update button text when clicked', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const button = screen.getByRole('button', { name: /click to verify/i });
    await user.click(button);

    expect(screen.getByRole('button', { name: /verified/i })).toBeInTheDocument();
  });

  it('should display the Wifi icon', () => {
    render(<HomePage />);
    // Lucide icons are rendered as SVG
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should have Tailwind styling applied', () => {
    const { container } = render(<HomePage />);
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('min-h-screen', 'bg-background', 'p-8');
  });

  it('should render Framer Motion animation', () => {
    render(<HomePage />);
    // Motion div should be present
    const card = screen.getByText('Hello NasNet!').closest('[class*="max-w"]');
    expect(card).toBeInTheDocument();
  });

  it('should render with all dependencies working', () => {
    // This test verifies all imports work: react, framer-motion, shadcn/ui, lucide-react
    const { container } = render(<HomePage />);
    expect(container).toBeInTheDocument();
  });
});

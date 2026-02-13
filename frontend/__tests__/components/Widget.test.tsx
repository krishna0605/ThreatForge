/**
 * Component Tests — Dashboard Widget
 */
import React from 'react';
import { render, screen } from '@testing-library/react';



import Widget from '@/components/dashboard/Widget';

describe('Widget', () => {
  it('renders widget id label', () => {
    render(
      <Widget id="scan-overview">
        <p>Content here</p>
      </Widget>
    );

    expect(screen.getByText(/WIDGET_ID:/)).toBeInTheDocument();
    expect(screen.getByText(/scan-overview/)).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Widget id="test-widget">
        <div data-testid="child">Child Content</div>
      </Widget>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child').textContent).toBe('Child Content');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Widget id="styled" className="custom-class">
        <p>Styled</p>
      </Widget>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('custom-class');
    expect(wrapper.className).toContain('glass-panel');
  });
});

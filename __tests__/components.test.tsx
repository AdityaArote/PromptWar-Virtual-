/**
 * Component Unit Tests
 * 
 * Tests for React components with accessibility checks.
 * Run with: npx vitest run
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ZoneCard } from '@/components/dashboard/zone-card';
import { StatsBar } from '@/components/dashboard/stats-bar';
import { ZoneGrid } from '@/components/dashboard/zone-grid';
import { createMockZone, createMockStats, createMockZones } from '@/lib/test-utils';

describe('ZoneCard', () => {
  it('renders zone information correctly', () => {
    const zone = createMockZone({
      name: 'Main Food Court',
      location: 'Section 100',
      wait_time_minutes: 5,
      status: 'low',
      crowd_density: 30,
    });

    render(<ZoneCard zone={zone} />);

    expect(screen.getByText('Main Food Court')).toBeInTheDocument();
    expect(screen.getByText('Section 100')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Go Now')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('displays correct status badge for each status', () => {
    const statuses = [
      { status: 'low', label: 'Go Now' },
      { status: 'medium', label: 'Moderate' },
      { status: 'high', label: 'Busy' },
      { status: 'critical', label: 'Avoid' },
    ] as const;

    statuses.forEach(({ status, label }) => {
      const zone = createMockZone({ status });
      const { unmount } = render(<ZoneCard zone={zone} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });

  it('has correct ARIA attributes for accessibility', () => {
    const zone = createMockZone({
      name: 'Test Zone',
      wait_time_minutes: 10,
      status: 'medium',
    });

    render(<ZoneCard zone={zone} />);

    // Check for article role
    const card = screen.getByRole('article');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-label');

    // Check for progressbar
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
  });

  it('is keyboard focusable', () => {
    const zone = createMockZone();
    render(<ZoneCard zone={zone} />);

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});

describe('StatsBar', () => {
  it('renders all statistics', () => {
    const stats = createMockStats({
      totalZones: 14,
      lowWaitZones: 6,
      averageWait: 7,
      improvingZones: 4,
      criticalZones: 2,
    });

    render(<StatsBar stats={stats} />);

    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('7m')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders loading skeletons when loading', () => {
    const stats = createMockStats();
    render(<StatsBar stats={stats} isLoading={true} />);

    const loadingStatus = screen.getByRole('status');
    expect(loadingStatus).toHaveAttribute('aria-label', 'Loading statistics');
  });

  it('has accessible region label', () => {
    const stats = createMockStats();
    render(<StatsBar stats={stats} />);

    const region = screen.getByRole('region');
    expect(region).toHaveAttribute('aria-label', 'Venue statistics');
  });
});

describe('ZoneGrid', () => {
  it('renders all zones', () => {
    const zones = createMockZones(5);
    const onCategoryChange = vi.fn();

    render(
      <ZoneGrid
        zones={zones}
        selectedCategory="all"
        onCategoryChange={onCategoryChange}
      />
    );

    // Should render 5 zone cards
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(5);
  });

  it('filters zones by category', () => {
    const zones = [
      createMockZone({ category: 'food', name: 'Food Zone 1' }),
      createMockZone({ category: 'food', name: 'Food Zone 2' }),
      createMockZone({ category: 'drinks', name: 'Drinks Zone 1' }),
    ];
    const onCategoryChange = vi.fn();

    render(
      <ZoneGrid
        zones={zones}
        selectedCategory="food"
        onCategoryChange={onCategoryChange}
      />
    );

    // Should only render 2 food zones
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(2);
  });

  it('calls onCategoryChange when tab is clicked', () => {
    const zones = createMockZones(3);
    const onCategoryChange = vi.fn();

    render(
      <ZoneGrid
        zones={zones}
        selectedCategory="all"
        onCategoryChange={onCategoryChange}
      />
    );

    // Click on Food tab
    const foodTab = screen.getByRole('tab', { name: /food/i });
    fireEvent.click(foodTab);

    expect(onCategoryChange).toHaveBeenCalledWith('food');
  });

  it('has accessible tab navigation', () => {
    const zones = createMockZones(3);
    const onCategoryChange = vi.fn();

    render(
      <ZoneGrid
        zones={zones}
        selectedCategory="all"
        onCategoryChange={onCategoryChange}
      />
    );

    const tablist = screen.getByRole('tablist');
    expect(tablist).toHaveAttribute('aria-label', 'Filter zones by category');

    const tabs = screen.getAllByRole('tab');
    tabs.forEach(tab => {
      expect(tab).toHaveAttribute('aria-selected');
    });
  });

  it('displays empty state when no zones match filter', () => {
    const zones = [createMockZone({ category: 'food' })];
    const onCategoryChange = vi.fn();

    render(
      <ZoneGrid
        zones={zones}
        selectedCategory="drinks"
        onCategoryChange={onCategoryChange}
      />
    );

    expect(screen.getByText('No zones found for this category')).toBeInTheDocument();
  });

  it('sorts zones by wait time (lowest first)', () => {
    const zones = [
      createMockZone({ name: 'Zone A', wait_time_minutes: 15 }),
      createMockZone({ name: 'Zone B', wait_time_minutes: 5 }),
      createMockZone({ name: 'Zone C', wait_time_minutes: 10 }),
    ];
    const onCategoryChange = vi.fn();

    render(
      <ZoneGrid
        zones={zones}
        selectedCategory="all"
        onCategoryChange={onCategoryChange}
      />
    );

    const articles = screen.getAllByRole('article');
    
    // First should be Zone B (5 min)
    expect(articles[0]).toHaveTextContent('Zone B');
    // Second should be Zone C (10 min)
    expect(articles[1]).toHaveTextContent('Zone C');
    // Third should be Zone A (15 min)
    expect(articles[2]).toHaveTextContent('Zone A');
  });
});

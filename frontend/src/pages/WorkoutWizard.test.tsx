import { screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import type { Workout } from '@workout-planner/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import exercisesService from '@/services/exercises.service';
import sessionsService from '@/services/sessions.service';
import workoutsService from '@/services/workouts.service';
import { daysAgo, exercises, muscleGroups, sessionStats } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import WorkoutWizard from './WorkoutWizard';

vi.mock('@/services/exercises.service', () => ({
  default: { getAllExercises: vi.fn(), getMuscleGroups: vi.fn() },
}));
vi.mock('@/services/workouts.service', () => ({
  default: { createWorkout: vi.fn() },
}));
vi.mock('@/services/sessions.service', () => ({
  default: { getStats: vi.fn(), getSessions: vi.fn() },
}));

function plannedItems() {
  const list = screen.getByRole('list', { name: 'Planned exercises' });
  return within(list)
    .getAllByRole('listitem')
    .map((item) => item.textContent ?? '');
}

async function goToReview(user: UserEvent, primaryFocus: string) {
  await user.click(await screen.findByRole('button', { name: new RegExp(`^${primaryFocus}`) }));
  await screen.findByRole('heading', { name: 'Secondary focus' });
  for (const next of ['Finisher', 'Equipment', 'Review & save']) {
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await screen.findByRole('heading', { name: next });
  }
}

describe('WorkoutWizard', () => {
  beforeEach(() => {
    vi.mocked(exercisesService.getAllExercises).mockResolvedValue(exercises);
    vi.mocked(exercisesService.getMuscleGroups).mockResolvedValue(muscleGroups);
    vi.mocked(sessionsService.getSessions).mockResolvedValue([]);
    vi.mocked(sessionsService.getStats).mockResolvedValue(
      sessionStats({
        totalSessions: 2,
        lastTrainedByMuscleGroup: {
          Back: daysAgo(1),
          Chest: daysAgo(2),
          Shoulders: daysAgo(3),
          Arms: daysAgo(4),
          Legs: daysAgo(6),
        },
      }),
    );
  });

  it('recommends the primary focus trained longest ago', async () => {
    renderWithProviders(<WorkoutWizard />);

    const legs = await screen.findByRole('button', { name: /^Legs/ });
    expect(await within(legs).findByText('Recommended')).toBeInTheDocument();
    expect(within(legs).getByText('Trained 6 days ago')).toBeInTheDocument();

    const back = screen.getByRole('button', { name: /^Back/ });
    expect(within(back).queryByText('Recommended')).not.toBeInTheDocument();
    expect(within(back).getByText('Trained yesterday')).toBeInTheDocument();
  });

  it('rebuilds the plan after going back and changing the focus', async () => {
    const { user } = renderWithProviders(<WorkoutWizard />);

    await goToReview(user, 'Back');
    expect(plannedItems()).toHaveLength(3);
    expect(plannedItems().every((text) => text.includes('Back'))).toBe(true);

    for (const heading of ['Equipment', 'Finisher', 'Secondary focus', 'Primary focus']) {
      await user.click(screen.getByRole('button', { name: 'Previous' }));
      await screen.findByRole('heading', { name: heading });
    }

    await goToReview(user, 'Legs');
    const items = plannedItems();
    expect(items).toHaveLength(3);
    expect(items.every((text) => text.includes('Legs'))).toBe(true);
    expect(items.some((text) => text.includes('Back'))).toBe(false);
  });

  it('saves the plan and returns to the dashboard', async () => {
    vi.mocked(workoutsService.createWorkout).mockImplementation(
      async (input): Promise<Workout> => ({
        _id: 'workout-1',
        name: input.name,
        belongsTo: 'user-1',
        exercises: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const { user } = renderWithProviders(<WorkoutWizard />, {
      route: '/create-workout',
      path: '/create-workout',
      extraRoutes: { '/dashboard': <p>Dashboard page</p> },
    });

    await goToReview(user, 'Back');
    await user.type(screen.getByLabelText('Workout name'), 'Pull Day');
    await user.click(screen.getByRole('button', { name: 'Save workout' }));

    await screen.findByText('Dashboard page');
    const [input] = vi.mocked(workoutsService.createWorkout).mock.calls[0];
    expect(input.name).toBe('Pull Day');
    expect(input.exercises).toHaveLength(3);
  });
});

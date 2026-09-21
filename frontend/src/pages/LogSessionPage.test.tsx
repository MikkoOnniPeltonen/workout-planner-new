import { cleanup, screen } from '@testing-library/react';
import type { LastPerformance, Workout, WorkoutSession } from '@workout-planner/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import exercisesService from '@/services/exercises.service';
import sessionsService from '@/services/sessions.service';
import workoutsService from '@/services/workouts.service';
import { exercises, objectId } from '@/test/fixtures';
import { renderWithProviders } from '@/test/render';
import LogSessionPage from './LogSessionPage';

vi.mock('@/services/exercises.service', () => ({
  default: { getAllExercises: vi.fn(), getMuscleGroups: vi.fn() },
}));
vi.mock('@/services/workouts.service', () => ({
  default: { getWorkoutById: vi.fn() },
}));
vi.mock('@/services/sessions.service', () => ({
  default: { getLastPerformance: vi.fn(), createSession: vi.fn(), getSession: vi.fn() },
}));

function fixture(name: string) {
  const found = exercises.find((exercise) => exercise.name === name);
  if (!found) throw new Error(`Missing exercise fixture: ${name}`);
  return found;
}

const squat = fixture('squat');
const plank = fixture('plank');

const workout: Workout = {
  _id: objectId(),
  name: 'Leg Day',
  belongsTo: objectId(),
  exercises: [squat, plank],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

const lastSquat: LastPerformance = {
  exercise: squat._id,
  performedAt: '2026-09-10T17:00:00.000Z',
  sets: [
    { reps: 8, weightKg: 60, completed: true },
    { reps: 8, weightKg: 60, completed: true },
    { reps: 6, weightKg: 60, completed: true },
  ],
};

function renderLogger() {
  return renderWithProviders(<LogSessionPage />, {
    route: `/workouts/${workout._id}/log`,
    path: '/workouts/:workoutId/log',
    extraRoutes: { '/history': <p>History page</p> },
  });
}

describe('LogSessionPage', () => {
  beforeEach(() => {
    vi.mocked(exercisesService.getAllExercises).mockResolvedValue(exercises);
    vi.mocked(workoutsService.getWorkoutById).mockResolvedValue(workout);
    vi.mocked(sessionsService.getLastPerformance).mockResolvedValue([lastSquat]);
  });

  it("shows last time's sets and fills a ticked-off set from them", async () => {
    const { user } = renderLogger();

    expect(
      await screen.findByText('Last time: 8 × 60 kg, 8 × 60 kg, 6 × 60 kg'),
    ).toBeInTheDocument();
    expect(screen.getByText('No previous sets logged')).toBeInTheDocument();
    expect(screen.getByLabelText('Reps for set 3 of Squat')).toHaveAttribute('placeholder', '6');

    await user.click(screen.getByRole('button', { name: 'Complete set 1 of Squat' }));

    expect(screen.getByLabelText('Reps for set 1 of Squat')).toHaveValue('8');
    expect(screen.getByLabelText('Weight in kg for set 1 of Squat')).toHaveValue('60');
    expect(screen.getByRole('button', { name: 'Complete set 1 of Squat' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('aims 2.5 kg higher after a session where every set reached its reps, and starts a rest timer', async () => {
    vi.mocked(sessionsService.getLastPerformance).mockResolvedValue([
      {
        ...lastSquat,
        sets: [
          { reps: 8, weightKg: 60, completed: true },
          { reps: 8, weightKg: 60, completed: true },
        ],
      },
    ]);
    const { user } = renderLogger();

    expect(await screen.findByText('Aim for +2.5 kg')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight in kg for set 1 of Squat')).toHaveAttribute(
      'placeholder',
      '62.5',
    );

    await user.click(screen.getByRole('button', { name: 'Complete set 1 of Squat' }));

    expect(screen.getByLabelText('Weight in kg for set 1 of Squat')).toHaveValue('62.5');
    expect(screen.getByText('1:30')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Skip' }));
    expect(screen.queryByText('1:30')).not.toBeInTheDocument();
  });

  it('restores an unsaved session after a reload', async () => {
    const { user } = renderLogger();
    await user.type(await screen.findByLabelText('Reps for set 2 of Squat'), '10');

    cleanup();
    renderLogger();

    expect(await screen.findByText('Restored your unsaved session.')).toBeInTheDocument();
    expect(screen.getByLabelText('Reps for set 2 of Squat')).toHaveValue('10');
  });

  it('saves ticked-off sets against the workout', async () => {
    vi.mocked(sessionsService.createSession).mockImplementation(
      async (input): Promise<WorkoutSession> => ({
        _id: objectId(),
        belongsTo: workout.belongsTo,
        workout: workout._id,
        workoutName: workout.name,
        performedAt: input.performedAt,
        entries: [],
        createdAt: input.performedAt,
        updatedAt: input.performedAt,
      }),
    );
    const { user } = renderLogger();

    await user.click(await screen.findByRole('button', { name: 'Complete set 1 of Squat' }));
    await user.type(screen.getByLabelText('Seconds for set 1 of Plank'), '45');
    await user.click(screen.getByRole('button', { name: 'Complete set 1 of Plank' }));
    await user.click(screen.getByRole('button', { name: 'Save session' }));

    await screen.findByText('History page');
    const [input] = vi.mocked(sessionsService.createSession).mock.calls[0];
    expect(input).toMatchObject({
      workout: workout._id,
      entries: [
        { exercise: squat._id, sets: [{ reps: 8, weightKg: 60, completed: true }] },
        { exercise: plank._id, sets: [{ durationSec: 45, completed: true }] },
      ],
    });
  });
});

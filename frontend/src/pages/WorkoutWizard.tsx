import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import exercisesService from '@/services/exercises.service';
import workoutsService from '@/services/workouts.service';
import { cn } from '@/lib/utils';

// Schema for the final step (workout name)
const workoutSchema = z.object({
    name: z.string().min(3, 'Workout name must be at least 3 characters'),
});

const steps = [
    { id: 1, title: 'Primary Focus', limit: 3, options: ['Legs', 'Back'], type: 'radio' },
    { id: 2, title: 'Secondary Focus', limit: 2, options: ['Chest', 'Upper back', 'Shoulders', 'Arms'], type: 'checkbox' },
    { id: 3, title: 'Finisher', limit: 1, options: ['Core'], type: 'button' },
    { id: 4, title: 'Review & Save', limit: 0, options: [], type: 'form' },
];

export default function WorkoutWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [selections, setSelections] = useState<string[]>([]);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Form for final step
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ name: string }>({
        resolver: zodResolver(workoutSchema),
    });

    const [generatedExercises, setGeneratedExercises] = useState<any[]>([]);

    // Fetch exercises based on selections (only fetch when at step 4 or moving to it)
    const { data: exercisesData, isLoading: isLoadingExercises } = useQuery({
        queryKey: ['exercises', selections],
        queryFn: () => exercisesService.getAllExercises(selections),
        enabled: currentStep === 4 && selections.length > 0,
    });

    // Randomize Exercise Logic
    const generatePlan = useCallback(() => {
        if (!exercisesData?.data) return;

        const allExercises = exercisesData.data;
        let plan: any[] = [];
        const usedIds = new Set<string>();

        // Helper to pick random unique exercises
        const pickRandom = (candidates: any[], count: number) => {
            const available = candidates.filter(ex => !usedIds.has(ex._id));
            const shuffled = [...available].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        };

        // Get selections for each step
        const step1Selections = selections.filter(s => steps[0].options.includes(s)); // Primary
        const step2Selections = selections.filter(s => steps[1].options.includes(s)); // Secondary
        const step3Selections = selections.filter(s => steps[2].options.includes(s)); // Finisher

        // 1. Primary Focus (Limit 3 total)
        if (step1Selections.length > 0) {
            // Filter all exercises that belong to ANY of the primary groups
            const primaryCandidates = allExercises.filter((ex: any) =>
                ex.belongsTo.some((bg: any) => step1Selections.includes(bg.name))
            );
            const picked = pickRandom(primaryCandidates, 3);
            picked.forEach(ex => usedIds.add(ex._id));
            plan = [...plan, ...picked];
        }

        // 2. Secondary Focus (Limit 2 total)
        if (step2Selections.length > 0) {
            const secondaryCandidates = allExercises.filter((ex: any) =>
                ex.belongsTo.some((bg: any) => step2Selections.includes(bg.name))
            );
            const picked = pickRandom(secondaryCandidates, 2);
            picked.forEach(ex => usedIds.add(ex._id));
            plan = [...plan, ...picked];
        }

        // 3. Finisher (Limit 1 total)
        if (step3Selections.length > 0) {
            const finisherCandidates = allExercises.filter((ex: any) =>
                ex.belongsTo.some((bg: any) => step3Selections.includes(bg.name))
            );
            const picked = pickRandom(finisherCandidates, 1);
            picked.forEach(ex => usedIds.add(ex._id));
            plan = [...plan, ...picked];
        }

        setGeneratedExercises(plan);
    }, [exercisesData, selections]);

    // specific useEffect to trigger generation when data loads
    useEffect(() => {
        if (exercisesData?.data && generatedExercises.length === 0) {
            generatePlan();
        }
    }, [exercisesData, generatePlan, generatedExercises.length]);

    // Create Workout Mutation uses generatedExercises
    const createWorkoutMutation = useMutation({
        mutationFn: (data: { name: string; exercises: any[] }) => {
            const exerciseIds = generatedExercises.map((ex: any) => ex._id);
            return workoutsService.createWorkout({ name: data.name, exercises: exerciseIds });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workouts'] });
            navigate('/dashboard');
        },
        onError: (error: any) => {
            console.error('Failed to create workout', error);
            const msg = error.response?.data?.message || 'Failed to create workout';
            alert(`Error: ${msg}`);
        }
    });

    const handleSelection = (option: string) => {
        const stepConfig = steps.find(s => s.id === currentStep);

        if (stepConfig?.type === 'radio') {
            const exists = selections.includes(option);
            let newSelections = [...selections];

            if (exists) {
                newSelections = newSelections.filter(s => s !== option);
            } else {
                const otherOptions = stepConfig.options.filter(o => o !== option);
                newSelections = newSelections.filter(s => !otherOptions.includes(s));
                newSelections.push(option);
            }
            setSelections(newSelections);

            if (!exists && stepConfig.id < 3) {
                setTimeout(() => setCurrentStep(prev => prev + 1), 300);
            }
        } else {
            if (selections.includes(option)) {
                setSelections(selections.filter(s => s !== option));
            } else {
                setSelections([...selections, option]);
            }
        }
    };

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1);
    };

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1);
    };

    const onSubmit = (data: { name: string }) => {
        createWorkoutMutation.mutate({ name: data.name, exercises: [] });
    };

    const currentStepData = steps.find(s => s.id === currentStep);

    return (
        <div className="container max-w-2xl mx-auto py-10 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2 text-primary">Create Workout</h1>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Step {currentStep} of {steps.length}</span>
                    <span>{currentStepData?.title}</span>
                </div>
                <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${(currentStep / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                >
                    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>{currentStepData?.title}</CardTitle>
                            <CardDescription>
                                {currentStep === 1 && "Start with a major muscle group (3 Rounds)"}
                                {currentStep === 2 && "Add secondary groups (2 Rounds)"}
                                {currentStep === 3 && "Finish with core (1 Round)"}
                                {currentStep === 4 && "Review your exercise plan"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {currentStep < 4 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentStepData?.options.map((option) => (
                                        <Button
                                            key={option}
                                            variant={selections.includes(option) ? "default" : "outline"}
                                            className={cn(
                                                "h-16 text-lg justify-start px-6 transition-all",
                                                selections.includes(option) ? "border-primary ring-1 ring-primary" : "hover:border-primary/50"
                                            )}
                                            onClick={() => handleSelection(option)}
                                        >
                                            {option}
                                            {selections.includes(option) && (
                                                <motion.div layoutId="check" className="ml-auto text-primary-foreground">
                                                    ✓
                                                </motion.div>
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            ) : (
                                <form id="workout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Workout Name</Label>
                                        <Input id="name" {...register('name')} placeholder="e.g., Monday Morning Grind" />
                                        {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Selected Muscle Groups</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {selections.map(s => (
                                                <div key={s} className="bg-secondary px-3 py-1 rounded-full text-sm">
                                                    {s}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 mt-4 custom-scrollbar">
                                        <div className="flex justify-between items-center mb-2">
                                            <Label>Generated Plan ({generatedExercises.length} Exercises)</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={generatePlan} title="Regenerate Plan">
                                                🔄 Shuffle
                                            </Button>
                                        </div>

                                        {isLoadingExercises ? (
                                            <p className="text-muted-foreground p-2">Loading exercises...</p>
                                        ) : (
                                            <ul className="space-y-2">
                                                {generatedExercises.map((ex: any) => (
                                                    <li key={ex._id} className="text-sm p-3 rounded bg-muted/50 border border-transparent hover:border-border flex justify-between items-center">
                                                        <span>{ex.name}</span>
                                                        <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full border border-border">
                                                            {ex.belongsTo.map((g: any) => g.name).join(', ')}
                                                        </span>
                                                    </li>
                                                ))}
                                                {generatedExercises.length === 0 && (
                                                    <li className="text-muted-foreground text-sm">No exercises found.</li>
                                                )}
                                            </ul>
                                        )}
                                    </div>
                                </form>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Button variant="ghost" onClick={prevStep} disabled={currentStep === 1}>
                                Back
                            </Button>
                            {currentStep < 4 ? (
                                <Button onClick={nextStep} disabled={selections.length === 0}>
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    form="workout-form"
                                    disabled={isSubmitting || isLoadingExercises || createWorkoutMutation.isPending}
                                >
                                    {createWorkoutMutation.isPending ? 'Saving...' : 'Save Workout'}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

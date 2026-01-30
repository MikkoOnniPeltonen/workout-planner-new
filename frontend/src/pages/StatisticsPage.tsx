import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import workoutsService from '@/services/workouts.service';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function StatisticsPage() {
    const { data: workoutsData, isLoading } = useQuery({
        queryKey: ['workouts'],
        queryFn: workoutsService.getAllWorkouts,
    });

    const workouts = workoutsData?.data || [];
    console.log('Statistics Page Workouts Data:', workouts);
    const totalWorkouts = workouts.length;

    // Process data for Weekly Activity (Mocked for now as we don't have timestamps on when workout was PERFORMED, only created/updated)
    // Assuming 'updatedAt' is a proxy for "last done".
    const activityData = [
        { name: 'Mon', workouts: 0 },
        { name: 'Tue', workouts: 0 },
        { name: 'Wed', workouts: 0 },
        { name: 'Thu', workouts: 0 },
        { name: 'Fri', workouts: 0 },
        { name: 'Sat', workouts: 0 },
        { name: 'Sun', workouts: 0 },
    ];

    // Process data for Muscle Group Distribution
    const muscleGroupCounts: Record<string, number> = {};

    workouts.forEach((workout: any) => {
        workout.exercises.forEach((exercise: any) => {
            // Robust check for belongsTo
            if (Array.isArray(exercise.belongsTo)) {
                exercise.belongsTo.forEach((mg: any) => {
                    // Check if mg is an object with name, or just a string ID? 
                    // Based on previous logs and population it should be an object.
                    // But if population failed it might be an ID.
                    const name = (typeof mg === 'object' && mg.name) ? mg.name : 'Unknown';
                    muscleGroupCounts[name] = (muscleGroupCounts[name] || 0) + 1;
                });
            } else if (exercise.belongsTo && typeof exercise.belongsTo === 'object') {
                // Fallback for single object population
                const name = exercise.belongsTo.name || 'Unknown';
                muscleGroupCounts[name] = (muscleGroupCounts[name] || 0) + 1;
            } else {
                // Determine if it's missing or unpopulated
                // console.warn('Exercise missing belongsTo population', exercise);
            }
        });
    });
    console.log('Processed Muscle Group Counts:', muscleGroupCounts);

    const pieData = Object.keys(muscleGroupCounts).map(name => ({
        name,
        value: muscleGroupCounts[name]
    })).sort((a, b) => b.value - a.value);

    if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading statistics...</div>;

    return (
        <div className="container mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold tracking-tight mb-8 text-primary">Your Statistics</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-1 lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Total Workouts</CardTitle>
                        <CardDescription>All time stats</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">{totalWorkouts}</div>
                        <p className="text-sm text-muted-foreground mt-2">Keep it up!</p>
                    </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Muscle Group Distribution</CardTitle>
                        <CardDescription>Breakdown of muscle groups targeted in your workouts</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                    >
                                        {pieData.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                No data available. Create a workout first!
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1 lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Weekly Activity</CardTitle>
                        <CardDescription>Workouts (Mock Data - Real tracking needs 'WorkoutLog' feature)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={activityData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Bar dataKey="workouts" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

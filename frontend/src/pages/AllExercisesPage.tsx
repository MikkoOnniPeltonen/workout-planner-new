import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import exercisesService from '../services/exercises.service';

interface Exercise {
  _id: string;
  name: string;
  description: string;
  usedWith: string[];
  belongsTo?: {
    name: string;
  };
}

function AllExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await exercisesService.getAllExercises();
        setExercises(response.data);
      } catch (error) {
        console.error('Error fetching exercises', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const handleCardFlip = (id: string) => {
    setFlippedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <h1 className="text-4xl font-bold text-center text-white mb-10 tracking-tight">Exercises</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <AnimatePresence>
          {exercises.map((exercise) => (
            <div
              key={exercise._id}
              className="relative h-80 w-full cursor-pointer perspective-1000"
              onClick={() => handleCardFlip(exercise._id)}
            >
              <motion.div
                className="w-full h-full relative preserve-3d"
                initial={false}
                animate={{ rotateY: flippedCards[exercise._id] ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring' }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front Side */}
                <div className="absolute inset-0 backface-hidden">
                  <Card className="h-full bg-white/5 border-none backdrop-blur-sm shadow-xl hover:shadow-2xl transition-shadow duration-300 text-white overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6">
                      <CardTitle className="text-2xl font-semibold capitalize tracking-wide">
                        {exercise.name}
                      </CardTitle>
                      {exercise.belongsTo && (
                        <span className="text-xs font-mono text-blue-300 bg-blue-900/30 px-2 py-1 rounded inline-block mt-2">
                          {exercise.belongsTo.name}
                        </span>
                      )}
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-gray-300 line-clamp-4 leading-relaxed">
                        {exercise.description}
                      </p>
                      <div className="absolute bottom-4 right-4 text-xs text-gray-500">
                        Click for details
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Back Side */}
                <div
                  className="absolute inset-0 backface-hidden h-full"
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  <Card className="h-full bg-black border border-gray-800 shadow-2xl text-white">
                    <CardHeader className="p-6 border-b border-gray-800">
                      <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-400">
                        Equipment & Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 flex flex-col justify-center h-4/5">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">
                            Used With
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {exercise.usedWith && exercise.usedWith.length > 0 ? (
                              exercise.usedWith.map((item, idx) => (
                                <span
                                  key={`${item}-${idx}`}
                                  className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-200"
                                >
                                  {item}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 italic text-sm">
                                No special equipment
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          ))}
        </AnimatePresence>
      </div>

      {exercises.length === 0 && (
        <div className="text-center text-gray-500 mt-20 text-lg">No exercises found.</div>
      )}
    </div>
  );
}

export default AllExercisesPage;

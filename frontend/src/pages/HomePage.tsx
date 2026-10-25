import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-field';
import { useAuth } from '@/context/auth.context';
import { getErrorMessage } from '@/lib/api';
import authService from '@/services/auth.service';

const stories = [
  {
    image: '/hero-training.webp',
    alt: 'athlete taking a quiet moment after strength training',
    title: 'How to go hard',
    subtitle: 'The Strength inside you',
  },
  {
    image: '/hero-recovery.webp',
    alt: 'athlete stretching in a softly lit training studio',
    title: 'How to keep a balance',
    subtitle: 'The other side of you',
    note: 'Remembering how to see beauty in fatigue',
  },
  {
    image: '/hero-progress.webp',
    alt: 'runner moving along a waterfront path at dawn',
    title: 'Your way of doing greatness',
    subtitle: 'Get to know yourself to the last drop of sweat',
  },
];

function HomePage() {
  const { isLoggedIn, logIn } = useAuth();
  const navigate = useNavigate();
  const [demoPending, setDemoPending] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const startDemo = async () => {
    setDemoPending(true);
    setDemoError(null);
    try {
      logIn(await authService.demo());
      navigate('/dashboard');
    } catch (error) {
      setDemoError(getErrorMessage(error));
    } finally {
      setDemoPending(false);
    }
  };
  const lastIndex = stories.length - 1;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
      {stories.map((story, index) => (
        <article
          key={story.title}
          className="group relative min-h-[70svh] overflow-hidden rounded-xl"
        >
          <img
            src={story.image}
            alt={story.alt}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-black/35" />
          <div className="relative flex min-h-[70svh] flex-col justify-end gap-3 p-6 sm:p-10">
            {index === 0 ? (
              <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white drop-shadow-md sm:text-5xl">
                {story.title}
              </h1>
            ) : (
              <h2 className="text-3xl font-bold text-white drop-shadow-md sm:text-4xl">
                {story.title}
              </h2>
            )}
            <p className="text-lg font-medium text-gray-200 sm:text-xl drop-shadow-sm">
              {story.subtitle}
            </p>
            {story.note && <p className="text-sm text-gray-300">{story.note}</p>}

            {index === lastIndex && (
              <div className="mt-4 max-w-2xl space-y-2 text-sm text-gray-200">
                <h3 className="font-semibold text-white">How it works</h3>
                <p>
                  Choose your equipment and focus, build a workout, and log your sets. Your training
                  history helps guide the next session, while statistics show your progress over
                  time.
                </p>
              </div>
            )}
            {index === lastIndex && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isLoggedIn ? (
                  <Button asChild size="lg" className="rounded-full px-8 text-base">
                    <Link to="/dashboard">Go to your workouts</Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="rounded-full px-8 text-base"
                      onClick={() => void startDemo()}
                      disabled={demoPending}
                    >
                      {demoPending ? 'Preparing your demo…' : 'Try the demo'}
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-full bg-black/40 px-8 text-base"
                    >
                      <Link to="/signup">Create an account</Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      className="rounded-full bg-black/40 px-8 text-base"
                    >
                      <Link to="/exercises">Browse exercises</Link>
                    </Button>
                  </>
                )}
              </div>
            )}
            {index === lastIndex && !isLoggedIn && (
              <p className="text-sm text-gray-200">
                No signup for the demo. Explore sample history in your own temporary account.
              </p>
            )}
            {demoError && index === lastIndex && <FormError message={demoError} />}
          </div>
        </article>
      ))}
    </div>
  );
}

export default HomePage;

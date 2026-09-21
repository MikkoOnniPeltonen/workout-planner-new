import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth.context';

const stories = [
  {
    image: '/person-running.webp',
    alt: 'person running',
    title: 'How to go hard',
    subtitle: 'The Strength inside you',
  },
  {
    image: '/person-relaxing.webp',
    alt: 'person relaxing',
    title: 'How to keep a balance',
    subtitle: 'The other side of you',
    note: 'Remembering how to see beauty in fatigue',
  },
  {
    image: '/future-self.webp',
    alt: 'future self',
    title: 'Your way of doing greatness',
    subtitle: 'Get to know yourself to the last drop of sweat',
  },
];

function HomePage() {
  const { isLoggedIn } = useAuth();
  const lastIndex = stories.length - 1;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-8">
      {stories.map((story, index) => (
        <article
          key={story.title}
          className="group relative h-[60vh] min-h-80 overflow-hidden rounded-xl"
        >
          <img
            src={story.image}
            alt={story.alt}
            loading={index === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent" />
          <div className="relative flex h-full flex-col justify-end gap-2 p-8">
            <h2 className="text-3xl font-bold text-white drop-shadow-md sm:text-4xl">
              {story.title}
            </h2>
            <p className="text-xl font-medium text-gray-200 drop-shadow-sm">{story.subtitle}</p>
            {story.note && <p className="text-sm text-gray-300">{story.note}</p>}

            {index === lastIndex && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isLoggedIn ? (
                  <Button asChild size="lg" className="rounded-full px-8 text-base">
                    <Link to="/dashboard">Go to your workouts</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg" className="rounded-full px-8 text-base">
                      <Link to="/signup">Start your journey</Link>
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
          </div>
        </article>
      ))}
    </div>
  );
}

export default HomePage;

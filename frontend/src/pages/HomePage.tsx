import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter } from '../components/ui/card';

function HomePage() {
  return (
    <div className="w-full min-h-screen bg-gray-950 p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <article className="max-w-4xl mx-auto space-y-8">
        <Link to="/dashboard" className="block group">
          <Card className="relative w-full h-[60vh] overflow-hidden border-none">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
            <img
              src="/person-running.png"
              alt="person running"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <CardContent className="relative h-full z-20 flex flex-col justify-end p-8">
              <div className="flex flex-col gap-2 mb-2">
                <h2 className="text-4xl font-bold text-white mb-1 drop-shadow-md">
                  How to go hard
                </h2>
                <h3 className="text-gray-200 text-xl font-medium drop-shadow-sm">
                  The Strength inside you
                </h3>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="relative w-full h-[60vh] overflow-hidden group border-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          <img
            src="/person-relaxing.webp"
            alt="person relaxing"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <CardContent className="relative h-full z-20 flex flex-col justify-end p-8">
            <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-md">
              How to keep a balance
            </h2>
            <h3 className="text-purple-300 font-semibold text-xl drop-shadow-sm mb-2">
              The other side of you
            </h3>
            <h6 className="text-gray-300 text-sm">Remembering how to see beauty in fatigue</h6>
          </CardContent>
        </Card>
      </article>

      <article className="max-w-4xl mx-auto space-y-6">
        <Card className="relative w-full h-[60vh] overflow-hidden group border-none">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          <img
            src="/future-self.webp"
            alt="future self"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <CardContent className="relative h-full z-20 flex flex-col justify-end p-8">
            <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-md">
              Your way of doing greatness
            </h2>
            <h3 className="text-gray-200 text-xl mb-6 font-medium drop-shadow-sm">
              Get to know yourself to the last drop of sweat
            </h3>
          </CardContent>
          <CardFooter className="relative z-30 flex justify-center pb-12">
            <Link to="/exercises">
              <Button
                size="lg"
                className="bg-white text-black hover:bg-gray-200 font-bold px-10 py-6 text-xl rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                Start your journey
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </article>
    </div>
  );
}

export default HomePage;

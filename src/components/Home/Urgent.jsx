import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/authContext';
import { fetchMoviesBasedOnCategory } from '../../Movies';
import { fetchSeriesBasedOnCategory } from '../../Series';
import MediaCard from './MediaCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Loader2, AlertTriangle, Film, Tv } from 'lucide-react';
import { Badge } from '../ui/badge';

const Urgent = () => {
  const { currentUser } = useAuth();
  const [urgentMovies, setUrgentMovies] = useState([]);
  const [urgentSeries, setUrgentSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('movies');

  useEffect(() => {
    const fetchUrgentContent = async () => {
      if (!currentUser?.uid) return;

      setLoading(true);
      setError(null);

      try {
        const [moviesData, seriesData] = await Promise.all([
          fetchMoviesBasedOnCategory(currentUser.uid, 'Urgent'),
          fetchSeriesBasedOnCategory(currentUser.uid, 'Urgent')
        ]);

        setUrgentMovies(moviesData);
        setUrgentSeries(seriesData);
      } catch (err) {
        console.error('Error fetching urgent content:', err);
        setError('Failed to load urgent content');
      } finally {
        setLoading(false);
      }
    };

    fetchUrgentContent();
  }, [currentUser?.uid]);

  const totalUrgentItems = urgentMovies.length + urgentSeries.length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading urgent content...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
            <p className="text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Urgent Content
        </h1>
        <p className="text-muted-foreground">
          Your high-priority movies and series that need attention
        </p>
        {totalUrgentItems > 0 && (
          <Badge variant="secondary" className="mt-2">
            {totalUrgentItems} item{totalUrgentItems !== 1 ? 's' : ''} marked as urgent
          </Badge>
        )}
      </div>

      {totalUrgentItems === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertTriangle className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No urgent content</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't marked any movies or series as urgent yet. 
              Add content to your lists and mark them as urgent to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col items-center mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="movies" className="flex items-center space-x-2">
                <Film className="h-4 w-4" />
                <span>Movies ({urgentMovies.length})</span>
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center space-x-2">
                <Tv className="h-4 w-4" />
                <span>Series ({urgentSeries.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="movies" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {urgentMovies.map((movie) => (
                <MediaCard key={movie.id} item={movie} type="movie" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="series" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {urgentSeries.map((series) => (
                <MediaCard key={series.id} item={series} type="series" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Urgent;

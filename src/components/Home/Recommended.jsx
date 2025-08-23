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

const Recommended = () => {
  const { currentUser } = useAuth();
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [recommendedSeries, setRecommendedSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('movies');

  useEffect(() => {
    const fetchRecommendedContent = async () => {
      if (!currentUser?.uid) return;

      setLoading(true);
      setError(null);

      try {
        const [moviesData, seriesData] = await Promise.all([
          fetchMoviesBasedOnCategory(currentUser.uid, 'Recommended'),
          fetchSeriesBasedOnCategory(currentUser.uid, 'Recommended')
        ]);

        setRecommendedMovies(moviesData);
        setRecommendedSeries(seriesData);
      } catch (err) {
        console.error('Error fetching recommended content:', err);
        setError('Failed to load recommended content');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedContent();
  }, [currentUser?.uid]);

  const totalRecommendedItems = recommendedMovies.length + recommendedSeries.length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading recommended content...</p>
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
          Recommended Content
        </h1>
        <p className="text-muted-foreground">
          Your personally recommended movies and series
        </p>
        {totalRecommendedItems > 0 && (
          <Badge variant="secondary" className="mt-2">
            <Film className="h-3 w-3 mr-1" />
            {totalRecommendedItems} recommended item{totalRecommendedItems !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {totalRecommendedItems === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Film className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recommended content</h3>
            <p className="text-muted-foreground text-center max-w-md">
              You haven't marked any movies or series as recommended yet. 
              Add content to your lists and mark them as recommended to see them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col items-center mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="movies" className="flex items-center space-x-2">
                <Film className="h-4 w-4" />
                <span>Movies ({recommendedMovies.length})</span>
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center space-x-2">
                <Tv className="h-4 w-4" />
                <span>Series ({recommendedSeries.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="movies" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recommendedMovies.map((movie) => (
                <MediaCard key={movie.id} item={movie} type="movie" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="series" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {recommendedSeries.map((series) => (
                <MediaCard key={series.id} item={series} type="series" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Recommended;

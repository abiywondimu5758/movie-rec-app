import { useState, useEffect, useCallback, useMemo } from 'react';
import MediaCard from './MediaCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  TrendingUp, 
  Film, 
  Tv, 
  Loader2, 
  AlertTriangle,
  Star,
  Flame,
  Zap
} from 'lucide-react';

const Trending = () => {
  const [trendingData, setTrendingData] = useState({ movies: [], series: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [timeWindow, setTimeWindow] = useState('day'); // 'day' or 'week'

  // Fetch trending content
  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch trending movies
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/trending/movie/${timeWindow}?language=en-US`,
        {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        }
      );
      const movieData = await movieResponse.json();

      // Fetch trending series
      const seriesResponse = await fetch(
        `https://api.themoviedb.org/3/trending/tv/${timeWindow}?language=en-US`,
        {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        }
      );
      const seriesData = await seriesResponse.json();

      setTrendingData({
        movies: movieData.results || [],
        series: seriesData.results || []
      });
    } catch (err) {
      console.error('Error fetching trending content:', err);
      setError('Failed to load trending content');
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);

  useEffect(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleRefresh = useCallback(() => {
    fetchTrending();
  }, [fetchTrending]);

  const handleTimeWindowChange = useCallback((newTimeWindow) => {
    setTimeWindow(newTimeWindow);
  }, []);

  // Combine trending content for "All" tab
  const allTrending = useMemo(() => {
    const movieItems = trendingData.movies.map(movie => ({ ...movie, type: 'movie' }));
    const seriesItems = trendingData.series.map(series => ({ ...series, type: 'series' }));
    return [...movieItems, ...seriesItems].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [trendingData]);

  const totalTrending = trendingData.movies.length + trendingData.series.length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading trending content...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Error Loading Trending Content
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl font-bold">Trending Now</h1>
          <Badge variant="secondary" className="text-sm">
            {totalTrending} trending
          </Badge>
        </div>
        <p className="text-muted-foreground">
          What's hot and trending in movies and TV series
        </p>
        
        {/* Time Window Toggle */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant={timeWindow === 'day' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeWindowChange('day')}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant={timeWindow === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeWindowChange('week')}
            className="flex items-center gap-2"
          >
            <Flame className="h-4 w-4" />
            This Week
          </Button>
        </div>
      </div>

      {totalTrending === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No trending content</h3>
            <p className="text-muted-foreground text-center mb-4">
              Check back later for the latest trending movies and series
            </p>
            <Button onClick={handleRefresh}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              All ({totalTrending})
            </TabsTrigger>
            <TabsTrigger value="movies" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Movies ({trendingData.movies.length})
            </TabsTrigger>
            <TabsTrigger value="series" className="flex items-center gap-2">
              <Tv className="h-4 w-4" />
              Series ({trendingData.series.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {allTrending.map((item) => (
                <MediaCard key={`${item.type}-${item.id}`} item={item} type={item.type} onUpdate={() => {}} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="movies" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {trendingData.movies.map((movie) => (
                <MediaCard key={movie.id} item={movie} type="movie" onUpdate={() => {}} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="series" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {trendingData.series.map((series) => (
                <MediaCard key={series.id} item={series} type="series" onUpdate={() => {}} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Trending;

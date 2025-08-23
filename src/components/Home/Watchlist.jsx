import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../../contexts/authContext";
import { fetchWatchlist } from "../../Movies";
import { fetchSeriesWatchlist } from "../../Series";
import MediaCard from "./MediaCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Clock, 
  Film, 
  Tv, 
  Loader2, 
  AlertTriangle,
  Star,
  Plus
} from "lucide-react";

const Watchlist = () => {
  const { currentUser } = useAuth();
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  const fetchUserData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [moviesData, seriesData] = await Promise.all([
        fetchWatchlist(currentUser.uid),
        fetchSeriesWatchlist(currentUser.uid)
      ]);
      
      setMovies(moviesData);
      setSeries(seriesData);
    } catch (err) {
      console.error("Error fetching watchlist:", err);
      setError("Failed to load your watchlist");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const allItems = useMemo(() => {
    const movieItems = movies.map(movie => ({ ...movie, type: 'movie' }));
    const seriesItems = series.map(series => ({ ...series, type: 'series' }));
    return [...movieItems, ...seriesItems].sort((a, b) => 
      new Date(b.timestamp?.toDate?.() || b.timestamp) - new Date(a.timestamp?.toDate?.() || a.timestamp)
    );
  }, [movies, series]);

  const handleRefresh = useCallback(() => {
    fetchUserData();
  }, [fetchUserData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your watchlist...</span>
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
              Error Loading Watchlist
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

  const totalItems = movies.length + series.length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">My Watchlist</h1>
          <Badge variant="secondary" className="text-sm">
            {totalItems} items
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Movies and series you want to watch later
        </p>
      </div>

      {totalItems === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your watchlist is empty</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start adding movies and series to your watchlist to see them here
            </p>
            <Button onClick={() => window.history.back()}>
              Browse Movies & Series
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              All ({totalItems})
            </TabsTrigger>
            <TabsTrigger value="movies" className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              Movies ({movies.length})
            </TabsTrigger>
            <TabsTrigger value="series" className="flex items-center gap-2">
              <Tv className="h-4 w-4" />
              Series ({series.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {allItems.map((item) => (
                <MediaCard key={`${item.type}-${item.id}`} item={item} type={item.type} onUpdate={handleRefresh} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="movies" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {movies.map((movie) => (
                <MediaCard key={movie.id} item={movie} type="movie" onUpdate={handleRefresh} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="series" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {series.map((series) => (
                <MediaCard key={series.id} item={series} type="series" onUpdate={handleRefresh} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Watchlist;


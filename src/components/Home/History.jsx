import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/authContext';
import MediaCard from './MediaCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  History as HistoryIcon,
  Film,
  Tv,
  Loader2,
  AlertTriangle,
  Calendar,
  Clock,
  Trash2,
  Eye
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';

const History = () => {
  const { currentUser } = useAuth();
  const [watchHistory, setWatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  // Fetch watch history
  const fetchWatchHistory = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const historyQuery = query(
        collection(db, 'watchHistory'),
        where('userId', '==', currentUser.uid),
        orderBy('watchedAt', 'desc')
      );
      const snapshot = await getDocs(historyQuery);
      const historyData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWatchHistory(historyData);
    } catch (error) {
      console.error('Error fetching watch history:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchWatchHistory();
  }, [fetchWatchHistory]);

  // Add to watch history
  const addToHistory = useCallback(async (item, type) => {
    if (!currentUser) return;
    
    try {
      const historyData = {
        userId: currentUser.uid,
        itemId: item.id,
        type: type, // 'movie' or 'series'
        title: item.title || item.name,
        posterPath: item.poster_path,
        watchedAt: new Date(),
        rating: item.vote_average
      };
      
      await addDoc(collection(db, 'watchHistory'), historyData);
      fetchWatchHistory();
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }, [currentUser, fetchWatchHistory]);

  // Remove from history
  const removeFromHistory = useCallback(async (historyId) => {
    try {
      await deleteDoc(doc(db, 'watchHistory', historyId));
      fetchWatchHistory();
    } catch (error) {
      console.error('Error removing from history:', error);
    }
  }, [fetchWatchHistory]);

  // Clear all history
  const clearHistory = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const historyQuery = query(
        collection(db, 'watchHistory'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(historyQuery);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      fetchWatchHistory();
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [currentUser, fetchWatchHistory]);

  // Filter history by time
  const filteredHistory = useMemo(() => {
    let filtered = [...watchHistory];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    switch (timeFilter) {
      case 'today':
        filtered = filtered.filter(item => {
          const watchedAt = item.watchedAt?.toDate?.() || new Date(item.watchedAt);
          return watchedAt >= today;
        });
        break;
      case 'week':
        filtered = filtered.filter(item => {
          const watchedAt = item.watchedAt?.toDate?.() || new Date(item.watchedAt);
          return watchedAt >= weekAgo;
        });
        break;
      case 'month':
        filtered = filtered.filter(item => {
          const watchedAt = item.watchedAt?.toDate?.() || new Date(item.watchedAt);
          return watchedAt >= monthAgo;
        });
        break;
      default:
        break;
    }
    
    return filtered;
  }, [watchHistory, timeFilter]);

  // Separate movies and series
  const movies = useMemo(() => 
    filteredHistory.filter(item => item.type === 'movie'),
    [filteredHistory]
  );
  
  const series = useMemo(() => 
    filteredHistory.filter(item => item.type === 'series'),
    [filteredHistory]
  );

  // Combine for "All" tab
  const allHistory = useMemo(() => {
    const movieItems = movies.map(item => ({ ...item, type: 'movie' }));
    const seriesItems = series.map(item => ({ ...item, type: 'series' }));
    return [...movieItems, ...seriesItems];
  }, [movies, series]);

  const totalHistory = filteredHistory.length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading watch history...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <HistoryIcon className="h-8 w-8 text-indigo-500" />
            <h1 className="text-3xl font-bold">Watch History</h1>
            <Badge variant="secondary" className="text-sm">
              {totalHistory} items
            </Badge>
          </div>
          {totalHistory > 0 && (
            <Button variant="outline" onClick={clearHistory}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear History
            </Button>
          )}
        </div>
        <p className="text-muted-foreground">
          Track your viewing history and discover patterns in your watching habits
        </p>
        
        {/* Time Filter */}
        <div className="flex items-center gap-2 mt-4">
          <Button
            variant={timeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('all')}
          >
            All Time
          </Button>
          <Button
            variant={timeFilter === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('month')}
          >
            This Month
          </Button>
          <Button
            variant={timeFilter === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('week')}
          >
            This Week
          </Button>
          <Button
            variant={timeFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeFilter('today')}
          >
            Today
          </Button>
        </div>
      </div>

      {totalHistory === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <HistoryIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No watch history</h3>
            <p className="text-muted-foreground text-center mb-4">
              Your watch history will appear here as you view movies and series
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
              <HistoryIcon className="h-4 w-4" />
              All ({totalHistory})
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
              {allHistory.map((item) => (
                <div key={item.id} className="relative">
                  <MediaCard 
                    item={{
                      id: item.itemId,
                      title: item.title,
                      name: item.title,
                      poster_path: item.posterPath,
                      vote_average: item.rating
                    }} 
                    type={item.type} 
                    onUpdate={() => {}} 
                  />
                  <div className="absolute top-2 left-2 z-10">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(item.watchedAt?.toDate?.() || item.watchedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 z-10 h-6 w-6 p-0"
                    onClick={() => removeFromHistory(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="movies" className="space-y-6">
            {movies.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Film className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No movie history</h3>
                  <p className="text-muted-foreground text-center">
                    You haven't watched any movies yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {movies.map((item) => (
                  <div key={item.id} className="relative">
                    <MediaCard 
                      item={{
                        id: item.itemId,
                        title: item.title,
                        poster_path: item.posterPath,
                        vote_average: item.rating
                      }} 
                      type="movie" 
                      onUpdate={() => {}} 
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(item.watchedAt?.toDate?.() || item.watchedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10 h-6 w-6 p-0"
                      onClick={() => removeFromHistory(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="series" className="space-y-6">
            {series.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Tv className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No series history</h3>
                  <p className="text-muted-foreground text-center">
                    You haven't watched any series yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {series.map((item) => (
                  <div key={item.id} className="relative">
                    <MediaCard 
                      item={{
                        id: item.itemId,
                        name: item.title,
                        poster_path: item.posterPath,
                        vote_average: item.rating
                      }} 
                      type="series" 
                      onUpdate={() => {}} 
                    />
                    <div className="absolute top-2 left-2 z-10">
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(item.watchedAt?.toDate?.() || item.watchedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 z-10 h-6 w-6 p-0"
                      onClick={() => removeFromHistory(item.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default History;

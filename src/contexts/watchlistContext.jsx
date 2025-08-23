import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './authContext';
import { 
  fetchWatchlist, 
  isInWatchlist, 
  addToWatchlist, 
  removeFromWatchlist 
} from '../Movies';
import { 
  fetchSeriesWatchlist, 
  isSeriesInWatchlist, 
  addSeriesToWatchlist, 
  removeSeriesFromWatchlist 
} from '../Series';

const WatchlistContext = createContext();

export const useWatchlist = () => {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlist must be used within a WatchlistProvider');
  }
  return context;
};

export const WatchlistProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [movieWatchlist, setMovieWatchlist] = useState(new Set());
  const [seriesWatchlist, setSeriesWatchlist] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load watchlist on mount and when user changes
  useEffect(() => {
    if (currentUser) {
      loadWatchlist();
    } else {
      setMovieWatchlist(new Set());
      setSeriesWatchlist(new Set());
    }
  }, [currentUser]);

  const loadWatchlist = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const [movies, series] = await Promise.all([
        fetchWatchlist(currentUser.uid),
        fetchSeriesWatchlist(currentUser.uid)
      ]);
      
      const movieIds = new Set(movies.map(movie => movie.id));
      const seriesIds = new Set(series.map(series => series.id));
      
      setMovieWatchlist(movieIds);
      setSeriesWatchlist(seriesIds);
    } catch (error) {
      console.error('Error loading watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const addMovieToWatchlist = useCallback(async (movie) => {
    if (!currentUser) return false;
    
    try {
      await addToWatchlist(movie, currentUser.uid);
      setMovieWatchlist(prev => new Set([...prev, movie.id]));
      return true;
    } catch (error) {
      console.error('Error adding movie to watchlist:', error);
      return false;
    }
  }, [currentUser]);

  const removeMovieFromWatchlist = useCallback(async (movieId) => {
    if (!currentUser) return false;
    
    try {
      await removeFromWatchlist(movieId, currentUser.uid);
      setMovieWatchlist(prev => {
        const newSet = new Set(prev);
        newSet.delete(movieId);
        return newSet;
      });
      return true;
    } catch (error) {
      console.error('Error removing movie from watchlist:', error);
      return false;
    }
  }, [currentUser]);

  const addSeriesToWatchlist = useCallback(async (series) => {
    if (!currentUser) return false;
    
    try {
      await addSeriesToWatchlist(series, currentUser.uid);
      setSeriesWatchlist(prev => new Set([...prev, series.id]));
      return true;
    } catch (error) {
      console.error('Error adding series to watchlist:', error);
      return false;
    }
  }, [currentUser]);

  const removeSeriesFromWatchlist = useCallback(async (seriesId) => {
    if (!currentUser) return false;
    
    try {
      await removeSeriesFromWatchlist(seriesId, currentUser.uid);
      setSeriesWatchlist(prev => {
        const newSet = new Set(prev);
        newSet.delete(seriesId);
        return newSet;
      });
      return true;
    } catch (error) {
      console.error('Error removing series from watchlist:', error);
      return false;
    }
  }, [currentUser]);

  const isMovieInWatchlist = useCallback((movieId) => {
    return movieWatchlist.has(movieId);
  }, [movieWatchlist]);

  const isSeriesInWatchlist = useCallback((seriesId) => {
    return seriesWatchlist.has(seriesId);
  }, [seriesWatchlist]);

  const toggleMovieWatchlist = useCallback(async (movie) => {
    if (isMovieInWatchlist(movie.id)) {
      return await removeMovieFromWatchlist(movie.id);
    } else {
      return await addMovieToWatchlist(movie);
    }
  }, [isMovieInWatchlist, removeMovieFromWatchlist, addMovieToWatchlist]);

  const toggleSeriesWatchlist = useCallback(async (series) => {
    if (isSeriesInWatchlist(series.id)) {
      return await removeSeriesFromWatchlist(series.id);
    } else {
      return await addSeriesToWatchlist(series);
    }
  }, [isSeriesInWatchlist, removeSeriesFromWatchlist, addSeriesToWatchlist]);

  const value = {
    movieWatchlist,
    seriesWatchlist,
    loading,
    isMovieInWatchlist,
    isSeriesInWatchlist,
    addMovieToWatchlist,
    removeMovieFromWatchlist,
    addSeriesToWatchlist,
    removeSeriesFromWatchlist,
    toggleMovieWatchlist,
    toggleSeriesWatchlist,
    loadWatchlist
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
};

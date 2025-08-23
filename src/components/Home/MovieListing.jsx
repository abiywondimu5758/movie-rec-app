// MovieListing.jsx

import { useContext, useState, useEffect, useMemo } from 'react';
import { MovieContext } from '../../contexts/movieContext';
import MediaCard from './MediaCard';
import { Button } from '../ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

const MovieListing = () => {
  const { movies, loading, error, fetchMovies } = useContext(MovieContext);
  const [displayedMovies, setDisplayedMovies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const moviesPerPage = 12;

  // Memoize the paginated movies
  const paginatedMovies = useMemo(() => {
    const startIndex = (currentPage - 1) * moviesPerPage;
    const endIndex = startIndex + moviesPerPage;
    return movies.slice(startIndex, endIndex);
  }, [movies, currentPage]);

  useEffect(() => {
    setDisplayedMovies(paginatedMovies);
  }, [paginatedMovies]);

  const totalPages = Math.ceil(movies.length / moviesPerPage);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    // Refresh the movies data
    if (fetchMovies) {
      fetchMovies();
    }
  };

  const handleCardUpdate = () => {
    // Refresh the movies data when a card is updated
    if (fetchMovies) {
      fetchMovies();
    }
  };

  if (loading && movies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error loading movies: {error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No movies found</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Movies Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {displayedMovies.map((movie) => (
          <MediaCard key={movie.id} item={movie} type="movie" onUpdate={handleCardUpdate} />
        ))}
      </div>

      {/* Load More Button */}
      {currentPage < totalPages && (
        <div className="flex justify-center pt-6">
          <Button 
            onClick={handleLoadMore} 
            variant="outline"
            className="px-8"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Movies'
            )}
          </Button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} • Showing {displayedMovies.length} of {movies.length} movies
        </div>
      )}
    </div>
  );
};

export default MovieListing;

// SeriesListing.jsx

import { useContext, useState, useEffect, useMemo } from 'react';
import { SeriesContext } from '../../contexts/seriesContext';
import MediaCard from './MediaCard';
import { Button } from '../ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

const SeriesListing = () => {
  const { series, loading, error, fetchSeries } = useContext(SeriesContext);
  const [displayedSeries, setDisplayedSeries] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const seriesPerPage = 12;

  // Memoize the paginated series
  const paginatedSeries = useMemo(() => {
    const startIndex = (currentPage - 1) * seriesPerPage;
    const endIndex = startIndex + seriesPerPage;
    return series.slice(startIndex, endIndex);
  }, [series, currentPage]);

  useEffect(() => {
    setDisplayedSeries(paginatedSeries);
  }, [paginatedSeries]);

  const totalPages = Math.ceil(series.length / seriesPerPage);

  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    // Refresh the series data
    if (fetchSeries) {
      fetchSeries();
    }
  };

  const handleCardUpdate = () => {
    // Refresh the series data when a card is updated
    if (fetchSeries) {
      fetchSeries();
    }
  };

  if (loading && series.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading series...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-destructive">Error loading series: {error}</p>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No series found</p>
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
      {/* Series Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {displayedSeries.map((series) => (
          <MediaCard key={series.id} item={series} type="series" onUpdate={handleCardUpdate} />
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
              'Load More Series'
            )}
          </Button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} • Showing {displayedSeries.length} of {series.length} series
        </div>
      )}
    </div>
  );
};

export default SeriesListing;

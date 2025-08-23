import { useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { MovieContext } from '../../contexts/movieContext';
import { SeriesContext } from '../../contexts/seriesContext';
import MovieListing from './MovieListing';
import SeriesListing from './SeriesListing';
import MediaCard from './MediaCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Search, Film, Tv, Loader2, Star, Filter, ChevronDown, ChevronUp, X, TrendingUp } from 'lucide-react';

const Home = () => {
  const { movies, loading: moviesLoading, error: moviesError, fetchMovies } = useContext(MovieContext);
  const { series, loading: seriesLoading, error: seriesError, fetchSeries } = useContext(SeriesContext);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ movies: [], series: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Trending states
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const itemsPerPage = 20;
  
  // Advanced filter states
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [activeTab, setActiveTab] = useState('all');

  // Genre options
  const genres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' }
  ];

  // Year options (last 30 years)
  const years = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

  // Rating options
  const ratings = [
    { value: '9', label: '9+ Stars' },
    { value: '8', label: '8+ Stars' },
    { value: '7', label: '7+ Stars' },
    { value: '6', label: '6+ Stars' },
    { value: '5', label: '5+ Stars' }
  ];

  // Sort options
  const sortOptions = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'rating', label: 'Rating' },
    { value: 'date', label: 'Release Date' },
    { value: 'title', label: 'Title' }
  ];

  // Apply filters to content
  const applyFilters = useCallback((content, type) => {
    let filtered = [...content];

    console.log(`Applying filters to ${type}:`, {
      originalCount: content.length,
      selectedGenre,
      selectedYear,
      selectedRating,
      sortBy,
      sampleItem: content[0]
    });

    // Genre filter
    if (selectedGenre && selectedGenre !== 'all') {
      const beforeGenre = filtered.length;
      filtered = filtered.filter(item => 
        item.genre_ids && item.genre_ids.includes(parseInt(selectedGenre))
      );
      console.log(`Genre filter (${selectedGenre}): ${beforeGenre} -> ${filtered.length}`);
    }

    // Year filter
    if (selectedYear && selectedYear !== 'all') {
      const beforeYear = filtered.length;
      const year = parseInt(selectedYear);
      filtered = filtered.filter(item => {
        const releaseDate = type === 'movie' ? item.release_date : item.first_air_date;
        console.log(`Checking year for ${item.title || item.name}:`, {
          releaseDate,
          itemYear: releaseDate ? new Date(releaseDate).getFullYear() : 'no date',
          targetYear: year,
          matches: releaseDate && new Date(releaseDate).getFullYear() === year
        });
        return releaseDate && new Date(releaseDate).getFullYear() === year;
      });
      console.log(`Year filter (${year}): ${beforeYear} -> ${filtered.length}`);
    }

    // Rating filter
    if (selectedRating && selectedRating !== 'all') {
      const beforeRating = filtered.length;
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(item => 
        item.vote_average && item.vote_average >= minRating
      );
      console.log(`Rating filter (${minRating}+): ${beforeRating} -> ${filtered.length}`);
    }

    // Sort content
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.vote_average || 0) - (a.vote_average || 0);
        case 'date':
          const dateA = type === 'movie' ? a.release_date : a.first_air_date;
          const dateB = type === 'movie' ? b.release_date : b.first_air_date;
          return new Date(dateB || 0) - new Date(dateA || 0);
        case 'title':
          const titleA = a.title || a.name || '';
          const titleB = b.title || b.name || '';
          return titleA.localeCompare(titleB);
        case 'popularity':
        default:
          return (b.popularity || 0) - (a.popularity || 0);
      }
    });

    return filtered;
  }, [selectedGenre, selectedYear, selectedRating, sortBy]);

  // Check if any filters are active
  const hasActiveFilters = selectedGenre !== 'all' || selectedYear !== 'all' || selectedRating !== 'all' || sortBy !== 'popularity';

  // Apply filters to trending content and show as search results
  const applyFiltersToTrending = useCallback(() => {
    if (hasActiveFilters) {
      const filteredMovies = applyFilters(trendingMovies, 'movie');
      const filteredSeries = applyFilters(trendingSeries, 'series');
      
      console.log('Filtering trending content:', {
        originalMovies: trendingMovies.length,
        originalSeries: trendingSeries.length,
        filteredMovies: filteredMovies.length,
        filteredSeries: filteredSeries.length,
        filters: { selectedGenre, selectedYear, selectedRating, sortBy },
        hasActiveFilters
      });
      
      setSearchResults({
        movies: filteredMovies,
        series: filteredSeries
      });
      setShowSearchResults(true);
      setSearchCurrentPage(1);
      setSearchTotalPages(1);
    } else {
      setShowSearchResults(false);
      setSearchResults({ movies: [], series: [] });
    }
  }, [hasActiveFilters, applyFilters, trendingMovies, trendingSeries, selectedGenre, selectedYear, selectedRating, sortBy]);

  // Fetch trending content
  const fetchTrendingContent = useCallback(async (page = 1) => {
    setTrendingLoading(true);
    try {
      // Fetch trending movies
      const moviesResponse = await fetch(
        `https://api.themoviedb.org/3/trending/movie/day?page=${page}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        }
      );
      const moviesData = await moviesResponse.json();

      // Fetch trending series
      const seriesResponse = await fetch(
        `https://api.themoviedb.org/3/trending/tv/day?page=${page}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        }
      );
      const seriesData = await seriesResponse.json();

      console.log('Trending data fetched:', {
        moviesCount: moviesData.results?.length || 0,
        seriesCount: seriesData.results?.length || 0,
        sampleMovie: moviesData.results?.[0],
        sampleSeries: seriesData.results?.[0]
      });
      
      setTrendingMovies(moviesData.results || []);
      setTrendingSeries(seriesData.results || []);
      setTotalPages(Math.max(moviesData.total_pages || 1, seriesData.total_pages || 1));
    } catch (error) {
      console.error('Error fetching trending content:', error);
    } finally {
      setTrendingLoading(false);
    }
  }, []);

  const searchContent = useCallback(async (query, page = 1) => {
    if (!query.trim()) {
      setShowSearchResults(false);
      setSearchResults({ movies: [], series: [] });
      return;
    }

    console.log('Searching for:', query);
    setIsSearching(true);
    try {
      // Search movies
      const movieResponse = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        }
      );
      const movieData = await movieResponse.json();

      // Search series
      const seriesResponse = await fetch(
        `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=${page}`,
        {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        }
      );
      const seriesData = await seriesResponse.json();

      // Apply filters to search results
      const filteredMovies = applyFilters(movieData.results || [], 'movie');
      const filteredSeries = applyFilters(seriesData.results || [], 'series');

      console.log('Search results:', {
        originalMovies: movieData.results?.length || 0,
        originalSeries: seriesData.results?.length || 0,
        filteredMovies: filteredMovies.length,
        filteredSeries: filteredSeries.length,
        filters: { selectedGenre, selectedYear, selectedRating, sortBy }
      });

      setSearchResults({
        movies: filteredMovies,
        series: filteredSeries
      });
      setSearchCurrentPage(page);
      setSearchTotalPages(Math.max(movieData.total_pages || 1, seriesData.total_pages || 1));
      setShowSearchResults(true);
      console.log('Search completed, showing results:', filteredMovies.length + filteredSeries.length);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults({ movies: [], series: [] });
    } finally {
      setIsSearching(false);
    }
  }, [applyFilters]);

  // Load trending content on mount
  useEffect(() => {
    fetchTrendingContent(1);
  }, [fetchTrendingContent]);

  // Apply filters when they change (if no search query)
  useEffect(() => {
    if (!searchQuery.trim()) {
      applyFiltersToTrending();
    }
  }, [selectedGenre, selectedYear, selectedRating, sortBy, applyFiltersToTrending, searchQuery]);

  // Pagination handlers
  const handleTrendingPageChange = useCallback((page) => {
    setCurrentPage(page);
    fetchTrendingContent(page);
  }, [fetchTrendingContent]);

  const handleSearchPageChange = useCallback((page) => {
    setSearchCurrentPage(page);
    searchContent(searchQuery, page);
  }, [searchContent, searchQuery]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSelectedGenre('all');
    setSelectedYear('all');
    setSelectedRating('all');
    setSortBy('popularity');
    // Clear search results when filters are cleared
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
      setSearchResults({ movies: [], series: [] });
    }
  }, [searchQuery]);

  // Get filtered content for regular listings
  const filteredMovies = useMemo(() => {
    return applyFilters(movies, 'movie');
  }, [movies, applyFilters]);

  const filteredSeries = useMemo(() => {
    return applyFilters(series, 'series');
  }, [series, applyFilters]);

  // Combine search results for "All" tab
  const allResults = useMemo(() => {
    const movieItems = searchResults.movies.map(movie => ({ ...movie, type: 'movie' }));
    const seriesItems = searchResults.series.map(series => ({ ...series, type: 'series' }));
    return [...movieItems, ...seriesItems];
  }, [searchResults.movies, searchResults.series]);

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    setSearchCurrentPage(1);
    await searchContent(searchQuery, 1);
  }, [searchQuery, searchContent]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounced search
    const timeoutId = setTimeout(() => {
      if (value.trim()) {
        searchContent(value, 1); // Reset to page 1
        setSearchCurrentPage(1);
      } else {
        setShowSearchResults(false);
        setSearchResults({ movies: [], series: [] });
        // Apply filters to trending when search is cleared
        applyFiltersToTrending();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchContent, applyFiltersToTrending]);



  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults({ movies: [], series: [] });
    // Apply filters to trending when search is cleared
    applyFiltersToTrending();
  }, [applyFiltersToTrending]);

  const totalResults = searchResults.movies.length + searchResults.series.length;

  // Pagination component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {startPage > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
            >
              1
            </Button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        
        {pages.map(page => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
        
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="px-2">...</span>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </Button>
          </>
        )}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>
    );
  };

  const searchForm = useMemo(() => (
    <form onSubmit={handleSearch} className="relative mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for movies, series, actors..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-10 pr-20"
        />
        <Button
          type="submit"
          size="sm" 
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
          disabled={isSearching || !searchQuery.trim()}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Advanced Filters */}
      <div className="mt-4">
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Advanced Filters
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Genre Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Genre</label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre.id} value={genre.id.toString()}>
                        {genre.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Year Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Year</label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Minimum Rating</label>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Rating</SelectItem>
                    {ratings.map((rating) => (
                      <SelectItem key={rating.value} value={rating.value}>
                        {rating.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              {hasActiveFilters && (
                <Badge variant="secondary" className="text-xs">
                  {selectedGenre && 'Genre'} {selectedYear && 'Year'} {selectedRating && 'Rating'} {sortBy !== 'popularity' && 'Sorted'}
                </Badge>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </form>
  ), [searchQuery, handleSearchChange, handleSearch, isSearching, showFilters, selectedGenre, selectedYear, selectedRating, sortBy, hasActiveFilters, clearFilters, genres, years, ratings, sortOptions]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Discover Amazing Content
        </h1>
        <p className="text-muted-foreground">
          Explore movies and TV series, add them to your collections, and share with friends
        </p>
      </div>

      {searchForm}

      {showSearchResults ? (
        <>
          {/* Search Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Search Results for "{searchQuery}"
              </h2>
              <Badge variant="secondary">
                {searchResults.movies.length + searchResults.series.length} results
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={clearSearch}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Search
            </Button>
          </div>

          {/* Search Results Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                All ({searchResults.movies.length + searchResults.series.length})
              </TabsTrigger>
              <TabsTrigger value="movies" className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                Movies ({searchResults.movies.length})
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center gap-2">
                <Tv className="h-4 w-4" />
                Series ({searchResults.series.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {allResults.map((item) => (
                  <div key={`${item.type}-${item.id}`}>
                    <MediaCard item={item} type={item.type} onUpdate={() => {}} />
                  </div>
                ))}
              </div>
              <Pagination 
                currentPage={searchCurrentPage} 
                totalPages={searchTotalPages} 
                onPageChange={handleSearchPageChange} 
              />
            </TabsContent>

            <TabsContent value="movies" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {searchResults.movies.map((movie) => (
                  <MediaCard key={movie.id} item={movie} type="movie" onUpdate={() => {}} />
                ))}
              </div>
              <Pagination 
                currentPage={searchCurrentPage} 
                totalPages={searchTotalPages} 
                onPageChange={handleSearchPageChange} 
              />
            </TabsContent>

            <TabsContent value="series" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {searchResults.series.map((series) => (
                  <MediaCard key={series.id} item={series} type="series" onUpdate={() => {}} />
                ))}
              </div>
              <Pagination 
                currentPage={searchCurrentPage} 
                totalPages={searchTotalPages} 
                onPageChange={handleSearchPageChange} 
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          {/* Trending Content Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">
                Trending Today
              </h2>
              <Badge variant="secondary">
                Page {currentPage} of {totalPages}
              </Badge>
            </div>
          </div>

          {/* Trending Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                All ({trendingMovies.length + trendingSeries.length})
              </TabsTrigger>
              <TabsTrigger value="movies" className="flex items-center gap-2">
                <Film className="h-4 w-4" />
                Movies ({trendingMovies.length})
              </TabsTrigger>
              <TabsTrigger value="series" className="flex items-center gap-2">
                <Tv className="h-4 w-4" />
                Series ({trendingSeries.length})
              </TabsTrigger>
            </TabsList>

            {trendingLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading trending content...</span>
                </div>
              </div>
            ) : (
              <>
                <TabsContent value="all" className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {trendingMovies.map((movie) => (
                      <div key={`movie-${movie.id}`}>
                        <MediaCard item={movie} type="movie" onUpdate={() => {}} />
                      </div>
                    ))}
                    {trendingSeries.map((series) => (
                      <div key={`series-${series.id}`}>
                        <MediaCard item={series} type="series" onUpdate={() => {}} />
                      </div>
                    ))}
                  </div>
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handleTrendingPageChange} 
                  />
                </TabsContent>

                <TabsContent value="movies" className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {trendingMovies.map((movie) => (
                      <MediaCard key={movie.id} item={movie} type="movie" onUpdate={() => {}} />
                    ))}
                  </div>
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handleTrendingPageChange} 
                  />
                </TabsContent>

                <TabsContent value="series" className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {trendingSeries.map((series) => (
                      <MediaCard key={series.id} item={series} type="series" onUpdate={() => {}} />
                    ))}
                  </div>
                  <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={handleTrendingPageChange} 
                  />
                </TabsContent>
              </>
            )}
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Home;

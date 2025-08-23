import { useState, useEffect, useCallback, useContext } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { 
  X, 
  Star, 
  Calendar, 
  Clock, 
  Play,
  Heart,
  Share2,
  Edit,
  Plus,
  Trash2,
  Loader2,
  User,
  Tv,
  Youtube,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { addSeriesToFavorites, removeSeriesFromFavorites, isSeriesInFavorites, deleteSeries } from "../../Series";
import { useAuth } from "../../contexts/authContext";
import { useWatchlist } from "../../contexts/watchlistContext";
import { SeriesContext } from "../../contexts/seriesContext";

const SeriesDetailModal = ({ series, isOpen, onClose, isAdded, onEdit, onAdd }) => {
  const [cast, setCast] = useState([]);
  const [imgLoading, setImgLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const { currentUser } = useAuth();
  const { isSeriesInWatchlist, toggleSeriesWatchlist } = useWatchlist();
  const { fetchSeries } = useContext(SeriesContext);

  useEffect(() => {
    if (isOpen && series?.id) {
      fetchSeriesCast(series.id);
      checkFavoriteStatus();
    }
  }, [isOpen, series?.id]);

  const checkFavoriteStatus = async () => {
    if (!currentUser || !series?.id) return;
    try {
      const favorited = await isSeriesInFavorites(series.id, currentUser.uid);
      setIsFavorited(favorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const fetchSeriesCast = async (seriesId) => {
    setImgLoading(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${seriesId}/credits?language=en-US`,
        {
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        }
      );
      const data = await response.json();
      setCast(data.cast?.slice(0, 10) || []);
    } catch (error) {
      console.error('Error fetching series cast:', error);
    } finally {
      setImgLoading(false);
    }
  };

  const handleWatchTrailer = useCallback(() => {
    // Open YouTube search for series trailer
    const seriesTitle = series.name || series.original_name;
    const searchQuery = encodeURIComponent(`${seriesTitle} official trailer`);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
  }, [series.name, series.original_name]);

  const handleLike = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      if (isFavorited) {
        // Remove from favorites
        await removeSeriesFromFavorites(series.id, currentUser.uid);
        setIsFavorited(false);
      } else {
        // Add to favorites
        await addSeriesToFavorites(series, currentUser.uid);
        setIsFavorited(true);
      }
      
      // Refresh series list
      if (fetchSeries) {
        fetchSeries();
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  }, [currentUser, isFavorited, series, fetchSeries]);

  const handleWatchlistClick = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      await toggleSeriesWatchlist(series);
      // Refresh series list
      if (fetchSeries) {
        fetchSeries();
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
    }
  }, [currentUser, series, fetchSeries, toggleSeriesWatchlist]);

  const handleShare = useCallback(() => {
    const seriesTitle = series.name || series.original_name;
    if (navigator.share) {
      navigator.share({
        title: seriesTitle,
        text: series.overview,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${seriesTitle} - ${series.overview}`);
      console.log('Shared:', seriesTitle);
    }
  }, [series.name, series.original_name, series.overview]);

  const handleAddToList = useCallback(() => {
    onClose(); // Close the detail modal first
    if (onAdd) {
      // Small delay to ensure the detail modal closes before opening the add modal
      setTimeout(() => {
        onAdd();
      }, 100);
    }
  }, [onAdd, onClose]);

  if (!isOpen || !series) return null;

  const {
    name,
    original_name,
    overview,
    poster_path,
    backdrop_path,
    vote_average,
    vote_count,
    first_air_date,
    number_of_seasons,
    number_of_episodes,
    status,
    genres
  } = series;

  const seriesTitle = name || original_name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-xl">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Backdrop Image */}
        {backdrop_path && (
          <div className="relative h-64 overflow-hidden rounded-t-lg">
            <img
              src={`https://image.tmdb.org/t/p/original${backdrop_path}`}
              alt={seriesTitle}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img
                src={`https://image.tmdb.org/t/p/w500${poster_path}`}
                alt={seriesTitle}
                className="w-48 h-72 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{seriesTitle}</h2>
                {genres && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {genres.map((genre) => (
                      <Badge key={genre.id} variant="secondary">
                        {genre.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">{vote_average.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({vote_count})</span>
                </div>
                {first_air_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{new Date(first_air_date).getFullYear()}</span>
                  </div>
                )}
                {number_of_seasons && (
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4" />
                    <span className="text-sm">{number_of_seasons} season{number_of_seasons > 1 ? 's' : ''}</span>
                  </div>
                )}
                {number_of_episodes && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{number_of_episodes} episodes</span>
                  </div>
                )}
              </div>

              {/* Status */}
              {status && (
                <Badge variant={status === 'Returning Series' ? 'default' : 'outline'}>
                  {status}
                </Badge>
              )}

              {/* Comment Display */}
              {series.comment && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Your Comment:</p>
                      <p className="text-sm text-foreground">"{series.comment}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={handleWatchTrailer} 
                  variant="default"
                  className="flex items-center gap-2"
                >
                  <Youtube className="h-4 w-4" />
                  Watch Trailer
                </Button>
                
                {isAdded ? (
                  <>
                    <Button 
                      variant="outline"
                      onClick={onEdit} 
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="destructive"
                      onClick={() => handleDelete(series.seriesId)}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </>
                ) : (
                  <Button 
                    variant="outline"
                    onClick={handleAddToList} 
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add to List
                  </Button>
                )}
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleLike}
                  className="hover:bg-transparent focus:bg-transparent transition-all duration-200 hover:scale-110"
                >
                  <Heart className={`h-5 w-5 ${isFavorited ? "fill-red-500 text-red-500" : "fill-none text-muted-foreground"}`} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleWatchlistClick}
                  className="hover:bg-transparent focus:bg-transparent transition-all duration-200 hover:scale-110"
                >
                  <Clock className={`h-5 w-5 ${isSeriesInWatchlist(series.id) ? "fill-blue-500 text-blue-500" : "fill-none text-muted-foreground"}`} />
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleShare}
                  className="text-muted-foreground hover:text-blue-600 transition-all duration-200 hover:scale-110"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Overview */}
          {overview && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Overview</h3>
              <p className="text-muted-foreground leading-relaxed">{overview}</p>
            </div>
          )}

          {/* Cast */}
          {cast.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Cast</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {cast.map((person) => (
                  <div key={person.id} className="text-center">
                    <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden bg-muted">
                      {person.profile_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w200${person.profile_path}`}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Tv className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{person.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeriesDetailModal;

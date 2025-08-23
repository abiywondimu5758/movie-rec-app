/* eslint-disable react/prop-types */

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
  Film,
  Youtube,
  ExternalLink,
  MessageCircle
} from "lucide-react";
import { addToFavorites, removeFromFavorites, isInFavorites, deleteMovie } from "../../Movies";
import { useAuth } from "../../contexts/authContext";
import { useWatchlist } from "../../contexts/watchlistContext";
import { MovieContext } from "../../contexts/movieContext";

const MovieDetailModal = ({ movie, isOpen, onClose, isAdded, onEdit, onAdd }) => {
  const [cast, setCast] = useState([]);
  const [imgLoading, setImgLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);
  const { currentUser } = useAuth();
  const { isMovieInWatchlist, toggleMovieWatchlist } = useWatchlist();
  const { fetchMovies } = useContext(MovieContext);

  useEffect(() => {
    if (isOpen && movie?.id) {
      fetchMovieCast(movie.id);
      checkFavoriteStatus();
    }
  }, [isOpen, movie?.id]);

  const checkFavoriteStatus = async () => {
    if (!currentUser || !movie?.id) return;
    try {
      const favorited = await isInFavorites(movie.id, currentUser.uid);
      setIsFavorited(favorited);
    } catch (error) {
      console.error("Error checking favorite status:", error);
    }
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleDelete = useCallback(async (movieId) => {
    try {
      await deleteMovie(movieId);
      onClose();
    } catch (error) {
      console.error('Error deleting movie:', error);
    }
  }, [onClose]);

  const fetchMovieCast = async (movieId) => {
    setImgLoading(true);
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}/credits?language=en-US`,
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
      console.error('Error fetching movie cast:', error);
    } finally {
      setImgLoading(false);
    }
  };

  const handleWatchTrailer = useCallback(() => {
    // Open YouTube search for movie trailer
    const movieTitle = movie.title || movie.original_title;
    const searchQuery = encodeURIComponent(`${movieTitle} official trailer`);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
  }, [movie.title, movie.original_title]);

  const handleLike = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      if (isFavorited) {
        // Remove from favorites
        await removeFromFavorites(movie.id, currentUser.uid);
        setIsFavorited(false);
      } else {
        // Add to favorites
        await addToFavorites(movie, currentUser.uid);
        setIsFavorited(true);
      }
      
      // Refresh movies list
      if (fetchMovies) {
        fetchMovies();
      }
    } catch (error) {
      console.error("Error updating favorites:", error);
    }
  }, [currentUser, isFavorited, movie, fetchMovies]);

  const handleWatchlistClick = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      await toggleMovieWatchlist(movie);
      // Refresh movies list
      if (fetchMovies) {
        fetchMovies();
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
    }
  }, [currentUser, movie, fetchMovies, toggleMovieWatchlist]);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: movie.title,
        text: movie.overview,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${movie.title} - ${movie.overview}`);
      console.log('Shared:', movie.title);
    }
  }, [movie.title, movie.overview]);

  const handleAddToList = useCallback(() => {
    onClose(); // Close the detail modal first
    if (onAdd) {
      // Small delay to ensure the detail modal closes before opening the add modal
      setTimeout(() => {
        onAdd();
      }, 100);
    }
  }, [onAdd, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-xl">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-10"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Backdrop Image */}
        <div className="relative h-64 overflow-hidden rounded-t-lg">
          {imgLoading ? (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading image...</span>
              </div>
            </div>
          ) : movie.backdrop_path ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
              <div className="text-center">
                <Film className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <span className="text-sm text-muted-foreground">No backdrop available</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Poster */}
            <div className="flex-shrink-0">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-48 h-72 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">{movie.title}</h2>
                {movie.genres && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {movie.genres.map((genre) => (
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
                  <span className="text-sm font-medium">{movie.vote_average?.toFixed(1) || "N/A"}</span>
                  <span className="text-xs text-muted-foreground">({movie.vote_count || 0})</span>
                </div>
                {movie.release_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                )}
                {movie.runtime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{movie.runtime} min</span>
                  </div>
                )}
                {movie.status && (
                  <div className="flex items-center gap-2">
                    <Badge variant={movie.status === 'Released' ? 'default' : 'outline'}>
                      {movie.status}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Comment Display */}
              {movie.comment && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Your Comment:</p>
                      <p className="text-sm text-foreground">"{movie.comment}"</p>
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
                      onClick={() => handleDelete(movie.movieId)}
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
                  <Clock className={`h-5 w-5 ${isMovieInWatchlist(movie.id) ? "fill-blue-500 text-blue-500" : "fill-none text-muted-foreground"}`} />
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
          {movie.overview && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3">Overview</h3>
              <p className="text-muted-foreground leading-relaxed">{movie.overview}</p>
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
                          <User className="h-6 w-6" />
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

export default MovieDetailModal;

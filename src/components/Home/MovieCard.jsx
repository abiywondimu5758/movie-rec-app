import { useState, useEffect, useCallback, memo } from "react";
import MovieModal from "./MovieModal";
import MovieEditModal from "./MovieEditModal";
import MovieDetailModal from "./MovieDetailModal";
import { fetchMovies, deleteMovie, updateMovie, addMovie, addToFavorites, removeFromFavorites, isInFavorites, addRating, getRating } from "../../Movies";
import { useAuth } from "../../contexts/authContext";
import { useWatchlist } from "../../contexts/watchlistContext";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { 
  Star, 
  Heart, 
  Plus, 
  Edit, 
  Trash2, 
  Play,
  Calendar,
  Clock,
  MessageCircle
} from "lucide-react";
import { cn } from "../../lib/utils";

const MovieCard = memo(({ movie, onUpdate }) => {
  const { poster_path, vote_average, overview, title, original_name, release_date, runtime } = movie;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteError, setIsDeleteError] = useState(false);
  const [isDeleteSnackbar, setIsDeleteSnackbar] = useState(false);
  const { currentUser } = useAuth();
  const { isMovieInWatchlist, toggleMovieWatchlist } = useWatchlist();

  const [fetchedMovie, setFetchedMovie] = useState([]);
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState(null);

  const fetchMovieStatus = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const moviesData = await fetchMovies(currentUser.uid);
      const foundMovie = moviesData.find((m) => m.id === movie.id);
      setFetchedMovie(foundMovie || movie);
      setIsAdded(!!foundMovie);
      
      // Check favorites separately
      const favorited = await isInFavorites(movie.id, currentUser.uid);
      setIsFavorited(favorited);
      
      // Get user rating
      const rating = await getRating(movie.id, currentUser.uid);
      setUserRating(rating);
    } catch (error) {
      console.error("Error fetching movies: ", error);
    }
  }, [currentUser, movie.id, movie]);

  useEffect(() => {
    fetchMovieStatus();
  }, [fetchMovieStatus]);

  const handleDelete = useCallback(async (movieId) => {
    setDeleteLoading(true);
    try {
      await deleteMovie(movieId);
      setIsDeleteSnackbar(true);
      setIsAdded(false);
      // Refresh the movie status
      await fetchMovieStatus();
      // Notify parent component to refresh
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      setIsDeleteError(true);
    } finally {
      setDeleteLoading(false);
    }
  }, [fetchMovieStatus, onUpdate]);

  const handleHeartClick = useCallback(async () => {
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
      
      // Refresh status
      await fetchMovieStatus();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating favorites: ", error);
    }
  }, [currentUser, isFavorited, movie, onUpdate, fetchMovieStatus]);

  const handleWatchlistClick = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      await toggleMovieWatchlist(movie);
      // Refresh status
      await fetchMovieStatus();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating watchlist: ", error);
    }
  }, [currentUser, movie, onUpdate, fetchMovieStatus, toggleMovieWatchlist]);

  const handleModalOpen = useCallback(() => setIsModalOpen(true), []);
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    // Refresh status after modal closes
    fetchMovieStatus();
    if (onUpdate) {
      onUpdate();
    }
  }, [fetchMovieStatus, onUpdate]);
  const handleEditModalOpen = useCallback(() => setIsEditModalOpen(true), []);
  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    // Refresh status after edit modal closes
    fetchMovieStatus();
    if (onUpdate) {
      onUpdate();
    }
  }, [fetchMovieStatus, onUpdate]);
  const handleDetailModalOpen = useCallback(() => setIsDetailModalOpen(true), []);
  const handleDetailModalClose = useCallback(() => setIsDetailModalOpen(false), []);
  const handleDeleteSnackbarClose = useCallback(() => setIsDeleteSnackbar(false), []);

  const movieTitle = title || original_name;
  const shortenedTitle = movieTitle.length > 20 ? movieTitle.slice(0, 20) + "..." : movieTitle;
  const shortenedOverview = overview.length > 80 ? overview.slice(0, 80) + "..." : overview;

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={`https://image.tmdb.org/t/p/w500${poster_path}`}
            alt={movieTitle}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            onClick={handleDetailModalOpen}
          />
          
          {/* Overlay with play button */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
            <Button
              size="icon"
              variant="secondary"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              onClick={handleDetailModalOpen}
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>

          {/* Rating badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{vote_average.toFixed(1)}</span>
            </Badge>
          </div>

          {/* Release date */}
          {release_date && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(release_date).getFullYear()}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 pb-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm line-clamp-2">{movie.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{movie.vote_average?.toFixed(1) || "N/A"}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A"}</span>
            </div>
            {fetchedMovie.comment && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    "{fetchedMovie.comment}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 flex justify-between items-center">
          {isAdded ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="iconSm"
                onClick={handleEditModalOpen}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                size="iconSm"
                onClick={() => handleDelete(fetchedMovie.movieId)}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleModalOpen}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add to List
            </Button>
          )}

          <Button
            variant="ghost"
            size="iconSm"
            onClick={handleHeartClick}
            className="hover:bg-transparent focus:bg-transparent transition-all duration-200 hover:scale-110"
          >
            <Heart className={cn(
              "h-4 w-4",
              isFavorited ? "fill-red-500 text-red-500" : "fill-none text-muted-foreground"
            )} />
          </Button>
          
          <Button
            variant="ghost"
            size="iconSm"
            onClick={handleWatchlistClick}
            className="hover:bg-transparent focus:bg-transparent transition-all duration-200 hover:scale-110"
          >
            <Clock className={cn(
              "h-4 w-4",
              isMovieInWatchlist(movie.id) ? "fill-blue-500 text-blue-500" : "fill-none text-muted-foreground"
            )} />
          </Button>
        </CardFooter>
      </Card>

      {/* Modals */}
      <MovieModal
        movie={movie}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
      <MovieEditModal
        movie={fetchedMovie}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
      />
      <MovieDetailModal
        movie={movie}
        isOpen={isDetailModalOpen}
        onClose={handleDetailModalClose}
        isAdded={isAdded}
        onEdit={handleEditModalOpen}
        onAdd={handleModalOpen}
      />

      {/* Success/Error Toast */}
      {isDeleteSnackbar && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={cn(
            "px-4 py-2 rounded-md shadow-lg",
            isDeleteError 
              ? "bg-red-500 text-white" 
              : "bg-green-500 text-white"
          )}>
            {isDeleteError ? 'Failed to delete movie' : 'Movie deleted successfully'}
          </div>
        </div>
      )}
    </>
  );
});

MovieCard.displayName = "MovieCard";

export default MovieCard;

import { useState, useEffect, useCallback, memo } from "react";
import MovieModal from "./MovieModal";
import SeriesModal from "./SeriesModal";
import MovieEditModal from "./MovieEditModal";
import SeriesEditModal from "./SeriesEditModal";
import MovieDetailModal from "./MovieDetailModal";
import SeriesDetailModal from "./SeriesDetailModal";
import { fetchMovies, deleteMovie, updateMovie, addMovie, addToFavorites, removeFromFavorites, isInFavorites, addRating, getRating } from "../../Movies";
import { fetchSeries, deleteSeries, updateSeries, addSeries, addSeriesToFavorites, removeSeriesFromFavorites, isSeriesInFavorites, addSeriesRating, getSeriesRating } from "../../Series";
import { useAuth } from "../../contexts/authContext";
import { useWatchlist } from "../../contexts/watchlistContext";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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

const MediaCard = memo(({ item, type = 'movie', onUpdate }) => {
  const { poster_path, vote_average, overview, title, name, original_title, original_name, release_date, first_air_date, runtime } = item;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteError, setIsDeleteError] = useState(false);
  const [isDeleteSnackbar, setIsDeleteSnackbar] = useState(false);
  const { currentUser } = useAuth();
  const { 
    isMovieInWatchlist, 
    isSeriesInWatchlist, 
    toggleMovieWatchlist, 
    toggleSeriesWatchlist 
  } = useWatchlist();

  const [fetchedItem, setFetchedItem] = useState([]);
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState(null);

  // Determine if this is a movie or series
  const isMovie = type === 'movie';
  const displayTitle = title || name || original_title || original_name;
  const displayDate = release_date || first_air_date;

  const fetchItemStatus = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const fetchFunction = isMovie ? fetchMovies : fetchSeries;
      const isInFavoritesFunction = isMovie ? isInFavorites : isSeriesInFavorites;
      const getRatingFunction = isMovie ? getRating : getSeriesRating;
      
      const itemsData = await fetchFunction(currentUser.uid);
      const foundItem = itemsData.find((m) => m.id === item.id);
      setFetchedItem(foundItem || item);
      setIsAdded(!!foundItem);
      
      // Check favorites separately
      const favorited = await isInFavoritesFunction(item.id, currentUser.uid);
      setIsFavorited(favorited);
      
      // Get user rating
      const rating = await getRatingFunction(item.id, currentUser.uid);
      setUserRating(rating);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
    }
  }, [currentUser, item.id, item, isMovie, type]);

  useEffect(() => {
    fetchItemStatus();
  }, [fetchItemStatus]);

  const handleDelete = useCallback(async (itemId) => {
    setDeleteLoading(true);
    try {
      const deleteFunction = isMovie ? deleteMovie : deleteSeries;
      await deleteFunction(itemId);
      setIsDeleteSnackbar(true);
      setIsAdded(false);
      // Refresh the item status
      await fetchItemStatus();
      // Notify parent component to refresh
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      setIsDeleteError(true);
    } finally {
      setDeleteLoading(false);
    }
  }, [fetchItemStatus, onUpdate, isMovie]);

  const handleHeartClick = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const addToFavoritesFunction = isMovie ? addToFavorites : addSeriesToFavorites;
      const removeFromFavoritesFunction = isMovie ? removeFromFavorites : removeSeriesFromFavorites;
      
      if (isFavorited) {
        // Remove from favorites
        await removeFromFavoritesFunction(item.id, currentUser.uid);
        setIsFavorited(false);
      } else {
        // Add to favorites
        await addToFavoritesFunction(item, currentUser.uid);
        setIsFavorited(true);
      }
      
      // Refresh status
      await fetchItemStatus();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating favorites: ", error);
    }
  }, [currentUser, isFavorited, item, onUpdate, fetchItemStatus, isMovie]);

  const handleWatchlistClick = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const toggleFunction = isMovie ? toggleMovieWatchlist : toggleSeriesWatchlist;
      await toggleFunction(item);
      // Refresh status
      await fetchItemStatus();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating watchlist: ", error);
    }
  }, [currentUser, item, onUpdate, fetchItemStatus, isMovie, toggleMovieWatchlist, toggleSeriesWatchlist]);

  const handleModalOpen = useCallback(() => setIsModalOpen(true), []);
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    // Refresh status after modal closes
    fetchItemStatus();
    if (onUpdate) {
      onUpdate();
    }
  }, [fetchItemStatus, onUpdate]);
  
  const handleEditModalOpen = useCallback(() => setIsEditModalOpen(true), []);
  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    // Refresh status after edit modal closes
    fetchItemStatus();
    if (onUpdate) {
      onUpdate();
    }
  }, [fetchItemStatus, onUpdate]);
  
  const handleDetailModalOpen = useCallback(() => setIsDetailModalOpen(true), []);
  const handleDetailModalClose = useCallback(() => setIsDetailModalOpen(false), []);
  const handleDeleteSnackbarClose = useCallback(() => setIsDeleteSnackbar(false), []);

  const shortenedTitle = displayTitle.length > 20 ? displayTitle.slice(0, 20) + "..." : displayTitle;
  const shortenedOverview = overview.length > 80 ? overview.slice(0, 80) + "..." : overview;

  // Check watchlist status
  const isInWatchlist = isMovie ? isMovieInWatchlist(item.id) : isSeriesInWatchlist(item.id);

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={`https://image.tmdb.org/t/p/w500${poster_path}`}
            alt={displayTitle}
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
          {displayDate && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(displayDate).getFullYear()}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 pb-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm line-clamp-2">{displayTitle}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{vote_average?.toFixed(1) || "N/A"}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{displayDate ? new Date(displayDate).getFullYear() : "N/A"}</span>
            </div>
            {fetchedItem.comment && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    "{fetchedItem.comment}"
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
                onClick={() => handleDelete(fetchedItem[isMovie ? 'movieId' : 'seriesId'])}
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
              isInWatchlist ? "fill-blue-500 text-blue-500" : "fill-none text-muted-foreground"
            )} />
          </Button>
        </CardFooter>
      </Card>

      {/* Modals */}
      {isMovie ? (
        <>
          <MovieModal
            movie={item}
            isOpen={isModalOpen}
            onClose={handleModalClose}
          />
          <MovieEditModal
            movie={fetchedItem}
            isOpen={isEditModalOpen}
            onClose={handleEditModalClose}
          />
          <MovieDetailModal
            movie={item}
            isOpen={isDetailModalOpen}
            onClose={handleDetailModalClose}
            isAdded={isAdded}
            onEdit={handleEditModalOpen}
            onAdd={handleModalOpen}
          />
        </>
      ) : (
        <>
          <SeriesModal
            series={item}
            isOpen={isModalOpen}
            onClose={handleModalClose}
          />
          <SeriesEditModal
            series={fetchedItem}
            isOpen={isEditModalOpen}
            onClose={handleEditModalClose}
          />
          <SeriesDetailModal
            series={item}
            isOpen={isDetailModalOpen}
            onClose={handleDetailModalClose}
            isAdded={isAdded}
            onEdit={handleEditModalOpen}
            onAdd={handleModalOpen}
          />
        </>
      )}

      {/* Success/Error Toast */}
      {isDeleteSnackbar && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={cn(
            "px-4 py-2 rounded-md shadow-lg",
            isDeleteError 
              ? "bg-red-500 text-white" 
              : "bg-green-500 text-white"
          )}>
            {isDeleteError ? `Failed to delete ${type}` : `${type} deleted successfully`}
          </div>
        </div>
      )}
    </>
  );
});

MediaCard.displayName = "MediaCard";

export default MediaCard;

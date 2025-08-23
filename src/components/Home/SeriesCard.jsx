/* eslint-disable react/prop-types */
// MovieCard.jsx

import { useState, useEffect, useCallback, memo } from "react";
import SeriesModal from "./SeriesModal";
import SeriesEditModal from "./SeriesEditModal";
import SeriesDetailModal from "./SeriesDetailModal";
import { fetchSeries, deleteSeries, updateSeries, addSeries, addSeriesToFavorites, removeSeriesFromFavorites, isSeriesInFavorites, addSeriesRating, getSeriesRating } from "../../Series";
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
  Tv,
  MessageCircle,
  Clock
} from "lucide-react";
import { cn } from "../../lib/utils";

const SeriesCard = memo(({ series, onUpdate }) => {
  const { poster_path, vote_average, overview, name, original_name, first_air_date, number_of_seasons } = series;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDeleteError, setIsDeleteError] = useState(false);
  const [isDeleteSnackbar, setIsDeleteSnackbar] = useState(false);
  const { currentUser } = useAuth();
  const { isSeriesInWatchlist, toggleSeriesWatchlist } = useWatchlist();

  const [fetchedSeries, setFetchedSeries] = useState([]);
  const [isAdded, setIsAdded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState(null);

  const fetchSeriesStatus = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const seriesData = await fetchSeries(currentUser.uid);
      const foundSeries = seriesData.find((s) => s.id === series.id);
      setFetchedSeries(foundSeries || series);
      setIsAdded(!!foundSeries);
      
      // Check favorites separately
      const favorited = await isSeriesInFavorites(series.id, currentUser.uid);
      setIsFavorited(favorited);
      
      // Get user rating
      const rating = await getSeriesRating(series.id, currentUser.uid);
      setUserRating(rating);
    } catch (error) {
      console.error("Error fetching series: ", error);
    }
  }, [currentUser, series.id, series]);

  useEffect(() => {
    fetchSeriesStatus();
  }, [fetchSeriesStatus]);

  const handleDelete = useCallback(async (seriesId) => {
    setDeleteLoading(true);
    try {
      await deleteSeries(seriesId);
      setIsDeleteSnackbar(true);
      setIsAdded(false);
      // Refresh the series status
      await fetchSeriesStatus();
      // Notify parent component to refresh
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      setIsDeleteError(true);
    } finally {
      setDeleteLoading(false);
    }
  }, [fetchSeriesStatus, onUpdate]);

  const handleHeartClick = useCallback(async () => {
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
      
      // Refresh status
      await fetchSeriesStatus();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating favorites: ", error);
    }
  }, [currentUser, isFavorited, series, onUpdate, fetchSeriesStatus]);

  const handleWatchlistClick = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      await toggleSeriesWatchlist(series);
      // Refresh status
      await fetchSeriesStatus();
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating watchlist: ", error);
    }
  }, [currentUser, series, onUpdate, fetchSeriesStatus, toggleSeriesWatchlist]);

  const handleModalOpen = useCallback(() => setIsModalOpen(true), []);
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    // Refresh status after modal closes
    fetchSeriesStatus();
    if (onUpdate) {
      onUpdate();
    }
  }, [fetchSeriesStatus, onUpdate]);
  const handleEditModalOpen = useCallback(() => setIsEditModalOpen(true), []);
  const handleEditModalClose = useCallback(() => {
    setIsEditModalOpen(false);
    // Refresh status after edit modal closes
    fetchSeriesStatus();
    if (onUpdate) {
      onUpdate();
    }
  }, [fetchSeriesStatus, onUpdate]);
  const handleDetailModalOpen = useCallback(() => setIsDetailModalOpen(true), []);
  const handleDetailModalClose = useCallback(() => setIsDetailModalOpen(false), []);
  const handleDeleteSnackbarClose = useCallback(() => setIsDeleteSnackbar(false), []);

  const seriesTitle = name || original_name;
  const shortenedTitle = seriesTitle.length > 20 ? seriesTitle.slice(0, 20) + "..." : seriesTitle;
  const shortenedOverview = overview.length > 80 ? overview.slice(0, 80) + "..." : overview;

  return (
    <>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={`https://image.tmdb.org/t/p/w500${poster_path}`}
            alt={seriesTitle}
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

          {/* Air date */}
          {first_air_date && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(first_air_date).getFullYear()}
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-4 pb-2">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm line-clamp-2">{series.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{series.vote_average?.toFixed(1) || "N/A"}</span>
              <span>•</span>
              <Calendar className="h-3 w-3" />
              <span>{series.first_air_date ? new Date(series.first_air_date).getFullYear() : "N/A"}</span>
            </div>
            {fetchedSeries.comment && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                <div className="flex items-start gap-2">
                  <MessageCircle className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    "{fetchedSeries.comment}"
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
                onClick={() => handleDelete(fetchedSeries.seriesId)}
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
              isSeriesInWatchlist(series.id) ? "fill-blue-500 text-blue-500" : "fill-none text-muted-foreground"
            )} />
          </Button>
        </CardFooter>
      </Card>

      {/* Modals */}
      <SeriesModal
        series={series}
        isOpen={isModalOpen}
        onClose={handleModalClose}
      />
      <SeriesEditModal
        series={fetchedSeries}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
      />
      <SeriesDetailModal
        series={series}
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
            {isDeleteError ? 'Failed to delete series' : 'Series deleted successfully'}
          </div>
        </div>
      )}
    </>
  );
});

SeriesCard.displayName = "SeriesCard";

export default SeriesCard;

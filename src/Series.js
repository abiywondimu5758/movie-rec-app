// movies.js
import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  getDoc
} from "firebase/firestore";

// Function to add a new series to the database
export async function addSeries(series, comment, category, userId) {
  try {
    const seriesId = `${userId}-${series.id}`;
    await setDoc(doc(collection(db, "series"), seriesId), {
      ...series,
      seriesId,
      comment,
      category,
      userId,
      timestamp: new Date(),
    });
    console.log("Document written with ID: ", seriesId);
    return seriesId;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}

export async function fetchSeries(userId, category = null) {
  try {
    console.log(category);
    const series = [];
    let q = collection(db, "series");

    if (category) {
      q = query(
        q,
        where("userId", "==", userId),
        where("category", "==", category)
      );
    } else {
      q = query(q, where("userId", "==", userId));
    }

    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      series.push({ id: doc.id, ...doc.data() });
    });
    return series;
  } catch (error) {
    console.error("Error fetching series: ", error);
    throw error;
  }
}

export async function fetchSeriesBasedOnCategory(userId, category) {
    try {
        console.log("Fetching series for category:", userId);
        const series = [];
        const q = query(
          collection(db, "series"),
          where("userId", "==", userId),
          where("category", "==", category)
        );
    
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          series.push({ id: doc.id, ...doc.data() });
        });
    
        console.log("Fetched series:", series);
        return series;
      } catch (error) {
        console.error("Error fetching series: ", error);
        throw error;
      }
  }
  

export async function editSeries(seriesId, updatedSeriesData) {
  try {
    const seriesDocRef = doc(db, "series", seriesId);
    
    // console.log(updatedSeriesData);
    await updateDoc(seriesDocRef, updatedSeriesData);
    console.log("Series updated successfully");
  } catch (error) {
    console.error("Error updating series: ", error);
    throw error;
  }
}

export async function updateSeries(seriesId, updatedSeriesData) {
  try {
    const seriesDocRef = doc(db, "series", seriesId);
    await updateDoc(seriesDocRef, updatedSeriesData);
    console.log("Series updated successfully");
  } catch (error) {
    console.error("Error updating series: ", error);
    throw error;
  }
}

export async function deleteSeries(seriesId) {
    try {
        console.log(seriesId);
      const seriesRef = doc(db, "series", seriesId);
      
      await deleteDoc(seriesRef);
      
      console.log("Series deleted successfully");
    } catch (error) {
      console.error("Error deleting series: ", error);
      throw error;
    }
  }  

// FAVORITES FUNCTIONS - COMPLETELY SEPARATE FROM MAIN LISTS
export async function addSeriesToFavorites(series, userId) {
  try {
    const favoriteId = `${userId}-favorite-${series.id}`;
    await setDoc(doc(collection(db, "seriesFavorites"), favoriteId), {
      ...series,
      favoriteId,
      userId,
      timestamp: new Date(),
    });
    console.log("Added series to favorites with ID: ", favoriteId);
    return favoriteId;
  } catch (e) {
    console.error("Error adding series to favorites: ", e);
    throw e;
  }
}

export async function removeSeriesFromFavorites(seriesId, userId) {
  try {
    const favoriteId = `${userId}-favorite-${seriesId}`;
    const favoriteRef = doc(db, "seriesFavorites", favoriteId);
    await deleteDoc(favoriteRef);
    console.log("Removed series from favorites successfully");
  } catch (error) {
    console.error("Error removing series from favorites: ", error);
    throw error;
  }
}

export async function fetchSeriesFavorites(userId) {
  try {
    const favorites = [];
    const q = query(collection(db, "seriesFavorites"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      favorites.push({ id: doc.id, ...doc.data() });
    });
    return favorites;
  } catch (error) {
    console.error("Error fetching series favorites: ", error);
    throw error;
  }
}

export async function isSeriesInFavorites(seriesId, userId) {
  try {
    const favoriteId = `${userId}-favorite-${seriesId}`;
    const favoriteRef = doc(db, "seriesFavorites", favoriteId);
    const favoriteDoc = await getDoc(favoriteRef);
    return favoriteDoc.exists();
  } catch (error) {
    console.error("Error checking series favorites: ", error);
    return false;
  }
}

// RATING FUNCTIONS
export async function addSeriesRating(seriesId, userId, rating, review = "") {
  try {
    const ratingId = `${userId}-rating-${seriesId}`;
    await setDoc(doc(collection(db, "seriesRatings"), ratingId), {
      seriesId,
      userId,
      rating,
      review,
      timestamp: new Date(),
    });
    console.log("Series rating added successfully");
    return ratingId;
  } catch (error) {
    console.error("Error adding series rating: ", error);
    throw error;
  }
}

export async function updateSeriesRating(seriesId, userId, rating, review = "") {
  try {
    const ratingId = `${userId}-rating-${seriesId}`;
    const ratingRef = doc(db, "seriesRatings", ratingId);
    await updateDoc(ratingRef, {
      rating,
      review,
      timestamp: new Date(),
    });
    console.log("Series rating updated successfully");
  } catch (error) {
    console.error("Error updating series rating: ", error);
    throw error;
  }
}

export async function getSeriesRating(seriesId, userId) {
  try {
    const ratingId = `${userId}-rating-${seriesId}`;
    const ratingRef = doc(db, "seriesRatings", ratingId);
    const ratingDoc = await getDoc(ratingRef);
    return ratingDoc.exists() ? ratingDoc.data() : null;
  } catch (error) {
    console.error("Error getting series rating: ", error);
    return null;
  }
}

export async function deleteSeriesRating(seriesId, userId) {
  try {
    const ratingId = `${userId}-rating-${seriesId}`;
    const ratingRef = doc(db, "seriesRatings", ratingId);
    await deleteDoc(ratingRef);
    console.log("Series rating deleted successfully");
  } catch (error) {
    console.error("Error deleting series rating: ", error);
    throw error;
  }
}

// WATCHLIST FUNCTIONS
export async function addSeriesToWatchlist(series, userId) {
  try {
    const watchlistId = `${userId}-watchlist-${series.id}`;
    await setDoc(doc(collection(db, "seriesWatchlist"), watchlistId), {
      ...series,
      watchlistId,
      userId,
      timestamp: new Date(),
    });
    console.log("Added series to watchlist with ID: ", watchlistId);
    return watchlistId;
  } catch (e) {
    console.error("Error adding series to watchlist: ", e);
    throw e;
  }
}

export async function removeSeriesFromWatchlist(seriesId, userId) {
  try {
    const watchlistId = `${userId}-watchlist-${seriesId}`;
    const watchlistRef = doc(db, "seriesWatchlist", watchlistId);
    await deleteDoc(watchlistRef);
    console.log("Removed series from watchlist successfully");
  } catch (error) {
    console.error("Error removing series from watchlist: ", error);
    throw error;
  }
}

export async function fetchSeriesWatchlist(userId) {
  try {
    const watchlist = [];
    const q = query(collection(db, "seriesWatchlist"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      watchlist.push({ id: doc.id, ...doc.data() });
    });
    return watchlist;
  } catch (error) {
    console.error("Error fetching series watchlist: ", error);
    throw error;
  }
}

export async function isSeriesInWatchlist(seriesId, userId) {
  try {
    const watchlistId = `${userId}-watchlist-${seriesId}`;
    const watchlistRef = doc(db, "seriesWatchlist", watchlistId);
    const watchlistDoc = await getDoc(watchlistRef);
    return watchlistDoc.exists();
  } catch (error) {
    console.error("Error checking series watchlist: ", error);
    return false;
  }
}  
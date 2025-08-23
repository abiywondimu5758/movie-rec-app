// movies.js
import { db } from "./firebase";
import {
  collection,
  setDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc
} from "firebase/firestore";

// Function to add a new movie to the database
export async function addMovie(movie, comment, category, userId) {
  try {
    const movieId = `${userId}-${movie.id}`;
    await setDoc(doc(collection(db, "movies"), movieId), {
      ...movie,
      movieId,
      comment,
      category,
      userId,
      timestamp: new Date(),
    });
    console.log("Document written with ID: ", movieId);
    return movieId;
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
}

export async function fetchMovies(userId, category = null) {
  try {
    console.log(category);
    const movies = [];
    let q = collection(db, "movies");

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
      movies.push({ id: doc.id, ...doc.data() });
    });
    return movies;
  } catch (error) {
    console.error("Error fetching movies: ", error);
    throw error;
  }
}

export async function fetchMoviesBasedOnCategory(userId, category) {
    try {
        console.log("Fetching movies for category:", userId);
        const movies = [];
        const q = query(
          collection(db, "movies"),
          where("userId", "==", userId),
          where("category", "==", category)
        );
    
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          movies.push({ id: doc.id, ...doc.data() });
        });
    
        console.log("Fetched movies:", movies);
        return movies;
      } catch (error) {
        console.error("Error fetching movies: ", error);
        throw error;
      }
  }
  

export async function editMovie(movieId, updatedMovieData) {
  try {
    const movieDocRef = doc(db, "movies", movieId);
    
    // console.log(updatedMovieData);
    await updateDoc(movieDocRef, updatedMovieData);
    console.log("Movie updated successfully");
  } catch (error) {
    console.error("Error updating movie: ", error);
    throw error;
  }
}

export async function updateMovie(movieId, updatedMovieData) {
  try {
    const movieDocRef = doc(db, "movies", movieId);
    await updateDoc(movieDocRef, updatedMovieData);
    console.log("Movie updated successfully");
  } catch (error) {
    console.error("Error updating movie: ", error);
    throw error;
  }
}


export async function deleteMovie(movieId) {
    try {
        // console.log(movieId);
      const movieRef = doc(db, "movies", movieId);
      console.log('here',movieRef);
      await deleteDoc(movieRef);
      
      console.log("Movie deleted successfully");
    } catch (error) {
      console.error("Error deleting movie: ", error);
      throw error;
    }
  }  

// FAVORITES FUNCTIONS - COMPLETELY SEPARATE FROM MAIN LISTS
export async function addToFavorites(movie, userId) {
  try {
    const favoriteId = `${userId}-favorite-${movie.id}`;
    await setDoc(doc(collection(db, "favorites"), favoriteId), {
      ...movie,
      favoriteId,
      userId,
      timestamp: new Date(),
    });
    console.log("Added to favorites with ID: ", favoriteId);
    return favoriteId;
  } catch (e) {
    console.error("Error adding to favorites: ", e);
    throw e;
  }
}

export async function removeFromFavorites(movieId, userId) {
  try {
    const favoriteId = `${userId}-favorite-${movieId}`;
    const favoriteRef = doc(db, "favorites", favoriteId);
    await deleteDoc(favoriteRef);
    console.log("Removed from favorites successfully");
  } catch (error) {
    console.error("Error removing from favorites: ", error);
    throw error;
  }
}

export async function fetchFavorites(userId) {
  try {
    const favorites = [];
    const q = query(collection(db, "favorites"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      favorites.push({ id: doc.id, ...doc.data() });
    });
    return favorites;
  } catch (error) {
    console.error("Error fetching favorites: ", error);
    throw error;
  }
}

export async function isInFavorites(movieId, userId) {
  try {
    const favoriteId = `${userId}-favorite-${movieId}`;
    const favoriteRef = doc(db, "favorites", favoriteId);
    const favoriteDoc = await getDoc(favoriteRef);
    return favoriteDoc.exists();
  } catch (error) {
    console.error("Error checking favorites: ", error);
    return false;
  }
}

// RATING FUNCTIONS
export async function addRating(movieId, userId, rating, review = "") {
  try {
    const ratingId = `${userId}-rating-${movieId}`;
    await setDoc(doc(collection(db, "ratings"), ratingId), {
      movieId,
      userId,
      rating,
      review,
      timestamp: new Date(),
    });
    console.log("Rating added successfully");
    return ratingId;
  } catch (error) {
    console.error("Error adding rating: ", error);
    throw error;
  }
}

export async function updateRating(movieId, userId, rating, review = "") {
  try {
    const ratingId = `${userId}-rating-${movieId}`;
    const ratingRef = doc(db, "ratings", ratingId);
    await updateDoc(ratingRef, {
      rating,
      review,
      timestamp: new Date(),
    });
    console.log("Rating updated successfully");
  } catch (error) {
    console.error("Error updating rating: ", error);
    throw error;
  }
}

export async function getRating(movieId, userId) {
  try {
    const ratingId = `${userId}-rating-${movieId}`;
    const ratingRef = doc(db, "ratings", ratingId);
    const ratingDoc = await getDoc(ratingRef);
    return ratingDoc.exists() ? ratingDoc.data() : null;
  } catch (error) {
    console.error("Error getting rating: ", error);
    return null;
  }
}

export async function deleteRating(movieId, userId) {
  try {
    const ratingId = `${userId}-rating-${movieId}`;
    const ratingRef = doc(db, "ratings", ratingId);
    await deleteDoc(ratingRef);
    console.log("Rating deleted successfully");
  } catch (error) {
    console.error("Error deleting rating: ", error);
    throw error;
  }
}

// WATCHLIST FUNCTIONS
export async function addToWatchlist(movie, userId) {
  try {
    const watchlistId = `${userId}-watchlist-${movie.id}`;
    await setDoc(doc(collection(db, "watchlist"), watchlistId), {
      ...movie,
      watchlistId,
      userId,
      timestamp: new Date(),
    });
    console.log("Added to watchlist with ID: ", watchlistId);
    return watchlistId;
  } catch (e) {
    console.error("Error adding to watchlist: ", e);
    throw e;
  }
}

export async function removeFromWatchlist(movieId, userId) {
  try {
    const watchlistId = `${userId}-watchlist-${movieId}`;
    const watchlistRef = doc(db, "watchlist", watchlistId);
    await deleteDoc(watchlistRef);
    console.log("Removed from watchlist successfully");
  } catch (error) {
    console.error("Error removing from watchlist: ", error);
    throw error;
  }
}

export async function fetchWatchlist(userId) {
  try {
    const watchlist = [];
    const q = query(collection(db, "watchlist"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      watchlist.push({ id: doc.id, ...doc.data() });
    });
    return watchlist;
  } catch (error) {
    console.error("Error fetching watchlist: ", error);
    throw error;
  }
}

export async function isInWatchlist(movieId, userId) {
  try {
    const watchlistId = `${userId}-watchlist-${movieId}`;
    const watchlistRef = doc(db, "watchlist", watchlistId);
    const watchlistDoc = await getDoc(watchlistRef);
    return watchlistDoc.exists();
  } catch (error) {
    console.error("Error checking watchlist: ", error);
    return false;
  }
}  
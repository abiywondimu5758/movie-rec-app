/* eslint-disable react/prop-types */
import { createContext, useState, useEffect } from 'react';

export const MovieContext = createContext();

export const MovieProvider = ({ children }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState(null);
  const [movieImgs, setMovieImgs] = useState([]);
  const [creditLoading, setCreditLoading] = useState(true);
  const [creditError, setCreditError] = useState(null);


  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const options = {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        };
        const response = await fetch('https://api.themoviedb.org/3/movie/upcoming?language=en-US&page=1', options);
        if (!response.ok) {
          throw new Error('Failed to fetch movies');
        }
        const data = await response.json();
        
        setMovies(data.results);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Function to search for movies
  const searchMovies = async (query) => {
    try {
      setLoading(true);
      const searchOptions = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
        }
      };
      if(query === ''){
        const response = await fetch('https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page=1&sort_by=popularity.desc', searchOptions);
        if (!response.ok) {
            throw new Error('Failed to search movies');
          }
          const searchData = await response.json();
          setMovies(searchData.results);
      }
      else{
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${query}&include_adult=false&language=en-US&page=1`, searchOptions);
        if (!response.ok) {
            throw new Error('Failed to search movies');
          }
          const searchData = await response.json();
          setMovies(searchData.results);
      }

    //   console.log(searchData.results)
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };


  const getMovieImg = async (id) => {
    try {
      setImgLoading(true);
      const imageOptions = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
        }
      };

      const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/images`, imageOptions);
      if (!response.ok) {
        throw new Error('Failed to fetch movie images');
      }
      const data = await response.json();
      setMovieImgs(data.backdrops[0]);
      return data.backdrops;

    } catch (error) {
      setImgError(error.message);
    } finally {
      setImgLoading(false);
    }}
  
  const getMovieCredit = async (id) => {
      try {
        setCreditLoading(true);
        const credOptions = {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
          }
        };
  
        const response = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?language=en-US`, credOptions);
        if (!response.ok) {
          throw new Error('Failed to fetch movie images');
        }
        const data = await response.json();
        return data.cast;
  
      } catch (error) {
        setCreditError(error.message);
      } finally {
        setCreditLoading(false);
      }}

  return (
    <MovieContext.Provider value={{ movies, loading, error, searchMovies, getMovieImg, movieImgs, imgError, imgLoading, getMovieCredit, creditLoading, creditError}}>
      {children}
    </MovieContext.Provider>
  );
};

/* eslint-disable react/prop-types */
import { createContext, useState, useEffect } from 'react';

export const SeriesContext = createContext();

export const SeriesProvider = ({ children }) => {
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSeries = async () => {
      setLoading(true);
      const options = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
        }
      };

      try {
        const response = await fetch('https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc', options);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        setSeries(data.results);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSeries();
  }, []);

  // Function to search for movies
  const searchSeries = async (query) => {

  
    try {
      setLoading(true);
      const searchOptions = {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI0OGU1NTQwMmIxMThiN2M1NGRjMDljMjQ5NzQxNTc5ZCIsInN1YiI6IjY2NTc1ODg5MzM2ZmNjOTVmNGE4YmJiZSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.8j3Zh0hP1lU2ce9Vz-IOIZt1dItqNshDqW_LuOqL52k'
        }
      };
  
      let url = 'https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page=1&sort_by=popularity.desc';
      if (query) {
        url = `https://api.themoviedb.org/3/search/tv?query=${query}&include_adult=false&language=en-US&page=1`;
      }
  
      const response = await fetch(url, searchOptions);
      if (!response.ok) {
        throw new Error('Failed to search series');
      }
  
      const searchData = await response.json();
      setSeries(searchData.results);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SeriesContext.Provider value={{ series, loading, error, searchSeries }}>
      {children}
    </SeriesContext.Provider>
  );
};

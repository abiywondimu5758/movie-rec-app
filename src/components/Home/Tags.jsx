import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/authContext';
import { fetchMovies } from '../../Movies';
import { fetchSeries } from '../../Series';
import MediaCard from './MediaCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Tag, 
  Film, 
  Tv, 
  Plus, 
  X, 
  Search, 
  Loader2, 
  AlertTriangle,
  Filter,
  Hash
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const Tags = () => {
  const { currentUser } = useAuth();
  const [movies, setMovies] = useState([]);
  const [series, setSeries] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch user's movies, series, and tags
  const fetchUserData = useCallback(async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const [moviesData, seriesData] = await Promise.all([
        fetchMovies(currentUser.uid),
        fetchSeries(currentUser.uid)
      ]);
      
      setMovies(moviesData);
      setSeries(seriesData);

      // Fetch tags
      const tagsQuery = query(collection(db, 'tags'), where('userId', '==', currentUser.uid));
      const tagsSnapshot = await getDocs(tagsQuery);
      const tagsData = tagsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTags(tagsData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Add new tag
  const addTag = useCallback(async () => {
    if (!newTag.trim() || !currentUser) return;
    
    try {
      const tagData = {
        name: newTag.trim().toLowerCase(),
        displayName: newTag.trim(),
        userId: currentUser.uid,
        createdAt: new Date(),
        count: 0
      };
      
      await addDoc(collection(db, 'tags'), tagData);
      setNewTag('');
      fetchUserData();
    } catch (error) {
      console.error('Error adding tag:', error);
    }
  }, [newTag, currentUser, fetchUserData]);

  // Delete tag
  const deleteTag = useCallback(async (tagId) => {
    try {
      await deleteDoc(doc(db, 'tags', tagId));
      fetchUserData();
    } catch (error) {
      console.error('Error deleting tag:', error);
    }
  }, [fetchUserData]);

  // Toggle tag selection
  const toggleTag = useCallback((tagName) => {
    setSelectedTags(prev => 
      prev.includes(tagName) 
        ? prev.filter(tag => tag !== tagName)
        : [...prev, tagName]
    );
  }, []);

  // Clear all selected tags
  const clearSelectedTags = useCallback(() => {
    setSelectedTags([]);
  }, []);

  // Filter content by selected tags
  const filteredMovies = useMemo(() => {
    if (selectedTags.length === 0) return movies;
    
    return movies.filter(movie => {
      if (!movie.tags) return false;
      return selectedTags.some(tag => movie.tags.includes(tag));
    });
  }, [movies, selectedTags]);

  const filteredSeries = useMemo(() => {
    if (selectedTags.length === 0) return series;
    
    return series.filter(series => {
      if (!series.tags) return false;
      return selectedTags.some(tag => series.tags.includes(tag));
    });
  }, [series, selectedTags]);

  // Combine filtered content for "All" tab
  const allFiltered = useMemo(() => {
    const movieItems = filteredMovies.map(movie => ({ ...movie, type: 'movie' }));
    const seriesItems = filteredSeries.map(series => ({ ...series, type: 'series' }));
    return [...movieItems, ...seriesItems];
  }, [filteredMovies, filteredSeries]);

  const totalFiltered = filteredMovies.length + filteredSeries.length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading tags and content...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Tag className="h-8 w-8 text-green-500" />
          <h1 className="text-3xl font-bold">Smart Organization</h1>
          <Badge variant="secondary" className="text-sm">
            {tags.length} tags
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Organize your movies and series with custom tags for easy filtering
        </p>
      </div>

      {/* Tag Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Manage Tags
          </CardTitle>
          <CardDescription>
            Create and manage tags to organize your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter new tag name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
              className="flex-1"
            />
            <Button onClick={addTag} disabled={!newTag.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </div>

          {/* Existing Tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Your Tags</h4>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag.id} className="flex items-center gap-1">
                    <Badge 
                      variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag.name)}
                    >
                      {tag.displayName} ({tag.count || 0})
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTag(tag.id)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter by Tags */}
      {selectedTags.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Filtered by:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearSelectedTags}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content Display */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            All ({totalFiltered})
          </TabsTrigger>
          <TabsTrigger value="movies" className="flex items-center gap-2">
            <Film className="h-4 w-4" />
            Movies ({filteredMovies.length})
          </TabsTrigger>
          <TabsTrigger value="series" className="flex items-center gap-2">
            <Tv className="h-4 w-4" />
            Series ({filteredSeries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {totalFiltered === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tag className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No content found</h3>
                <p className="text-muted-foreground text-center mb-4">
                  {selectedTags.length > 0 
                    ? "No content matches the selected tags"
                    : "Add some movies or series to get started"
                  }
                </p>
                {selectedTags.length > 0 && (
                  <Button variant="outline" onClick={clearSelectedTags}>
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {allFiltered.map((item) => (
                <MediaCard key={`${item.type}-${item.id}`} item={item} type={item.type} onUpdate={fetchUserData} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="movies" className="space-y-6">
          {filteredMovies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Film className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No movies found</h3>
                <p className="text-muted-foreground text-center">
                  {selectedTags.length > 0 
                    ? "No movies match the selected tags"
                    : "Add some movies to get started"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredMovies.map((movie) => (
                <MediaCard key={movie.id} item={movie} type="movie" onUpdate={fetchUserData} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="series" className="space-y-6">
          {filteredSeries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Tv className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No series found</h3>
                <p className="text-muted-foreground text-center">
                  {selectedTags.length > 0 
                    ? "No series match the selected tags"
                    : "Add some series to get started"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredSeries.map((series) => (
                <MediaCard key={series.id} item={series} type="series" onUpdate={fetchUserData} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tags;

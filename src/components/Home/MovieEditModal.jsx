/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react';
import { editMovie } from '../../Movies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { X, Save, RotateCcw, Edit3, CheckCircle } from 'lucide-react';

const MovieEditModal = ({ movie, isOpen, onClose }) => {
  const [editedMovie, setEditedMovie] = useState({
    comment: movie.comment,
    category: movie.category,
  });

  useEffect(() => {
    setEditedMovie({
      comment: movie.comment,
      category: movie.category,
    });
  }, [movie, movie.comment]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedMovie({ ...editedMovie, [name]: value });
  }, [editedMovie]);

  const handleCategoryChange = useCallback((value) => {
    setEditedMovie({ ...editedMovie, category: value });
  }, [editedMovie]);

  const handleSubmit = useCallback(() => {
    const { comment, category } = editedMovie;
    const updatedMovieData = { ...movie, comment, category };
    editMovie(movie.movieId, updatedMovieData)
      .then(() => {
        console.log('Movie updated successfully');
        onClose();
      })
      .catch((error) => {
        console.error('Error updating movie: ', error);
      });
  }, [editedMovie, movie, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Edit Movie</CardTitle>
            <CardDescription>Update your movie details</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={movie.title}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="overview">Overview</Label>
            <Textarea
              id="overview"
              value={movie.overview}
              readOnly
              className="bg-muted resize-none"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment">Comment</Label>
            <Input
              id="comment"
              name="comment"
              value={editedMovie.comment}
              onChange={handleChange}
              placeholder="Add your comment..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={editedMovie.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Urgent">Urgent</SelectItem>
                <SelectItem value="Recommended">Recommended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              variant="default"
              onClick={handleSubmit}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Update Movie
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovieEditModal;

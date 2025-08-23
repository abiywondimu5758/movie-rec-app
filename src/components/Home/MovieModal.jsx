/* eslint-disable react/prop-types */
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../contexts/authContext';
import { addMovie } from '../../Movies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { X, Save, RotateCcw, Sparkles } from 'lucide-react';

const MovieModal = ({ movie, isOpen, onClose }) => {
  const [comment, setComment] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { currentUser } = useAuth();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setComment('');
      setCategory('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleCommentChange = useCallback((e) => {
    setComment(e.target.value);
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setCategory(value);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!comment.trim() || !category) {
      alert("Please fill in both comment and category fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addMovie(movie, comment, category, currentUser.uid);
      onClose();
    } catch (error) {
      console.error("Error adding movie:", error);
      alert("Failed to add movie. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [movie, comment, category, currentUser.uid, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Add Movie</CardTitle>
            <CardDescription>Add this movie to your list</CardDescription>
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
              value={comment}
              onChange={handleCommentChange}
              placeholder="Add your comment..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={handleCategoryChange}>
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
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Movie
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MovieModal;

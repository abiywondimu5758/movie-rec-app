/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react';
import { editSeries } from '../../Series';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { X, Save, RotateCcw, Edit3, CheckCircle } from 'lucide-react';

const SeriesEditModal = ({ series, isOpen, onClose }) => {
  const [editedSeries, setEditedSeries] = useState({
    comment: series.comment,
    category: series.category,
  });

  useEffect(() => {
    setEditedSeries({
      comment: series.comment,
      category: series.category,
    });
  }, [series, series.comment]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditedSeries({ ...editedSeries, [name]: value });
  }, [editedSeries]);

  const handleCategoryChange = useCallback((value) => {
    setEditedSeries({ ...editedSeries, category: value });
  }, [editedSeries]);

  const handleSubmit = useCallback(() => {
    const { comment, category } = editedSeries;
    const updatedSeriesData = { ...series, comment, category };
    editSeries(series.id, updatedSeriesData)
      .then(() => {
        console.log('Series updated successfully');
        onClose();
      })
      .catch((error) => {
        console.error('Error updating series: ', error);
      });
  }, [editedSeries, series, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Edit Series</CardTitle>
            <CardDescription>Update your series details</CardDescription>
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
              value={series.original_name}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="overview">Overview</Label>
            <Textarea
              id="overview"
              value={series.overview}
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
              value={editedSeries.comment}
              onChange={handleChange}
              placeholder="Add your comment..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={editedSeries.category} onValueChange={handleCategoryChange}>
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
              Update Series
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SeriesEditModal;

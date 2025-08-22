import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Image, 
  Video, 
  Edit3, 
  Trash2, 
  Move, 
  Download,
  Eye,
  Clock,
  HardDrive
} from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "sonner"

interface MediaItem {
  id: string
  filename: string | null
  mime_type: string | null
  caption: string | null
  width: number | null
  height: number | null
  byte_size: number | null
  duration_seconds: number | null
  sort_order: number | null
  created_at: string
}

interface MediaGalleryProps {
  media: MediaItem[]
  albumId: string
}

export const MediaGallery = ({ media, albumId }: MediaGalleryProps) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null)
  const [caption, setCaption] = useState("")
  const [filename, setFilename] = useState("")
  
  const queryClient = useQueryClient()

  const updateMediaMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: { caption?: string, filename?: string } }) => {
      const { error } = await supabase
        .from('media')
        .update(data)
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Media updated successfully!")
      queryClient.invalidateQueries({ queryKey: ['album-media', albumId] })
      setEditingMedia(null)
    },
    onError: (error) => {
      console.error('Error updating media:', error)
      toast.error("Failed to update media")
    }
  })

  const deleteMediaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Media deleted successfully!")
      queryClient.invalidateQueries({ queryKey: ['album-media', albumId] })
    },
    onError: (error) => {
      console.error('Error deleting media:', error)
      toast.error("Failed to delete media")
    }
  })

  const handleEdit = (mediaItem: MediaItem) => {
    setEditingMedia(mediaItem)
    setCaption(mediaItem.caption || "")
    setFilename(mediaItem.filename || "")
  }

  const handleSaveEdit = () => {
    if (!editingMedia) return
    
    updateMediaMutation.mutate({
      id: editingMedia.id,
      data: {
        caption: caption.trim() || null,
        filename: filename.trim() || null
      }
    })
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this media item?")) {
      deleteMediaMutation.mutate(id)
    }
  }

  const handleDownload = (mediaItem: MediaItem) => {
    toast.info("Download functionality coming soon!")
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size"
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (media.length === 0) {
    return (
      <div className="text-center py-8">
        <Image className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No media found in this album</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="gallery-grid-sm">
        {media.map((item) => (
          <Card key={item.id} className="group overflow-hidden">
            <div className="aspect-square relative">
              {item.mime_type?.startsWith('image/') ? (
                <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
                  <Image className="h-8 w-8 text-muted-foreground" />
                </div>
              ) : (
                <div className="w-full h-full bg-muted rounded-t-lg flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              
              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors rounded-t-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => setSelectedMedia(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => handleDownload(item)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {item.filename || 'Untitled'}
                  </p>
                  {item.mime_type?.startsWith('video/') && item.duration_seconds && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDuration(item.duration_seconds)}
                    </Badge>
                  )}
                </div>
                
                {item.caption && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.caption}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {item.width && item.height && (
                    <span>{item.width} × {item.height}</span>
                  )}
                  {item.byte_size && (
                    <div className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(item.byte_size)}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Media Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl">
          {selectedMedia && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>{selectedMedia.filename || 'Untitled'}</DialogTitle>
              </DialogHeader>
              
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {selectedMedia.mime_type?.startsWith('image/') ? (
                  <Image className="h-16 w-16 text-muted-foreground" />
                ) : (
                  <Video className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Type</Label>
                  <p className="text-muted-foreground">{selectedMedia.mime_type || 'Unknown'}</p>
                </div>
                {selectedMedia.width && selectedMedia.height && (
                  <div>
                    <Label className="font-medium">Dimensions</Label>
                    <p className="text-muted-foreground">{selectedMedia.width} × {selectedMedia.height}</p>
                  </div>
                )}
                <div>
                  <Label className="font-medium">File Size</Label>
                  <p className="text-muted-foreground">{formatFileSize(selectedMedia.byte_size)}</p>
                </div>
                {selectedMedia.duration_seconds && (
                  <div>
                    <Label className="font-medium">Duration</Label>
                    <p className="text-muted-foreground">{formatDuration(selectedMedia.duration_seconds)}</p>
                  </div>
                )}
                <div>
                  <Label className="font-medium">Created</Label>
                  <p className="text-muted-foreground">
                    {new Date(selectedMedia.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              {selectedMedia.caption && (
                <div>
                  <Label className="font-medium">Caption</Label>
                  <p className="text-muted-foreground mt-1">{selectedMedia.caption}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Media Dialog */}
      <Dialog open={!!editingMedia} onOpenChange={() => setEditingMedia(null)}>
        <DialogContent>
          {editingMedia && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle>Edit Media</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="filename">Filename</Label>
                  <Input
                    id="filename"
                    value={filename}
                    onChange={(e) => setFilename(e.target.value)}
                    placeholder="Enter filename"
                  />
                </div>
                
                <div>
                  <Label htmlFor="caption">Caption</Label>
                  <Textarea
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a caption (optional)"
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingMedia(null)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveEdit}
                    disabled={updateMediaMutation.isPending}
                  >
                    {updateMediaMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
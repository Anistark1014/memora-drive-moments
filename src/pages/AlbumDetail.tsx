import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Edit3, Share2, Download, Plus, Settings, Image, Video, Calendar, Users, Lock, Globe } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"

const AlbumDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [selectedMedia, setSelectedMedia] = useState<any>(null)

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login")
    }
  }, [user, loading, navigate])

  const { data: album, isLoading: albumLoading } = useQuery({
    queryKey: ['album', id],
    queryFn: async () => {
      if (!id) throw new Error('Album ID required')
      
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!id
  })

  const { data: media, isLoading: mediaLoading } = useQuery({
    queryKey: ['album-media', id],
    queryFn: async () => {
      if (!id) return []
      
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('album_id', id)
        .order('sort_order', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!id
  })

  const { data: shares } = useQuery({
    queryKey: ['album-shares', id],
    queryFn: async () => {
      if (!id) return []
      
      const { data, error } = await supabase
        .from('album_shares')
        .select('*')
        .eq('album_id', id)
      
      if (error) throw error
      return data || []
    },
    enabled: !!id && album?.user_id === user?.id
  })

  const handleShare = () => {
    toast.info("Sharing functionality coming soon!")
  }

  const handleDownload = () => {
    toast.info("Download functionality coming soon!")
  }

  if (loading || albumLoading || mediaLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading album...</p>
        </div>
      </div>
    )
  }

  if (!album) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Album not found</h1>
          <Link to="/albums">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Albums
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = album.user_id === user?.id
  const mediaCount = media?.length || 0
  const imageCount = media?.filter(m => m.mime_type?.startsWith('image/')).length || 0
  const videoCount = media?.filter(m => m.mime_type?.startsWith('video/')).length || 0

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/albums">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-serif font-bold">{album.title}</h1>
            <Badge variant={album.privacy === 'private' ? 'secondary' : 'default'}>
              {album.privacy === 'private' ? (
                <>
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3 mr-1" />
                  Public
                </>
              )}
            </Badge>
          </div>
          {album.description && (
            <p className="text-muted-foreground">{album.description}</p>
          )}
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(album.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <Image className="h-4 w-4" />
              {imageCount} photos
            </div>
            <div className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              {videoCount} videos
            </div>
            {shares && shares.length > 0 && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {shares.length} shared
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          {isOwner && (
            <>
              <Link to={`/albums/${id}/edit`}>
                <Button variant="outline">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Media Grid */}
      {mediaCount === 0 ? (
        <div className="text-center py-16">
          <Image className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No media yet</h3>
          <p className="text-muted-foreground mb-6">
            {isOwner ? "Start adding photos and videos to this album." : "This album is empty."}
          </p>
          {isOwner && (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Media
            </Button>
          )}
        </div>
      ) : (
        <div className="gallery-grid">
          {media?.map((item) => (
            <Card 
              key={item.id} 
              className="photo-card cursor-pointer group overflow-hidden"
              onClick={() => setSelectedMedia(item)}
            >
              <div className="aspect-square relative">
                {item.mime_type?.startsWith('image/') ? (
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="w-full h-full bg-muted rounded-lg flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg" />
              </div>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{item.filename || 'Untitled'}</p>
                  {item.mime_type?.startsWith('video/') && (
                    <Badge variant="secondary" className="text-xs">
                      {item.duration_seconds ? `${Math.round(item.duration_seconds)}s` : 'Video'}
                    </Badge>
                  )}
                </div>
                {item.caption && (
                  <p className="text-xs text-muted-foreground truncate mt-1">{item.caption}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Media Detail Dialog */}
      <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <DialogContent className="max-w-4xl">
          {selectedMedia && (
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {selectedMedia.mime_type?.startsWith('image/') ? (
                  <Image className="h-16 w-16 text-muted-foreground" />
                ) : (
                  <Video className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedMedia.filename || 'Untitled'}</h3>
                {selectedMedia.caption && (
                  <p className="text-muted-foreground">{selectedMedia.caption}</p>
                )}
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {selectedMedia.width && selectedMedia.height && (
                    <span>{selectedMedia.width} × {selectedMedia.height}</span>
                  )}
                  {selectedMedia.byte_size && (
                    <span>{(selectedMedia.byte_size / 1024 / 1024).toFixed(1)} MB</span>
                  )}
                  {selectedMedia.duration_seconds && (
                    <span>{Math.round(selectedMedia.duration_seconds)}s</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AlbumDetail
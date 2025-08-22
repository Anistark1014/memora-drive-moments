
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Folder, Calendar, Users, Settings } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useQuery } from "@tanstack/react-query"
import { CreateAlbumDialog } from "@/components/albums/CreateAlbumDialog"
import { DriveConnectionCard } from "@/components/drive/DriveConnectionCard"

const Albums = () => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login")
    }
  }, [user, loading, navigate])

  const { data: albums, isLoading: albumsLoading, refetch } = useQuery({
    queryKey: ['albums', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!user?.id
  })

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) throw error
      return data
    },
    enabled: !!user?.id
  })

  if (loading || albumsLoading) {
    return (
      <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold">My Albums</h1>
          <p className="text-muted-foreground">Organize and share your precious memories</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Album
        </Button>
      </div>

      {!profile?.drive_connected && (
        <div className="mb-8">
          <DriveConnectionCard />
        </div>
      )}

      {albums && albums.length === 0 ? (
        <div className="text-center py-16">
          <Folder className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No albums yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first album to start organizing your photos and videos.
          </p>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Album
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums?.map((album) => (
            <Card 
              key={album.id} 
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/albums/${album.id}`)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 truncate">
                    <Folder className="h-5 w-5 text-primary" />
                    {album.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      // TODO: Add album settings menu
                    }}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
                {album.description && (
                  <CardDescription className="line-clamp-2">
                    {album.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(album.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {album.privacy === 'private' ? 'Private' : 'Shared'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAlbumDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onSuccess={() => {
          refetch()
          setShowCreateDialog(false)
        }}
      />
    </div>
  )
}

export default Albums

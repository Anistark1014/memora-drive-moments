import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, Upload, Settings, Image, Palette, Edit3 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { CanvasEditor } from "@/components/editor/CanvasEditor"
import { MediaGallery } from "@/components/albums/MediaGallery"

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  privacy: z.enum(["private", "public"])
})

const AlbumEdit = () => {
  const { id } = useParams<{ id: string }>()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

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

  const { data: media } = useQuery({
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      privacy: "private"
    }
  })

  // Update form when album data loads
  useEffect(() => {
    if (album) {
      form.setValue("title", album.title)
      form.setValue("description", album.description || "")
      form.setValue("privacy", album.privacy as "private" | "public")
    }
  }, [album, form])

  const updateAlbumMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (!id) throw new Error('Album ID required')
      
      const { data, error } = await supabase
        .from('albums')
        .update({
          title: values.title,
          description: values.description || null,
          privacy: values.privacy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success("Album updated successfully!")
      queryClient.invalidateQueries({ queryKey: ['album', id] })
      queryClient.invalidateQueries({ queryKey: ['albums'] })
    },
    onError: (error) => {
      console.error('Error updating album:', error)
      toast.error("Failed to update album")
    }
  })

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateAlbumMutation.mutate(values)
  }

  if (loading || albumLoading) {
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

  // Check if user owns this album
  if (album.user_id !== user?.id) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold mb-4">Access denied</h1>
          <p className="text-muted-foreground mb-4">You can only edit albums that you own.</p>
          <Link to={`/albums/${id}`}>
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Album
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to={`/albums/${id}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-serif font-bold">Edit Album</h1>
          <p className="text-muted-foreground">Manage your album settings and media</p>
        </div>
        <Button 
          type="submit" 
          form="album-form"
          disabled={updateAlbumMutation.isPending}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {updateAlbumMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <Image className="h-4 w-4" />
            Media
          </TabsTrigger>
          <TabsTrigger value="editor" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="design" className="gap-2">
            <Palette className="h-4 w-4" />
            Design
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Album Settings</CardTitle>
              <CardDescription>
                Update your album's basic information and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form id="album-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Album Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter album title" {...field} />
                        </FormControl>
                        <FormDescription>
                          This is your album's display name.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your album (optional)"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          A brief description of what this album contains.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="privacy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Privacy</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select privacy setting" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="private">Private - Only you can see this album</SelectItem>
                            <SelectItem value="public">Public - Anyone with the link can view</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Control who can access this album.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Media Management</CardTitle>
              <CardDescription>
                Upload, organize, and manage the photos and videos in this album.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Media
                </Button>
                
                {media && media.length > 0 ? (
                  <MediaGallery media={media} albumId={id!} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Image className="h-12 w-12 mx-auto mb-2" />
                    <p>No media uploaded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Canvas Editor</CardTitle>
              <CardDescription>
                Create custom graphics and edit images for your album.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CanvasEditor />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Album Design</CardTitle>
              <CardDescription>
                Customize how your album looks and feels.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Palette className="h-12 w-12 mx-auto mb-2" />
                <p>Design customization coming soon!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AlbumEdit
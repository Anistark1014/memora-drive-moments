
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  privacy: z.enum(["private", "public", "unlisted"]),
  directory: z.string().min(1, "Directory is required"),
  images: z.any().optional(),
})

interface CreateAlbumDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CreateAlbumDialog({ open, onOpenChange, onSuccess }: CreateAlbumDialogProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      privacy: "private",
      directory: "",
      images: undefined,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) return

    setIsSubmitting(true)
    try {
      // Insert album with directory info
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .insert({
          title: values.title,
          description: values.description || null,
          privacy: values.privacy,
          user_id: user.id,
          directory: values.directory,
        })
        .select()
        .single()

      if (albumError) throw albumError

      // Upload images if any
      if (values.images && values.images.length > 0 && albumData?.id) {
        for (let i = 0; i < values.images.length; i++) {
          const file = values.images[i]
          const filePath = `${values.directory}/${file.name}`
          const { error: uploadError } = await supabase.storage
            .from('album-media')
            .upload(filePath, file)
          if (uploadError) throw uploadError
          // Optionally, insert media record in DB here
        }
      }

      toast({
        title: "Album created",
        description: "Your new album has been created successfully.",
      })

      form.reset()
      onSuccess()
    } catch (error) {
      console.error('Error creating album:', error)
      toast({
        title: "Error",
        description: "Failed to create album. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Album</DialogTitle>
          <DialogDescription>
            Create a new album to organize your photos and videos.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter album title" {...field} />
                  </FormControl>
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
                      placeholder="Optional description for your album"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Help others understand what this album is about.
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
                      <SelectItem value="private">Private - Only you can see</SelectItem>
                      <SelectItem value="unlisted">Unlisted - Anyone with link can see</SelectItem>
                      <SelectItem value="public">Public - Anyone can find and see</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    You can change this later in album settings.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="directory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Choose Album Directory *</FormLabel>
                  <FormControl>
                    {/* Use native input for directory selection */}
                    <input
                      type="file"
                      multiple
                      // @ts-ignore
                      webkitdirectory="true"
                      directory="true"
                      onChange={e => {
                        const files = e.target.files;
                        if (files && files.length > 0) {
                          // Get the directory name from the first file's path
                          const firstFile = files[0];
                          const path = (firstFile as any).webkitRelativePath || firstFile.name;
                          const dirName = path.split('/')[0];
                          field.onChange(dirName);
                          // Also set images field to all files in the directory
                          form.setValue('images', files);
                        }
                      }}
                      style={{ display: 'block', width: '100%' }}
                    />
                  </FormControl>
                  <FormDescription>
                    Select a folder from your device. All images inside will be added to the album.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Images</FormLabel>
                  <FormControl>
                    <Input type="file" multiple accept="image/*" onChange={e => field.onChange(e.target.files)} />
                  </FormControl>
                  <FormDescription>
                    Select images from your local storage to add to this album.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Album
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

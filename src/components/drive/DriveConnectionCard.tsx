
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HardDrive, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useQuery, useQueryClient } from "@tanstack/react-query"

export function DriveConnectionCard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isConnecting, setIsConnecting] = useState(false)

  const { data: profile, isLoading } = useQuery({
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

  const { data: driveConnection } = useQuery({
    queryKey: ['oauth-connections', user?.id, 'google'],
    queryFn: async () => {
      if (!user?.id) return null
      
      const { data, error } = await supabase
        .from('oauth_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!user?.id
  })

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      // Here you would typically redirect to Google OAuth
      // For now, we'll show a placeholder message
      toast({
        title: "Drive Connection",
        description: "Google Drive integration coming soon! For now, you can upload files directly.",
      })
    } catch (error) {
      console.error('Error connecting to Drive:', error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Google Drive. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      if (driveConnection?.id) {
        const { error } = await supabase
          .from('oauth_connections')
          .delete()
          .eq('id', driveConnection.id)

        if (error) throw error
      }

      await supabase
        .from('profiles')
        .update({ drive_connected: false })
        .eq('id', user?.id)

      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['oauth-connections', user?.id, 'google'] })

      toast({
        title: "Disconnected",
        description: "Google Drive has been disconnected successfully.",
      })
    } catch (error) {
      console.error('Error disconnecting Drive:', error)
      toast({
        title: "Error",
        description: "Failed to disconnect Google Drive. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const isConnected = profile?.drive_connected || !!driveConnection

  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HardDrive className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="flex items-center gap-2">
                Google Drive Integration
                {isConnected ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? "Your Google Drive is connected and ready to sync photos"
                  : "Connect your Google Drive to automatically sync and organize photos"
                }
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!isConnected ? (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p className="mb-2">Benefits of connecting Google Drive:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Automatically import photos from Drive</li>
                <li>Keep photos synced across devices</li>
                <li>Access unlimited storage (based on your Drive plan)</li>
                <li>Organize Drive photos into Memora albums</li>
              </ul>
            </div>
            
            <Button onClick={handleConnect} disabled={isConnecting} className="gap-2">
              <HardDrive className="h-4 w-4" />
              {isConnecting ? "Connecting..." : "Connect Google Drive"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-green-700 dark:text-green-300">
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Your Google Drive is successfully connected!
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                View Drive Files
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDisconnect}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

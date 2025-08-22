-- Enable pgcrypto for encryption helpers
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- USERS (link to auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  drive_connected boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- OAUTH CONNECTION (encrypted tokens; one row per provider, here 'google')
CREATE TABLE public.oauth_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider = 'google'),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scope text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- ALBUMS
CREATE TABLE public.albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_media_id uuid,
  privacy text NOT NULL DEFAULT 'private' CHECK (privacy IN ('private','shared','public','password')),
  password_hash text,
  drive_folder_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- MEDIA (only references)
CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'gdrive' CHECK (source IN ('gdrive')),
  drive_file_id text NOT NULL,
  filename text,
  mime_type text,
  byte_size bigint,
  width int,
  height int,
  duration_seconds int,
  exif jsonb,
  ai_tags jsonb DEFAULT '[]'::jsonb,
  ai_people jsonb DEFAULT '[]'::jsonb,
  caption text,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- SHARES (for restricted shares by email)
CREATE TABLE public.album_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email text NOT NULL,
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view','contribute','edit')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(album_id, invitee_email)
);

-- PUBLIC LINKS (for public / expiring links)
CREATE TABLE public.public_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  public_id text NOT NULL UNIQUE,
  expires_at timestamptz,
  allow_downloads boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- AUDIT LOGS (optional)
CREATE TABLE public.audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text NOT NULL,
  meta jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.public_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- profiles: user owns their row
CREATE POLICY "profiles_owner_rw"
ON public.profiles FOR ALL
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- oauth_connections: owner only
CREATE POLICY "oauth_owner_rw"
ON public.oauth_connections FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- albums: owner RW
CREATE POLICY "albums_owner_rw"
ON public.albums FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- albums: shared read access
CREATE POLICY "albums_shared_read"
ON public.albums FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
     SELECT 1 FROM public.album_shares s
     WHERE s.album_id = albums.id
       AND (lower(s.invitee_email) = lower(auth.jwt()->>'email'))
  )
  OR EXISTS (
     SELECT 1 FROM public.public_links pl
     WHERE pl.album_id = albums.id
       AND (pl.expires_at IS NULL OR pl.expires_at > now())
  )
);

-- media: readable if album readable
CREATE POLICY "media_read_if_album_read"
ON public.media FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.albums a WHERE a.id = media.album_id
    AND (
      a.user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.album_shares s WHERE s.album_id = a.id
                 AND (lower(s.invitee_email) = lower(auth.jwt()->>'email')))
      OR EXISTS (SELECT 1 FROM public.public_links pl WHERE pl.album_id = a.id
                 AND (pl.expires_at IS NULL OR pl.expires_at > now()))
    )
  )
);

-- media: write access for owners and contributors
CREATE POLICY "media_write_owner_or_contrib"
ON public.media FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.albums a WHERE a.id = album_id
    AND (
      a.user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.album_shares s WHERE s.album_id = a.id
                 AND s.permission IN ('contribute','edit')
                 AND (lower(s.invitee_email) = lower(auth.jwt()->>'email')))
    )
  )
);

CREATE POLICY "media_update_delete_owner_or_editor"
ON public.media FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.albums a WHERE a.id = media.album_id
    AND (
      a.user_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.album_shares s WHERE s.album_id = a.id
                 AND s.permission = 'edit'
                 AND (lower(s.invitee_email) = lower(auth.jwt()->>'email')))
    )
  )
);

-- shares: only owner can manage
CREATE POLICY "shares_owner_rw"
ON public.album_shares FOR ALL
USING (
  EXISTS(SELECT 1 FROM public.albums a WHERE a.id = album_id AND a.user_id = auth.uid())
)
WITH CHECK (
  EXISTS(SELECT 1 FROM public.albums a WHERE a.id = album_id AND a.user_id = auth.uid())
);

-- public_links: only owner can manage
CREATE POLICY "public_links_owner_rw"
ON public.public_links FOR ALL
USING (
  EXISTS(SELECT 1 FROM public.albums a WHERE a.id = album_id AND a.user_id = auth.uid())
)
WITH CHECK (
  EXISTS(SELECT 1 FROM public.albums a WHERE a.id = album_id AND a.user_id = auth.uid())
);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_oauth_connections_updated_at
  BEFORE UPDATE ON public.oauth_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
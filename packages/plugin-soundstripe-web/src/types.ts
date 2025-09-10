export interface SoundstripeArtist {
  id: string;
  type: 'artists';
  attributes: {
    name: string;
    image?: string;
  };
}

export interface SoundstripeAudioFile {
  id: string;
  type: 'audio_files';
  attributes: {
    duration: number;
    versions?: {
      mp3?: string;
      wav?: string;
    };
  };
}

export interface SoundstripeSong {
  id: string;
  type: 'songs';
  attributes: {
    title: string;
    description?: string;
  };
  relationships: {
    artists: {
      data: Array<{ id: string; type: 'artists' }>;
    };
    audio_files: {
      data: Array<{ id: string; type: 'audio_files' }>;
    };
  };
}

export interface SoundstripeApiResponse {
  data: SoundstripeSong[];
  included: Array<SoundstripeArtist | SoundstripeAudioFile>;
  links: {
    meta: {
      total_count: number;
    };
  };
}

export interface SoundstripeSingleAssetResponse {
  data: SoundstripeSong;
  included: Array<SoundstripeArtist | SoundstripeAudioFile>;
}

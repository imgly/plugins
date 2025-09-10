import {
  AssetQueryData,
  AssetResult,
  AssetsQueryResult,
  AssetSource,
  CreativeEngine
} from '@cesdk/cesdk-js';
import {
  SoundstripeApiResponse,
  SoundstripeSong,
  SoundstripeArtist,
  SoundstripeAudioFile
} from './types';

const EMPTY_RESULT: AssetsQueryResult = {
  assets: [],
  currentPage: 1,
  nextPage: undefined,
  total: 0
};

interface SoundstripeSourceConfig {
  apiKey?: string;
  baseUrl?: string;
}

function createSoundstripeSource(
  engine: CreativeEngine,
  config: SoundstripeSourceConfig
): AssetSource {
  const { apiKey, baseUrl } = config;
  const fetchSoundstripeAssets = async (
    query?: string,
    page?: number,
    perPage?: number
  ): Promise<SoundstripeApiResponse> => {
    const apiBaseUrl = baseUrl || 'https://api.soundstripe.com';
    const url = new URL(`${apiBaseUrl}/v1/songs`);

    if (query) url.searchParams.set('filter[q]', query);
    if (page) url.searchParams.set('page[number]', page.toString());
    if (perPage) url.searchParams.set('page[size]', perPage.toString());

    const headers: Record<string, string> = {
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json'
    };

    // Only add Authorization header if apiKey is provided (not needed for proxy)
    if (apiKey) {
      console.warn(
        'Using direct Soundstripe API access, this is not recommended for production use. Instead, consider using a proxy server.'
      );
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      throw new Error(
        `Soundstripe API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  };

  const formatAsset = (
    audio: SoundstripeSong,
    relationships: Array<SoundstripeArtist | SoundstripeAudioFile>
  ): AssetResult | undefined => {
    const audioFile = relationships.find(
      (item): item is SoundstripeAudioFile =>
        item.type === 'audio_files' &&
        item.id === audio.relationships.audio_files.data[0]?.id
    );

    if (!audioFile?.attributes.versions?.mp3) {
      return undefined;
    }

    const firstAuthor = relationships.find(
      (item): item is SoundstripeArtist =>
        item.type === 'artists' &&
        item.id === audio.relationships.artists.data[0]?.id
    );

    return {
      id: audio.id,
      label: audio.attributes.title,
      meta: {
        mimeType: 'audio/mp3',
        uri: audioFile.attributes.versions.mp3,
        thumbUri: firstAuthor?.attributes?.image,
        previewUri: audioFile.attributes.versions.mp3,
        filename: audio.attributes.title,
        blockType: '//ly.img.ubq/audio',
        duration: audioFile.attributes.duration.toString()
      },
      credits: firstAuthor?.attributes?.name
        ? {
            name: firstAuthor.attributes.name
          }
        : undefined
    };
  };

  const calculateNextPage = (
    page: number,
    pageSize: number,
    resultCount: number
  ) => {
    const hasNextPage = page < Math.ceil(resultCount / pageSize);
    return hasNextPage ? page + 1 : undefined;
  };

  const SoundstripeSource: AssetSource = {
    id: 'ly.img.audio.soundstripe',
    credits: {
      name: 'Soundstripe',
      url: 'https://soundstripe.com/'
    },
    license: {
      name: 'Soundstripe',
      url: 'https://www.soundstripe.com/music-licensing'
    },
    applyAsset: async (assetResult) => {
      const blockId = await engine.asset.defaultApplyAsset(assetResult);
      if (!blockId) return;
      engine.block.setMetadata(
        blockId,
        'ly.img.audio.soundstripe.songId',
        assetResult.id
      );
      return blockId;
    },
    applyAssetToBlock: async (assetResult, blockId) => {
      await engine.asset.defaultApplyAssetToBlock(assetResult, blockId);
      engine.block.setMetadata(
        blockId,
        'ly.img.audio.soundstripe.songId',
        assetResult.id
      );
    },
    async findAssets(queryData: AssetQueryData): Promise<AssetsQueryResult> {
      try {
        const response = await fetchSoundstripeAssets(
          queryData.query,
          queryData.page,
          queryData.perPage
        );

        const assets = response.data
          .map((song) => formatAsset(song, response.included))
          .filter((asset): asset is AssetResult => asset !== undefined);

        const result = {
          assets,
          currentPage: queryData.page,
          nextPage: calculateNextPage(
            queryData.page,
            queryData.perPage,
            response.links.meta.total_count
          ),
          total: response.links.meta.total_count
        };

        return result;
      } catch (error) {
        return EMPTY_RESULT;
      }
    }
  };

  return SoundstripeSource;
}

export default createSoundstripeSource;

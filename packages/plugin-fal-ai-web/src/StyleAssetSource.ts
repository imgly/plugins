import { type AssetSource } from '@cesdk/cesdk-js';
import { getStyleThumbnail } from './styles';

export const BACK_ASSET = {
  id: 'back',
  label: 'Back',
  meta: {
    thumbUri: 'https://ubique.img.ly/static/image-generation/back.png'
  }
} as const;

class StyleAssetSource implements AssetSource {
  id: string;

  styles: { id: string; label: string }[];

  activeId: string | undefined;

  constructor(id: string, styles: { id: string; label: string }[]) {
    this.id = id;
    this.styles = styles;
  }

  findAssets() {
    const assets = this.styles.map(({ id, label }) => {
      return {
        id,
        label,
        active: this.activeId === id,
        meta: { thumbUri: getStyleThumbnail(id) }
      };
    });
    return Promise.resolve({
      assets: [
        // BACK_ASSET,
        ...assets
      ],
      total: assets.length,
      nextPage: undefined,
      currentPage: 0
    });
  }

  setActive(id: string) {
    this.activeId = id;
  }
}

export default StyleAssetSource;

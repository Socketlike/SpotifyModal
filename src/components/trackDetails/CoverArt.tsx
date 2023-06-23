import { common } from 'replugged';
import { config } from '@utils';

const { React } = common;

export default (props: Spotify.Track): JSX.Element => (
  <img
    className='cover-art'
    src={typeof props?.album?.images?.[0]?.url === 'string' ? props.album.images[0].url : undefined}
    onClick={(): void => {
      if (typeof props?.album?.id === 'string' && config.get('hyperlinkAlbumEnabled'))
        window.open(
          config.get('hyperlinkURI')
            ? `spotify:album:${props.album.id}`
            : `https://open.spotify.com/album/${props.album.id}`,
          '_blank',
        );
    }}
    onContextMenu={(e: React.MouseEvent): void => {
      e.stopPropagation();

      if (config.get('copyingAlbumURLEnabled') && typeof props.album?.id === 'string') {
        DiscordNative.clipboard.copy(`https://open.spotify.com/album/${props.album.id}`);
        common.toast.toast('Copied album URL to clipboard', 1);
      }
    }}
    title={typeof props?.album?.images?.[0]?.url === 'string' ? props.album.name : undefined}
  />
);

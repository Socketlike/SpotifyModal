import { common, components } from 'replugged';
import { config } from '@config';

const { React } = common;
const { Tooltip } = components;

export default (props: SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull): JSX.Element => {
  const containerType = props.type === 'track' ? 'album' : 'show';
  const image = props.type === 'track' ? props.album.images[0]?.url : props.show.images[0]?.url;
  const name = props.type === 'track' ? props.album.name : props.show.name;
  const { id: containerId } = (props.type === 'track' ? props.album : props.show) || {};

  return (
    <Tooltip className={image ? '' : 'hidden'} text={name}>
      <img
        className='cover-art'
        src={image}
        onClick={(): void => {
          if (typeof containerId === 'string')
            window.open(
              config.get('hyperlinkURI')
                ? `spotify:${containerType}:${containerId}`
                : `https://open.spotify.com/${containerType}/${containerId}`,
              '_blank',
            );
        }}
        onContextMenu={(e: React.MouseEvent): void => {
          e.stopPropagation();

          if (typeof containerId === 'string') {
            window.DiscordNative.clipboard.copy(
              `https://open.spotify.com/${containerType}/${containerId}`,
            );
            common.toast.toast(`Copied ${containerType} URL to clipboard`, 1);
          }
        }}
      />
    </Tooltip>
  );
};

import { common } from 'replugged';
import { config, overflowMitigation, toClassString } from '@?utils';

const { React } = common;

export default (props: { track: Spotify.Track }): JSX.Element => {
  const elementRef = React.useRef<HTMLAnchorElement>(null);

  React.useEffect((): void => overflowMitigation(elementRef.current));

  return (
    <a
      className={toClassString('title', typeof props.track.id === 'string' ? 'href' : '')}
      ref={elementRef}
      onClick={(e: React.MouseEvent): void => {
        e.preventDefault();
        e.stopPropagation();

        if (typeof props.track.id === 'string' && config.get('hyperlinkTrackEnabled'))
          window.open(
            config.get('hyperlinkURI')
              ? `spotify:track:${props.track.id}`
              : `https://open.spotify.com/track/${props.track.id}`,
            '_blank',
          );
      }}
      onContextMenu={(e: React.MouseEvent) => {
        e.stopPropagation();

        if (config.get('copyingTrackURLEnabled') && typeof props.track.id === 'string') {
          DiscordNative.clipboard.copy(`https://open.spotify.com/track/${props.track.id}`);
          common.toast.toast('Copied track URL to clipboard', 1);
        }
      }}
      title={props.track.name}>
      {props.track.name}
    </a>
  );
};

import { common } from 'replugged';
import { config, overflowMitigation } from '@?utils';

const { React } = common;

export const Artist = (props: Spotify.User & { last: boolean }): JSX.Element => (
  <>
    {typeof props.id === 'string' ? (
      <a
        className='artist'
        onContextMenu={(e: React.MouseEvent): void => {
          e.stopPropagation();

          if (config.get('copyingArtistURLEnabled')) {
            DiscordNative.clipboard.copy(`https://open.spotify.com/artist/${props.id}`);

            common.toast.toast('Copied artist URL to clipboard', 1);
          }
        }}
        onClick={(e: React.MouseEvent): void => {
          e.preventDefault();

          if (config.get('hyperlinkArtistEnabled'))
            window.open(
              config.get('hyperlinkURI')
                ? `spotify:artist:${props.id}`
                : `https://open.spotify.com/artist/${props.id}`,
              'blank_',
            );
        }}
        title={props.name}>
        {props.name}
      </a>
    ) : (
      props.name
    )}
    {!props.last ? ', ' : ''}
  </>
);

export default (props: { artists: Spotify.User[] }): JSX.Element => {
  const elementRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect((): void => overflowMitigation(elementRef.current));

  return (
    <span className='artists' ref={elementRef}>
      {Array.isArray(props.artists)
        ? props.artists.map(
            (artist: Spotify.User, index: number): React.ReactElement => (
              <Artist {...artist} last={index === props.artists.length - 1} />
            ),
          )
        : 'None'}
    </span>
  );
};

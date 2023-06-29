import { common } from 'replugged';
import { config } from '@config';
import { overflowMitigation } from '@util';

const { React } = common;

declare const DiscordNative: {
  clipboard: {
    copy: (content: string) => void;
  };
};

export const Artist = (
  props: SpotifyApi.ArtistObjectSimplified & { last: boolean },
): JSX.Element => (
  <>
    {typeof props.id === 'string' ? (
      <a
        className='artist'
        onContextMenu={(e: React.MouseEvent): void => {
          e.stopPropagation();

          DiscordNative.clipboard.copy(`https://open.spotify.com/artist/${props.id}`);

          common.toast.toast('Copied artist URL to clipboard', 1);
        }}
        onClick={(e: React.MouseEvent): void => {
          e.preventDefault();

          window.open(
            config.get('hyperlinkURI')
              ? `spotify:artist:${props.id}`
              : `https://open.spotify.com/artist/${props.id}`,
            'blank_',
          );
        }}>
        {props.name}
      </a>
    ) : (
      props.name
    )}
    {!props.last ? ', ' : ''}
  </>
);

export default (props: SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull): JSX.Element => {
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const node =
    props.type === 'track'
      ? Array.isArray(props.artists)
        ? props.artists.map(
            (artist: SpotifyApi.ArtistObjectSimplified, index: number): JSX.Element => (
              <Artist {...artist} last={index === props.artists.length - 1} />
            ),
          )
        : 'None'
      : props.show.publisher;

  React.useEffect((): void => overflowMitigation(elementRef.current));

  return (
    <span className='artists' ref={elementRef}>
      {node}
    </span>
  );
};

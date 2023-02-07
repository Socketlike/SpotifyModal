import { common } from 'replugged';
import { SpotifyTrack, SpotifyUser, TrackInfoContextInterface } from '../types';
import { CSSProperties } from '@types/react';
import { config } from './global';
const { React } = common;

export const TrackInfoContext = React.createContext<TrackInfoContextInterface>({
  artistRightClick: (): boolean => false,
  coverArtRightClick: (): boolean => false,
  titleRightClick: (): boolean => false,
  track: {
    album: {
      name: 'None',
      images: [{}],
    },
    artists: [
      {
        name: 'None',
      },
    ],
    name: 'None',
  } as SpotifyTrack,
});

function Artists(props: {
  artists: SpotifyUser[];
  onRightClick: (name: string, id?: string) => void;
}): JSX.Element {
  const elementRef = React.useRef<HTMLSpanElement>(null);
  let overflow = 0;

  if (elementRef.current && elementRef.current.scrollWidth > elementRef.current.offsetWidth + 10)
    overflow = elementRef.current.scrollWidth - elementRef.current.offsetWidth;

  return (
    <span
      className={`artists${overflow ? ' overflow' : ''}`}
      ref={elementRef}
      style={
        (overflow
          ? {
              ['--scroll-space']: `-${overflow}px`,
              ['--animation-duration']: `${overflow * 50}ms`,
            }
          : {}) as CSSProperties
      }>
      {Array.isArray(props.artists)
        ? props.artists.map((artist: SpotifyUser, index: number): React.ReactElement => {
            if (typeof artist.id === 'string')
              return (
                <>
                  <a
                    className='artist'
                    onContextMenu={() => props.onRightClick(artist.name, artist.id)}
                    onClick={(e: React.MouseEvent): void => {
                      e.preventDefault();
                      if (config.get('hyperlinkArtistEnabled', true))
                        window.open(
                          config.get('hyperlinkURI', true)
                            ? `spotify:artist:${artist.id}`
                            : `https://open.spotify.com/artist/${artist.id}`,
                          'blank_',
                        );
                    }}
                    title={artist.name}>
                    {artist.name}
                  </a>
                  {index !== props.artists.length - 1 ? ', ' : ''}
                </>
              );
            return (
              <>
                {artist.name}
                {index !== props.artists.length - 1 ? ', ' : ''}
              </>
            );
          })
        : 'None'}
    </span>
  );
}

function Title(props: {
  track: SpotifyTrack;
  onRightClick: (name: string, id?: string) => void;
}): JSX.Element {
  const elementRef = React.useRef<HTMLAnchorElement>(null);
  let overflow = 0;

  if (elementRef.current && elementRef.current.scrollWidth > elementRef.current.offsetWidth + 10)
    overflow = elementRef.current.scrollWidth - elementRef.current.offsetWidth;

  return (
    <a
      className={`title${overflow ? ' overflow' : ''}${
        typeof props.track.id === 'string' ? ' href' : ''
      }`}
      ref={elementRef}
      style={
        (overflow
          ? {
              ['--scroll-space']: `-${overflow}px`,
              ['--animation-duration']: `${overflow * 50}ms`,
            }
          : {}) as CSSProperties
      }
      onClick={(e: React.MouseEvent): void => {
        e.preventDefault();
        if (typeof props.track.id === 'string' && config.get('hyperlinkTrackEnabled', true))
          window.open(
            config.get('hyperlinkURI', true)
              ? `spotify:track:${props.track.id}`
              : `https://open.spotify.com/track/${props.track.id}`,
            '_blank',
          );
      }}
      onContextMenu={() => props.onRightClick(props.track.name, props.track?.id)}
      title={props.track.name}>
      {props.track.name}
    </a>
  );
}

export function TrackInfo(): JSX.Element {
  const context = React.useContext<TrackInfoContextInterface>(TrackInfoContext);

  return (
    <div className='header'>
      <img
        className='cover-art'
        src={
          typeof context?.track?.album?.images?.[0]?.url === 'string'
            ? context.track.album.images[0].url
            : ''
        }
        onClick={(): void => {
          if (
            typeof context.track?.album?.id === 'string' &&
            config.get('hyperlinkAlbumEnabled', true)
          )
            window.open(
              config.get('hyperlinkURI', true)
                ? `spotify:album:${context.track.album.id}`
                : `https://open.spotify.com/album/${context.track.album.id}`,
              '_blank',
            );
        }}
        onContextMenu={(): boolean =>
          context.coverArtRightClick(context.track.album.name, context.track?.album?.id)
        }
        title={context.track.album.name}
      />
      <div className='track-info'>
        <Title track={context.track} onRightClick={context.titleRightClick} />
        <Artists artists={context.track.artists} onRightClick={context.artistRightClick} />
      </div>
    </div>
  );
}

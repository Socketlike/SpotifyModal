import { common } from 'replugged';
import { ModalDispatchers, SpotifyTrack, SpotifyUser } from '../types';
import { config } from './global';
const { React } = common;

function Artists(props: {
  artists: SpotifyUser[];
  onRightClick: (name: string, id?: string) => void;
}): JSX.Element {
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const overflowCheck = React.useCallback((): void => {
    if (
      elementRef.current &&
      elementRef.current.scrollWidth > elementRef.current.offsetWidth + 10
    ) {
      elementRef.current.style.setProperty(
        '--scroll-space',
        `-${(elementRef.current.scrollWidth - elementRef.current.offsetWidth).toString()}px`,
      );
      elementRef.current.style.setProperty(
        '--animation-duration',
        `${((elementRef.current.scrollWidth - elementRef.current.offsetWidth) * 50).toString()}ms`,
      );
      if (!elementRef.current.classList.contains('overflow'))
        elementRef.current.classList.add('overflow');
    } else if (
      elementRef.current &&
      elementRef.current.scrollWidth <= elementRef.current.offsetWidth + 10
    )
      if (elementRef.current.classList.contains('overflow'))
        elementRef.current.classList.remove('overflow');
  }, []);

  React.useEffect(overflowCheck);
  React.useEffect(overflowCheck, [elementRef.current]);

  return (
    <span className='artists' ref={elementRef}>
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
  const overflowCheck = React.useCallback((): void => {
    if (
      elementRef.current &&
      elementRef.current.scrollWidth > elementRef.current.offsetWidth + 10
    ) {
      elementRef.current.style.setProperty(
        '--scroll-space',
        `-${(elementRef.current.scrollWidth - elementRef.current.offsetWidth).toString()}px`,
      );
      elementRef.current.style.setProperty(
        '--animation-duration',
        `${((elementRef.current.scrollWidth - elementRef.current.offsetWidth) * 50).toString()}ms`,
      );
      if (!elementRef.current.classList.contains('overflow'))
        elementRef.current.classList.add('overflow');
    } else if (
      elementRef.current &&
      elementRef.current.scrollWidth <= elementRef.current.offsetWidth + 10
    )
      if (elementRef.current.classList.contains('overflow'))
        elementRef.current.classList.remove('overflow');
  }, []);

  React.useEffect(overflowCheck);
  React.useEffect(overflowCheck, [elementRef.current]);

  return (
    <a
      className={`title${typeof props.track.id === 'string' ? ' href' : ''}`}
      ref={elementRef}
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

export function TrackInfo(props: {
  dispatchers: ModalDispatchers;
  track: SpotifyTrack;
}): JSX.Element {
  return (
    <div className='header'>
      <img
        className='cover-art'
        src={
          typeof props?.track?.album?.images?.[0]?.url === 'string'
            ? props.track.album.images[0].url
            : ''
        }
        onClick={(): void => {
          if (
            typeof props.track?.album?.id === 'string' &&
            config.get('hyperlinkAlbumEnabled', true)
          )
            window.open(
              config.get('hyperlinkURI', true)
                ? `spotify:album:${props.track.album.id}`
                : `https://open.spotify.com/album/${props.track.album.id}`,
              '_blank',
            );
        }}
        onContextMenu={(): boolean =>
          props.dispatchers.coverArtRightClick(props.track.album.name, props.track?.album?.id)
        }
        title={props.track.album.name}
      />
      <div className='track-info'>
        <Title track={props.track} onRightClick={props.dispatchers.titleRightClick} />
        <Artists artists={props.track.artists} onRightClick={props.dispatchers.artistRightClick} />
      </div>
    </div>
  );
}

import { common } from 'replugged';
import { ModalDispatchers, SpotifyTrack, SpotifyUser } from '../types';
import { componentEventTarget, config } from './global';

const { React } = common;

function Artists(props: { artists: SpotifyUser[] }): JSX.Element {
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
                    onContextMenu={(): boolean =>
                      componentEventTarget.dispatchEvent(
                        new CustomEvent('artistRightClick', {
                          detail: { name: artist.name, id: artist.id },
                        }),
                      )
                    }
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

function Title(props: { track: SpotifyTrack }): JSX.Element {
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
      onContextMenu={(): boolean =>
        componentEventTarget.dispatchEvent(
          new CustomEvent('titleRightClick', {
            detail: {
              name: props.track.name,
              id: props.track.id,
            },
          }),
        )
      }
      title={props.track.name}>
      {props.track.name}
    </a>
  );
}

export function TrackInfo(props: { track: SpotifyTrack }): JSX.Element {
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
          componentEventTarget.dispatchEvent(
            new CustomEvent('coverArtRightClick', {
              detail: {
                name: props.track.album.name,
                id: props.track?.album?.id,
              },
            }),
          )
        }
        title={props.track.album.name}
      />
      <div className='track-info'>
        <Title track={props.track} />
        <Artists artists={props.track.artists} />
      </div>
    </div>
  );
}

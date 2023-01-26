import { common, components } from 'replugged';
import { SpotifyTrack, SpotifyUser } from '../types';
import { componentEventTarget } from './global';
const { React } = common;

export const TrackInfoContext = React.createContext<SpotifyTrack>({
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
} as SpotifyTrack);

function Artists(props: { artists: SpotifyUser[] }): JSX.Element {
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const [isOverflow, setIsOverflow] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!elementRef?.current) return;
    if (
      (elementRef.current as HTMLSpanElement).scrollWidth >=
      (elementRef.current as HTMLSpanElement).offsetWidth + 10
    )
      setIsOverflow(true);
  }, [elementRef]);

  return (
    <span className={`artists${isOverflow ? ' overflow' : ''}`}>
      {Array.isArray(props.artists)
        ? props.artists.map((artist: SpotifyUser, index: number): ReactFragment => {
            if (typeof artist.id === 'string')
              return (
                <>
                  <a
                    className='artist'
                    onContextMenu={(event: React.MouseEvent): void =>
                      componentEventTarget.dispatchEvent(
                        new CustomEvent('artistRightClick', { detail: { event, artist } }),
                      )
                    }
                    href={`https://open.spotify.com/artist/${artist.id}`}
                    target='_blank'
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
  const elementRef = React.useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = React.useState<{ isOverflow: boolean; overflownSpace: number }>({
    isOverflow: false,
    overflownSpace: 0,
  });

  React.useEffect(() => {
    if (!elementRef?.current) return;
    if (
      (elementRef.current as HTMLSpanElement).scrollWidth >=
      (elementRef.current as HTMLSpanElement).offsetWidth + 10
    )
      setOverflow({
        isOverflow: true,
        overflownSpace:
          (elementRef.current as HTMLSpanElement).scrollWidth -
          (elementRef.current as HTMLSpanElement).offsetWidth,
      });
  }, [elementRef]);

  return (
    <a
      className={`title${overflow.isOverflow ? ' overflow' : ''}${
        typeof props.track.id === 'string' ? ' href' : ''
      }`}
      href={
        typeof props.track.id === 'string' ? `https://open.spotify.com/track/${props.track.id}` : ''
      }
      style={
        overflow.isOverflow
          ? { ['--overflownSpace' as string]: `-${overflow.overflownSpace}px` }
          : {}
      }
      target='_blank'
      title={props.track.name}>
      {props.track.name}
    </a>
  );
}

export function TrackInfo(): JSX.Element {
  const context = React.useContext<SpotifyTrack>(TrackInfoContext);

  return (
    <div className='header'>
      <img
        className='cover-art'
        src={
          typeof context?.album?.images?.[0]?.url === 'string' ? context.album.images[0].url : ''
        }
        title={context.album.name}
      />
      <div className='track-info'>
        <Title track={context} />
        <Artists artists={context.artists} />
      </div>
    </div>
  );
}

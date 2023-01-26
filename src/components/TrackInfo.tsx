import { common, components } from 'replugged';
import { SpotifyTrack, SpotifyUser } from '../types';
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

function Artists(props: {
  artists: SpotifyUser[];
  onRightClick: (name: string, id?: string) => void;
}): JSX.Element {
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
                    onContextMenu={() => props.onRightClick(artist.name, artist.id)}
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

function Title(props: { track: SpotifyTrack; onRightClick: (url?: string) => void }): JSX.Element {
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
      onContextMenu={() => props.onRightClick(props.track.name, props.track?.id)}
      target='_blank'
      title={props.track.name}>
      {props.track.name}
    </a>
  );
}

export function TrackInfo(): JSX.Element {
  const context = React.useContext<{
    track: SpotifyTrack;
    titleRightClick: (name: string, id?: string) => void;
    artistRightClick: (name: string, id?: string) => void;
  }>(TrackInfoContext);

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
          if (typeof context.track?.album?.id === 'string')
            window.open(`https://open.spotify.com/album/${context.track.album.id}`);
        }}
        onContextMenu={(): void =>
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

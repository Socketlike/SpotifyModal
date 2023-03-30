import { common, components } from 'replugged';
import { config, listenToEvent } from '../global';

const { React } = common;
const {
  Modal: { ModalContent, ModalFooter, ModalHeader, ModalRoot },
  Text,
} = components;

export function TrackPopoutModal(props: {
  modalProps: RepluggedMissingComponentsType.ModalProps;
  trackData: Spotify.Track;
}): JSX.Element {
  const [track, setTrack] = React.useState<Spotify.Track>(props.trackData);

  React.useEffect((): (() => void) =>
    listenToEvent<Spotify.State>('stateUpdate', (ev) => setTrack(ev.detail.item)),
  );

  return (
    <ModalRoot {...props.modalProps}>
      <ModalHeader>
        <Text.H1>{track.name}</Text.H1>
      </ModalHeader>
      <ModalContent>
        <Text>
          by{' '}
          {track.artists.map(
            (artist, index): JSX.Element => (
              <>
                {artist.id ? (
                  <a
                    href={
                      config.get('hyperlinkURI')
                        ? `spotify:artist:${artist.id}`
                        : `https://open.spotify.com/artist/${artist.id}`
                    }
                    target='_blank'>
                    {artist.name}
                  </a>
                ) : (
                  artist.name
                )}
                {index < track.artists.length - 1 ? ', ' : ''}
              </>
            ),
          )}
        </Text>
      </ModalContent>
    </ModalRoot>
  );
}

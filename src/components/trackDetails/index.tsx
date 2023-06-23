import { common } from 'replugged';

import { default as Artists, Artist } from '@components/trackDetails/Artists';
import { default as Title } from '@components/trackDetails/Title';
import { default as CoverArt } from '@components/trackDetails/CoverArt';

const { React } = common;

export default (props: { track: Spotify.Track }): JSX.Element => {
  return (
    <div className='header'>
      <CoverArt {...props?.track} />
      <div className='track-info'>
        <Title track={props.track} />
        <Artists artists={props.track.artists} />
      </div>
    </div>
  );
};

export { Artists, Artist, CoverArt, Title };

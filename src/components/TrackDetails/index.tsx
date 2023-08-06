import { common } from 'replugged';

import { Artist, default as Artists } from './Artists';
import { default as Title } from './Title';
import { default as CoverArt } from './CoverArt';

const { React } = common;

export default (props: SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull): JSX.Element => {
  return (
    <div className='track-details'>
      <CoverArt {...props} />
      <div className='title-artists'>
        <Title {...props} />
        <Artists {...props} />
      </div>
    </div>
  );
};

export { Artists, Artist, CoverArt, Title };

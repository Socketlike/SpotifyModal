import { common, components, util } from 'replugged';
import { config, componentEventTarget } from './global';

const { React } = common;
const { Category, SelectItem, Slider, SwitchItem, Text, TextInput } = components;

export function InputTextWrapper(props: {
  children: ReactFragment;
  title: string;
  note: string;
}): JSX.Element {
  return (
    <div>
      <Text variant='eyebrow' tag='div' color='text-normal' style={{ marginBottom: '8px' }}>
        {props.title}
      </Text>
      {props.children}
      <Text
        variant='text-sm/normal'
        tag='div'
        color='header-secondary'
        style={{ marginTop: '8px', marginBottom: '8px' }}>
        {props.note}
      </Text>
    </div>
  );
}

export function Settings(): JSX.Element {
  const [controlVisiblityState, setControlVisibilityState] = React.useState<number>(
    config.get('controlsVisibilityState', 0),
  );
  const [progressDisplayVisibilityState, setProgressDisplayVisibilityState] =
    React.useState<number>(config.get('progressDisplayVisibilityState', 0));
  const [seekbarVisibilityState, setSeekbarVisibiityState] = React.useState<number>(
    config.get('seekbarVisibilityState', 2),
  );
  const [skipPreviousResetProgressPercentage, setSkipPreviousResetProgressPercentage] =
    React.useState<number>(config.get('skipPreviousResetProgressDuration', 0.15));

  return (
    <div>
      <Category title='Visibilty' note="Control certain components' visibility">
        <SelectItem
          note="Changes the control section's visibility"
          options={[
            { label: 'Shown', value: 2 },
            { label: 'Hidden', value: 1 },
            { label: 'Only shown on hover', value: 0 },
          ]}
          value={controlVisiblityState}
          onChange={(newValue: number): void => {
            if (config.get('controlsVisibilityState', 0) === newValue) return;
            config.set('controlsVisibilityState', newValue);
            componentEventTarget.dispatchEvent(
              new CustomEvent('componentVisibilityUpdate', {
                detail: {
                  type: 'controlVisibilityState',
                  state: newValue,
                },
              }),
            );
            setControlVisibilityState(newValue);
          }}>
          Controls section
        </SelectItem>
        <SelectItem
          note="Changes the progress display's visibility"
          options={[
            { label: 'Shown', value: 2 },
            { label: 'Hidden', value: 1 },
            { label: 'Only shown on hover', value: 0 },
          ]}
          value={progressDisplayVisibilityState}
          onChange={(newValue: number): void => {
            if (config.get('progressDisplayVisibilityState', 0) === newValue) return;
            config.set('progressDisplayVisibilityState', newValue);
            componentEventTarget.dispatchEvent(
              new CustomEvent('componentVisibilityUpdate', {
                detail: {
                  type: 'progressDisplayVisibilityState',
                  state: newValue,
                },
              }),
            );
            setProgressDisplayVisibilityState(newValue);
          }}>
          Progress display
        </SelectItem>
        <SelectItem
          note="Changes the seekbar's visibility"
          options={[
            { label: 'Shown', value: 2 },
            { label: 'Hidden', value: 1 },
            { label: 'Only shown on hover', value: 0 },
          ]}
          value={seekbarVisibilityState}
          onChange={(newValue: number): void => {
            if (config.get('seekbarVisibilityState', 2) === newValue) return;
            config.set('seekbarVisibilityState', newValue);
            componentEventTarget.dispatchEvent(
              new CustomEvent('componentVisibilityUpdate', {
                detail: {
                  type: 'seekbarVisibilityState',
                  state: newValue,
                },
              }),
            );
            setSeekbarVisibilityState(newValue);
          }}>
          Seekbar
        </SelectItem>
      </Category>
      <div className='categoryMargin'>
        <Category title='Copying' note='Controls right click copying of album / artist / track URL'>
          <SwitchItem
            note='Enable copying of artist URL'
            {...util.useSetting(config, 'copyingArtistURLEnabled', true)}>
            Artist
          </SwitchItem>
          <SwitchItem
            note='Enable copying of album URL'
            {...util.useSetting(config, 'copyingAlbumURLEnabled', true)}>
            Album
          </SwitchItem>
          <SwitchItem
            note='Enable copying of track URL'
            {...util.useSetting(config, 'copyingTrackURLEnabled', true)}>
            Track
          </SwitchItem>
        </Category>
      </div>
      <div className='categoryMargin'>
        <Category title='Hyperlinks' note='Controls album / artist / track hyperlinks'>
          <SwitchItem
            note='Enable artist hyperlinks'
            {...util.useSetting(config, 'hyperlinkArtistEnabled', true)}>
            Artists
          </SwitchItem>
          <SwitchItem
            note='Enable album hyperlinks'
            {...util.useSetting(config, 'hyperlinkAlbumEnabled', true)}>
            Album
          </SwitchItem>
          <SwitchItem
            note='Enable track hyperlinks'
            {...util.useSetting(config, 'hyperlinkTrackEnabled', true)}>
            Track
          </SwitchItem>
          <SwitchItem
            note='Use Spotify URIs (open directly in Spotify) instead of normal links'
            {...util.useSetting(config, 'hyperlinkURI', true)}>
            Use Spotify URI
          </SwitchItem>
        </Category>
      </div>
      <div className='categoryMargin'>
        <Category title='Controls' note='Control your controls. Over the Revolution!'>
          <SwitchItem
            note='Reauthenticate Spotify access token & retry automatically on control failure (Highly experimental)'
            {...util.useSetting(config, 'automaticReauthentication', false)}>
            Reauthenticate & retry automatically on failure
          </SwitchItem>
          <SwitchItem
            note='Enable seeking by tapping on the seekbar'
            {...util.useSetting(config, 'seekbarEnabled', true)}>
            Enable track seeking
          </SwitchItem>
          <SwitchItem
            note='Make the skip previous control reset your track playback progress when it is past a percentage of the track'
            {...util.useSetting(config, 'skipPreviousShouldResetProgress', true)}>
            Skip previous should reset progress
          </SwitchItem>
          <InputTextWrapper
            title='Skip previous reset progress duration'
            note='The percentage of the track duration to ignore playback progress reset on clicking skip previous.'>
            <Slider
              disabled={!config.get('skipPreviousShouldResetProgress', true)}
              minValue={0}
              maxValue={1}
              value={skipPreviousResetProgressPercentage}
              onChange={(newValue: number): number => {
                if (config.get('skipPreviousResetProgressDuration', 0.15) === newValue) return;
                config.set('skipPreviousResetProgressDuration', newValue);
                setSkipPreviousResetProgressPercentage(newValue);
              }}
            />
          </InputTextWrapper>
        </Category>
      </div>
    </div>
  );
}

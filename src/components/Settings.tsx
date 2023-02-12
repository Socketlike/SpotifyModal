import { components, util } from 'replugged';
import { config, componentEventTarget } from './global';

const { Category, FormItem, SelectItem, Slider, SwitchItem, Text } = components;

export function Settings(): JSX.Element {
  const { value: controlsVisiblityState, onChange: onControlsVisibilityChange } = util.useSetting(
    config,
    'controlsVisibilityState',
    'auto',
  );
  const { value: progressDisplayVisibilityState, onChange: onProgressDisplayVisibilityChange } =
    util.useSetting(config, 'progressDisplayVisibilityState', 'auto');
  const { value: seekbarVisibilityState, onChange: onSeekbarVisibiltyChange } = util.useSetting(
    config,
    'seekbarVisibilityState',
    'always',
  );

  return (
    <div>
      <Category title='Visibilty' note="Control certain components' visibility">
        <SelectItem
          note="Changes the controls section's visibility"
          options={[
            { label: 'Shown', value: 'always' },
            { label: 'Hidden', value: 'hidden' },
            { label: 'Shown on hover', value: 'auto' },
          ]}
          value={controlsVisiblityState}
          onChange={(newValue: string): void => {
            config.set('controlsVisibilityState', newValue);
            componentEventTarget.dispatchEvent(
              new CustomEvent('componentVisibilityUpdate', {
                detail: {
                  type: 'controlVisibilityState',
                  state: newValue,
                },
              }),
            );
            onControlsVisibilityChange(newValue);
          }}>
          Controls section
        </SelectItem>
        <SelectItem
          note="Changes the progress display's visibility"
          options={[
            { label: 'Shown', value: 'always' },
            { label: 'Hidden', value: 'hidden' },
            { label: 'Shown on hover', value: 'auto' },
          ]}
          value={progressDisplayVisibilityState}
          onChange={(newValue: string): void => {
            config.set('progressDisplayVisibilityState', newValue);
            componentEventTarget.dispatchEvent(
              new CustomEvent('componentVisibilityUpdate', {
                detail: {
                  type: 'progressDisplayVisibilityState',
                  state: newValue,
                },
              }),
            );
            onProgressDisplayVisibilityChange(newValue);
          }}>
          Progress display
        </SelectItem>
        <SelectItem
          note="Changes the seekbar's visibility"
          options={[
            { label: 'Shown', value: 'always' },
            { label: 'Hidden', value: 'hidden' },
            { label: 'Shown on hover', value: 'auto' },
          ]}
          value={seekbarVisibilityState}
          onChange={(newValue: string): void => {
            config.set('seekbarVisibilityState', newValue);
            componentEventTarget.dispatchEvent(
              new CustomEvent('componentVisibilityUpdate', {
                detail: {
                  type: 'seekbarVisibilityState',
                  state: newValue,
                },
              }),
            );
            onSeekbarVisibiltyChange(newValue);
          }}>
          Seekbar
        </SelectItem>
      </Category>
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
        <FormItem
          title='Skip previous reset progress duration'
          note='The percentage of the track duration to ignore playback progress reset on clicking skip previous.'>
          <Slider
            disabled={!config.get('skipPreviousShouldResetProgress', true)}
            minValue={0}
            maxValue={1}
            {...util.useSetting(config, 'skipPreviousProgressResetThreshold', 0.15)}
          />
        </FormItem>
      </Category>
    </div>
  );
}

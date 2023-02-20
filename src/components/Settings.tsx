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
      <Category title='Visibility' note="Control certain components' visibility">
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
              new CustomEvent('componentVisibilityUpdateSettings', {
                detail: {
                  type: 'controlsVisibilityState',
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
              new CustomEvent('componentVisibilityUpdateSettings', {
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
          note="Changes the seek bar's visibility"
          options={[
            { label: 'Shown', value: 'always' },
            { label: 'Hidden', value: 'hidden' },
            { label: 'Shown on hover', value: 'auto' },
          ]}
          value={seekbarVisibilityState}
          onChange={(newValue: string): void => {
            config.set('seekbarVisibilityState', newValue);
            componentEventTarget.dispatchEvent(
              new CustomEvent('componentVisibilityUpdateSettings', {
                detail: {
                  type: 'seekbarVisibilityState',
                  state: newValue,
                },
              }),
            );
            onSeekbarVisibiltyChange(newValue);
          }}>
          Seek bar
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
          title='Skip previous reset progress threshold'
          note='The percentage of the track duration to ignore playback progress reset on clicking skip previous.'>
          <Slider
            disabled={!config.get('skipPreviousShouldResetProgress', true)}
            minValue={0}
            maxValue={1}
            markers={[
              0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.8,
              0.85, 0.9, 0.95, 1,
            ]}
            {...util.useSetting(config, 'skipPreviousProgressResetThreshold', 0.15)}
          />
        </FormItem>
      </Category>
      <Category title='Debugging' note='Enable more verbose console logs'>
        <SwitchItem
          note='Logs to console whenever active account ID is changed'
          {...util.useSetting(config, 'debuggingLogActiveAccountId', false)}>
          Account ID
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever an account gets injected'
          {...util.useSetting(config, 'debuggingLogAccountInjection', false)}>
          Account injection
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever components are supposed to be updated (does not include progress bar / progress display changes)'
          {...util.useSetting(config, 'debuggingLogComponentsUpdates', false)}>
          Component updates
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever controls are used'
          {...util.useSetting(config, 'debuggingLogControls', false)}>
          Controls
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever modal root is injected / modal is mounted'
          {...util.useSetting(config, 'debuggingLogModalInjection', false)}>
          Modal injection
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever state changes'
          {...util.useSetting(config, 'debuggingLogState', false)}>
          State
        </SwitchItem>
      </Category>
    </div>
  );
}

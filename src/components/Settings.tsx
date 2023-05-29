import { common, components, util } from 'replugged';
import { config, dispatchEvent } from '@?utils';

const { Category, FormItem, SelectItem, Slider, SwitchItem } = components;
const { React } = common;

export function Settings(): JSX.Element {
  const { value: controlsVisiblityState, onChange: onControlsVisibilityChange } = util.useSetting(
    config,
    'controlsVisibilityState',
  );

  const { value: progressDisplayVisibilityState, onChange: onProgressDisplayVisibilityChange } =
    util.useSetting(config, 'progressDisplayVisibilityState');

  const { value: seekbarVisibilityState, onChange: onSeekbarVisibiltyChange } = util.useSetting(
    config,
    'seekbarVisibilityState',
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
            dispatchEvent('componentVisibilityUpdateSettings', {
              type: 'controlsVisibilityState',
              state: newValue,
            });
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
            dispatchEvent('componentVisibilityUpdateSettings', {
              type: 'progressDisplayVisibilityState',
              state: newValue,
            });
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
            dispatchEvent('componentVisibilityUpdateSettings', {
              type: 'seekbarVisibilityState',
              state: newValue,
            });
            onSeekbarVisibiltyChange(newValue);
          }}>
          Seek bar
        </SelectItem>
      </Category>
      <Category title='Copying' note='Controls right click copying of album / artist / track URL'>
        <SwitchItem
          note='Enable copying of artist URL'
          {...util.useSetting(config, 'copyingArtistURLEnabled')}>
          Artist
        </SwitchItem>
        <SwitchItem
          note='Enable copying of album URL'
          {...util.useSetting(config, 'copyingAlbumURLEnabled')}>
          Album
        </SwitchItem>
        <SwitchItem
          note='Enable copying of track URL'
          {...util.useSetting(config, 'copyingTrackURLEnabled')}>
          Track
        </SwitchItem>
      </Category>
      <Category title='Hyperlinks' note='Controls album / artist / track hyperlinks'>
        <SwitchItem
          note='Enable artist hyperlinks'
          {...util.useSetting(config, 'hyperlinkArtistEnabled')}>
          Artists
        </SwitchItem>
        <SwitchItem
          note='Enable album hyperlinks'
          {...util.useSetting(config, 'hyperlinkAlbumEnabled')}>
          Album
        </SwitchItem>
        <SwitchItem
          note='Enable track hyperlinks'
          {...util.useSetting(config, 'hyperlinkTrackEnabled')}>
          Track
        </SwitchItem>
        <SwitchItem
          note='Use Spotify URIs (open directly in Spotify) instead of normal links'
          {...util.useSetting(config, 'hyperlinkURI')}>
          Use Spotify URI
        </SwitchItem>
      </Category>
      <Category title='Debugging' note='Enable more verbose console logs'>
        <SwitchItem
          note='Logs to console whenever active account ID is changed'
          {...util.useSetting(config, 'debuggingLogActiveAccountId')}>
          Account ID
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever an account gets injected'
          {...util.useSetting(config, 'debuggingLogAccountInjection')}>
          Account injection
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever components are supposed to be updated (does not include progress bar / progress display changes)'
          {...util.useSetting(config, 'debuggingLogComponentsUpdates')}>
          Component updates
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever controls are used'
          {...util.useSetting(config, 'debuggingLogControls')}>
          Controls
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever modal root is injected / modal is mounted'
          {...util.useSetting(config, 'debuggingLogModalInjection')}>
          Modal injection
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever state changes'
          {...util.useSetting(config, 'debuggingLogState')}>
          State
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever auto Spotify pause is supposed to get stopped'
          {...util.useSetting(config, 'debuggingLogNoSpotifyPause')}>
          No Spotify pause
        </SwitchItem>
      </Category>
      <Category
        title='Miscellaneous'
        note='Includes random things that is not suitable to be in any other category'>
        <SwitchItem
          note='Reauthenticate Spotify access token & retry automatically on control failure'
          {...util.useSetting(config, 'automaticReauthentication')}>
          Reauthenticate & retry automatically on failure
        </SwitchItem>
        <SwitchItem
          note='Stops Discord from automatically pausing Spotify while talking in a VC'
          {...util.useSetting(config, 'noSpotifyPause')}>
          No Spotify pause
        </SwitchItem>
        <SwitchItem
          note='Enable seeking by tapping on the seekbar'
          {...util.useSetting(config, 'seekbarEnabled')}>
          Enable track seeking
        </SwitchItem>
        <SwitchItem
          note='Make the skip previous control reset your track playback progress when it is past a percentage of the track'
          {...util.useSetting(config, 'skipPreviousShouldResetProgress')}>
          Skip previous should reset progress
        </SwitchItem>
        <FormItem
          title='Skip previous reset progress threshold'
          note='The percentage of the track duration to ignore playback progress reset on clicking skip previous.'>
          <Slider
            className={'skip-prev-reset-slider'}
            disabled={!config.get('skipPreviousShouldResetProgress')}
            minValue={0}
            maxValue={1}
            markers={[
              0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75,
              0.8, 0.85, 0.9, 0.95, 1,
            ]}
            {...util.useSetting(config, 'skipPreviousProgressResetThreshold')}
          />
        </FormItem>
      </Category>
    </div>
  );
}

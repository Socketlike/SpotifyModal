import { components, util } from 'replugged';
import { config, componentEventTarget, defaultConfig } from './global';

const { Category, FormItem, SelectItem, Slider, SwitchItem } = components;

export function Settings(): JSX.Element {
  const { value: controlsVisiblityState, onChange: onControlsVisibilityChange } = util.useSetting(
    config,
    'controlsVisibilityState',
    defaultConfig.controlsVisibilityState,
  );
  const { value: progressDisplayVisibilityState, onChange: onProgressDisplayVisibilityChange } =
    util.useSetting(
      config,
      'progressDisplayVisibilityState',
      defaultConfig.progressDisplayVisibilityState,
    );
  const { value: seekbarVisibilityState, onChange: onSeekbarVisibiltyChange } = util.useSetting(
    config,
    'seekbarVisibilityState',
    defaultConfig.seekbarVisibilityState,
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
          {...util.useSetting(
            config,
            'copyingArtistURLEnabled',
            defaultConfig.copyingArtistURLEnabled,
          )}>
          Artist
        </SwitchItem>
        <SwitchItem
          note='Enable copying of album URL'
          {...util.useSetting(
            config,
            'copyingAlbumURLEnabled',
            defaultConfig.copyingAlbumURLEnabled,
          )}>
          Album
        </SwitchItem>
        <SwitchItem
          note='Enable copying of track URL'
          {...util.useSetting(
            config,
            'copyingTrackURLEnabled',
            defaultConfig.copyingTrackURLEnabled,
          )}>
          Track
        </SwitchItem>
      </Category>
      <Category title='Hyperlinks' note='Controls album / artist / track hyperlinks'>
        <SwitchItem
          note='Enable artist hyperlinks'
          {...util.useSetting(
            config,
            'hyperlinkArtistEnabled',
            defaultConfig.hyperlinkArtistEnabled,
          )}>
          Artists
        </SwitchItem>
        <SwitchItem
          note='Enable album hyperlinks'
          {...util.useSetting(
            config,
            'hyperlinkAlbumEnabled',
            defaultConfig.hyperlinkAlbumEnabled,
          )}>
          Album
        </SwitchItem>
        <SwitchItem
          note='Enable track hyperlinks'
          {...util.useSetting(
            config,
            'hyperlinkTrackEnabled',
            defaultConfig.hyperlinkTrackEnabled,
          )}>
          Track
        </SwitchItem>
        <SwitchItem
          note='Use Spotify URIs (open directly in Spotify) instead of normal links'
          {...util.useSetting(config, 'hyperlinkURI', defaultConfig.hyperlinkURI)}>
          Use Spotify URI
        </SwitchItem>
      </Category>
      <Category title='Debugging' note='Enable more verbose console logs'>
        <SwitchItem
          note='Logs to console whenever active account ID is changed'
          {...util.useSetting(
            config,
            'debuggingLogActiveAccountId',
            defaultConfig.debuggingLogActiveAccountId,
          )}>
          Account ID
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever an account gets injected'
          {...util.useSetting(
            config,
            'debuggingLogAccountInjection',
            defaultConfig.debuggingLogAccountInjection,
          )}>
          Account injection
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever components are supposed to be updated (does not include progress bar / progress display changes)'
          {...util.useSetting(
            config,
            'debuggingLogComponentsUpdates',
            defaultConfig.debuggingLogComponentsUpdates,
          )}>
          Component updates
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever controls are used'
          {...util.useSetting(config, 'debuggingLogControls', defaultConfig.debuggingLogControls)}>
          Controls
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever modal root is injected / modal is mounted'
          {...util.useSetting(
            config,
            'debuggingLogModalInjection',
            defaultConfig.debuggingLogModalInjection,
          )}>
          Modal injection
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever state changes'
          {...util.useSetting(config, 'debuggingLogState', defaultConfig.debuggingLogState)}>
          State
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever auto Spotify pause is supposed to get stopped'
          {...util.useSetting(
            config,
            'debuggingLogNoSpotifyPause',
            defaultConfig.debuggingLogNoSpotifyPause,
          )}>
          No Spotify pause
        </SwitchItem>
      </Category>
      <Category
        title='Miscellaneous'
        note='Includes random things that is not suitable to be in any other category'>
        <SwitchItem
          note='Reauthenticate Spotify access token & retry automatically on control failure (Highly experimental)'
          {...util.useSetting(
            config,
            'automaticReauthentication',
            defaultConfig.automaticReauthentication,
          )}>
          Reauthenticate & retry automatically on failure
        </SwitchItem>
        <SwitchItem
          note='Stops Discord from automatically pausing Spotify while talking in a VC'
          {...util.useSetting(config, 'noSpotifyPause', defaultConfig.noSpotifyPause)}>
          No Spotify pause
        </SwitchItem>
        <SwitchItem
          note='Enable seeking by tapping on the seekbar'
          {...util.useSetting(config, 'seekbarEnabled', defaultConfig.seekbarEnabled)}>
          Enable track seeking
        </SwitchItem>
        <SwitchItem
          note='Make the skip previous control reset your track playback progress when it is past a percentage of the track'
          {...util.useSetting(
            config,
            'skipPreviousShouldResetProgress',
            defaultConfig.skipPreviousShouldResetProgress,
          )}>
          Skip previous should reset progress
        </SwitchItem>
        <FormItem
          title='Skip previous reset progress threshold'
          note='The percentage of the track duration to ignore playback progress reset on clicking skip previous.'>
          <Slider
            disabled={
              !config.get(
                'skipPreviousShouldResetProgress',
                defaultConfig.skipPreviousShouldResetProgress,
              )
            }
            minValue={0}
            maxValue={1}
            markers={[
              0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.8,
              0.85, 0.9, 0.95, 1,
            ]}
            {...util.useSetting(
              config,
              'skipPreviousProgressResetThreshold',
              defaultConfig.skipPreviousProgressResetThreshold,
            )}
          />
        </FormItem>
      </Category>
    </div>
  );
}

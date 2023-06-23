import { common, components, util } from 'replugged';
import { config, dispatchEvent, useTrappedSettingsState } from '@?utils';

const { Category, FormItem, SelectItem, Slider, SwitchItem } = components;
const { React } = common;

const updateSetting = <T extends ConfigKeys, D extends DefaultConfig[T]>(
  key: T,
  value: D,
): void => {
  config.set(key, value);
  dispatchEvent('settingsUpdate', {
    key,
    value,
  });
};

export const Settings = (): JSX.Element => {
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
          {...useTrappedSettingsState(
            util.useSetting(config, 'controlsVisibilityState'),
            'controlsVisibilityState',
            updateSetting,
          )}>
          Controls section
        </SelectItem>
        <SelectItem
          note="Changes the seek bar's visibility"
          options={[
            { label: 'Shown', value: 'always' },
            { label: 'Hidden', value: 'hidden' },
            { label: 'Shown on hover', value: 'auto' },
          ]}
          {...useTrappedSettingsState(
            util.useSetting(config, 'seekbarVisibilityState'),
            'seekbarVisibilityState',
            updateSetting,
          )}>
          Seekbar
        </SelectItem>
      </Category>
      <Category title='Copying' note='Controls right click copying of album / artist / track URL'>
        <SwitchItem
          note='Enable copying of artist URL'
          {...useTrappedSettingsState(
            util.useSetting(config, 'copyingArtistURLEnabled'),
            'copyingArtistURLEnabled',
            updateSetting,
          )}>
          Artist
        </SwitchItem>
        <SwitchItem
          note='Enable copying of album URL'
          {...useTrappedSettingsState(
            util.useSetting(config, 'copyingAlbumURLEnabled'),
            'copyingAlbumURLEnabled',
            updateSetting,
          )}>
          Album
        </SwitchItem>
        <SwitchItem
          note='Enable copying of track URL'
          {...useTrappedSettingsState(
            util.useSetting(config, 'copyingTrackURLEnabled'),
            'copyingTrackURLEnabled',
            updateSetting,
          )}>
          Track
        </SwitchItem>
      </Category>
      <Category title='Hyperlinks' note='Controls album / artist / track hyperlinks'>
        <SwitchItem
          note='Enable artist hyperlinks'
          {...useTrappedSettingsState(
            util.useSetting(config, 'hyperlinkArtistEnabled'),
            'hyperlinkArtistEnabled',
            updateSetting,
          )}>
          Artists
        </SwitchItem>
        <SwitchItem
          note='Enable album hyperlinks'
          {...useTrappedSettingsState(
            util.useSetting(config, 'hyperlinkAlbumEnabled'),
            'hyperlinkAlbumEnabled',
            updateSetting,
          )}>
          Album
        </SwitchItem>
        <SwitchItem
          note='Enable track hyperlinks'
          {...useTrappedSettingsState(
            util.useSetting(config, 'hyperlinkTrackEnabled'),
            'hyperlinkTrackEnabled',
            updateSetting,
          )}>
          Track
        </SwitchItem>
        <SwitchItem
          note='Use Spotify URIs (open directly in Spotify) instead of normal links'
          {...useTrappedSettingsState(
            util.useSetting(config, 'hyperlinkURI'),
            'hyperlinkURI',
            updateSetting,
          )}>
          Use Spotify URI
        </SwitchItem>
      </Category>
      <Category title='Debugging' note='Enable more verbose console logs'>
        <SwitchItem
          note='Logs to console whenever active account ID is changed'
          {...useTrappedSettingsState(
            util.useSetting(config, 'debuggingLogActiveAccountId'),
            'debuggingLogActiveAccountId',
            updateSetting,
          )}>
          Account ID
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever an account gets injected'
          {...useTrappedSettingsState(
            util.useSetting(config, 'debuggingLogAccountInjection'),
            'debuggingLogAccountInjection',
            updateSetting,
          )}>
          Account injection
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever components are supposed to be updated (does not include progress bar / progress display changes)'
          {...useTrappedSettingsState(
            util.useSetting(config, 'debuggingLogComponentsUpdates'),
            'debuggingLogComponentsUpdates',
            updateSetting,
          )}>
          Component updates
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever controls are used'
          {...useTrappedSettingsState(
            util.useSetting(config, 'debuggingLogControls'),
            'debuggingLogControls',
            updateSetting,
          )}>
          Controls
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever modal root is injected / modal is mounted'
          {...useTrappedSettingsState(
            util.useSetting(config, 'debuggingLogModalInjection'),
            'debuggingLogModalInjection',
            updateSetting,
          )}>
          Modal injection
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever state changes'
          {...useTrappedSettingsState(
            util.useSetting(config, 'debuggingLogState'),
            'debuggingLogState',
            updateSetting,
          )}>
          State
        </SwitchItem>
        <SwitchItem
          note='Logs to console whenever auto Spotify pause is supposed to get stopped'
          {...useTrappedSettingsState(
            util.useSetting(config, 'debuggingLogNoSpotifyPause'),
            'debuggingLogNoSpotifyPause',
            updateSetting,
          )}>
          No Spotify pause
        </SwitchItem>
      </Category>
      <Category
        title='Miscellaneous'
        note='Includes random things that is not suitable to be in any other category'>
        <SwitchItem
          note='Reauthenticate Spotify access token & retry automatically on control failure'
          {...useTrappedSettingsState(
            util.useSetting(config, 'automaticReauthentication'),
            'automaticReauthentication',
            updateSetting,
          )}>
          Reauthenticate & retry automatically on failure
        </SwitchItem>
        <SwitchItem
          note='Stops Discord from automatically pausing Spotify while talking in a VC'
          {...useTrappedSettingsState(
            util.useSetting(config, 'noSpotifyPause'),
            'noSpotifyPause',
            updateSetting,
          )}>
          No Spotify pause
        </SwitchItem>
        <SwitchItem
          note='Enable seeking by tapping on the seekbar'
          {...useTrappedSettingsState(
            util.useSetting(config, 'seekbarEnabled'),
            'seekbarEnabled',
            updateSetting,
          )}>
          Enable track seeking
        </SwitchItem>
        <SwitchItem
          note='Make the skip previous control reset your track playback progress when it is past a percentage of the track'
          {...useTrappedSettingsState(
            util.useSetting(config, 'skipPreviousShouldResetProgress'),
            'skipPreviousShouldResetProgress',
            updateSetting,
          )}>
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
            {...useTrappedSettingsState(
              util.useSetting(config, 'skipPreviousProgressResetThreshold'),
              'skipPreviousProgressResetThreshold',
              updateSetting,
            )}
          />
        </FormItem>
      </Category>
    </div>
  );
};

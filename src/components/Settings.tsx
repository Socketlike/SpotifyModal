import { common, components, util } from 'replugged';
import { events, useTrappedSettingsState } from '@util';
import { DefaultConfigType, DefaultConfigTypeKeys, config } from '@config';

const { FormItem, SelectItem, Slider, SwitchItem } = components;
const { React, lodash: _ } = common;

const updateSetting = <T extends DefaultConfigTypeKeys, D extends DefaultConfigType[T]>(
  key: T,
  value: D,
): void => {
  config.set(key, value);
  events.emit('settingsUpdate', {
    key,
    value,
  });
};

export const Settings = (): JSX.Element => {
  return (
    <div>
      <SwitchItem
        note='Prints more verbose logs to console'
        {...useTrappedSettingsState(
          util.useSetting(config, 'debugging'),
          'debugging',
          updateSetting,
        )}>
        Debugging
      </SwitchItem>
      <SwitchItem
        note='Use Spotify URIs (open directly in Spotify) instead of normal links for hyperlinks'
        {...useTrappedSettingsState(
          util.useSetting(config, 'hyperlinkURI'),
          'hyperlinkURI',
          updateSetting,
        )}>
        Use Spotify URI
      </SwitchItem>
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
          markers={_.range(0, 1.05, 0.05).map((v) => Number(v.toFixed(2)))}
          {...useTrappedSettingsState(
            util.useSetting(config, 'skipPreviousProgressResetThreshold'),
            'skipPreviousProgressResetThreshold',
            updateSetting,
          )}
        />
      </FormItem>
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
        Seekbar Visibility
      </SelectItem>
    </div>
  );
};

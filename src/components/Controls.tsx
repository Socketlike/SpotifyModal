import { common, components, webpack } from 'replugged';
import { logger } from '@?utils';
import type { ContextMenuProps } from 'replugged/dist/renderer/modules/components/ContextMenu';

const { React, contextMenu, toast } = common;
const { ContextMenu } = components;

const { MenuSliderControl } = await webpack.waitForModule<{
  MenuSliderControl: (props: {
    'aria-label': string;
    disabled: boolean;
    isFocused: boolean;
    maxValue: number;
    onChange?: (newValue: number) => void;
    onClose: () => void;
    value: number;
    ref: React.Ref<{
      activate: () => boolean;
      blur: () => void;
      focus: () => void;
    }>;
  }) => JSX.Element;
}>(webpack.filters.byProps('Slider', 'Spinner'));

export const openControlsContextMenu = (ev: React.MouseEvent): void =>
  contextMenu.open(ev, () => {
    const [cjheckbox, setCjheckbox] = React.useState<boolean>(false);
    const sloiderRef = React.useRef(null);

    return (
      <ContextMenu.ContextMenu onClose={contextMenu.close} navId='spotify-modal-controls'>
        <ContextMenu.MenuItem
          label='a whole lotta nothing'
          id='nothing'
          action={() => {
            logger.log('(controls)', 'big troll');
            toast.toast('check console for big funny', toast.Kind.MESSAGE);
          }}
        />
        <ContextMenu.MenuCheckboxItem
          label='this is a cjheckbox'
          id='cjheckbox'
          checked={cjheckbox}
          action={() => {
            logger.log('(controls)', 'cjheckbox was clicked', !cjheckbox);
            setCjheckbox(!cjheckbox);
          }}
        />
        <ContextMenu.MenuControlItem
          id='sloider'
          label='this is a sloider'
          control={(data, ref): JSX.Element => (
            <MenuSliderControl
              aria-label='sloider'
              value={0}
              maxValue={100}
              onChange={(newValue: number): void =>
                logger.log('(controls)', 'new value from sloider', newValue)
              }
              {...data}
              ref={ref}
            />
          )}
        />
      </ContextMenu.ContextMenu>
    );
  });

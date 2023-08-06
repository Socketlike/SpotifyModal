import { Components } from '@typings';
import { config } from '@config';
import { mdiHelpCircle } from '@mdi/js';
import { common, components, util } from 'replugged';

const {
  React,
  modal: { openModal },
} = common;
const { Modal, Text, Tooltip } = components;

export const AuthLinkGuide = (props: Components.Props.Modal): JSX.Element => {
  return (
    <Modal.ModalRoot {...props} className='spotify-modal-oauth2-guide'>
      <Modal.ModalHeader className='header'>
        <Text.H1 variant='heading-lg/bold'>Spotify OAuth2 Guide</Text.H1>
      </Modal.ModalHeader>
      <Modal.ModalContent>
        <div />
      </Modal.ModalContent>
    </Modal.ModalRoot>
  );
};

export const AuthLinkGenerator = (props: Components.Props.Modal): JSX.Element => {
  return (
    <Modal.ModalRoot {...props} className='spotify-modal-oauth2-generator'>
      <Modal.ModalHeader className='header'>
        <Text.H1 variant='heading-lg/bold'>Spotify OAuth2 Link Generator</Text.H1>
        <Tooltip text='Guide' className='guide-button-tooltip'>
          <svg
            onClick={(): void => {
              openModal(AuthLinkGuide);
            }}
            viewBox='0 0 24 24'
            className='guide-button'>
            <path fill='currentColor' d={mdiHelpCircle} />
          </svg>
        </Tooltip>
      </Modal.ModalHeader>
      <Modal.ModalContent className='content'>
        <div></div>
      </Modal.ModalContent>
    </Modal.ModalRoot>
  );
};

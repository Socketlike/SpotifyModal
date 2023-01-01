# SpotifyModal
A bad WIP reimplementation of the spotify-modal Powercord coremod for the post-SWC era of Replugged, I think
  
# Install
  - [Download plugin ASAR file from releases](https://github.com/Socketlike/SpotifyModal/releases)  
  - Move plugin ASAR file to Replugged plugin directory  
  - Reload Discord (if running)
  
# How to use
  - Play any Spotify song (that's literally it)
  
# Preview
  ![Preview](Preview.gif)
  
# Customization & debugging
UI elements and the modal manager are both exposed via window.SpotifyModal.  
UI elements are also exposed to CSS via these classes:  
  - Main modal:  `spotify-modal`
    - Cover art: `spotify-modal-cover-art`
    - Metadata container: `spotify-modal-metadata`
      - Song title: `spotify-modal-song-title`
      - Artists list: `spotify-modal-song-artists`
  - Dock: `spotify-modal-dock`
    - Time display container: `spotify-modal-playback-time`
      - Current time display: `spotify-modal-playback-time-current`
      - Duration time display: `spotify-modal-playback-time-duration`
    - Timebar: `spotify-modal-timebar`
      - Inner timebar: `spotify-modal-timebar-inner`
    - Dock icons container: `spotify-modal-dock-icons`
      - Shuffle icon: `shuffleIcon`
      - Skip previous icon: `skipPreviousIcon`
      - Play/pause icon: `playPauseIcon`
      - Skip next icon: `skipNextIcon`
      - Repeat icon: `repeatIcon`

# Roadmap
  - [X] Add basic functionality
  - [X] Song progress bar
  - [ ] Controls
  - [X] Styling improvements

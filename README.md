# SpotifyModal
A Post-SWC Replugged plugin that shows a little modal on your user dock that lets you see & control what you're playing on Spotify.  
  
# Install
  - [Download plugin ASAR file from releases](https://github.com/Socketlike/SpotifyModal/releases)  
  - Move plugin ASAR file to Replugged plugin directory  
  - Reload Discord (if running)
  
# How to use
  - Play any Spotify song (that's literally it)
  
# Preview
  ![Preview](Preview.gif)
  
# Customization & debugging
UI elements, utility functions and custom classes are exposed via `replugged.plugins.getExports('lib.evelyn.SpotifyModal')`.  
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
    - Progress bar: `spotify-modal-progressbar`
      - Inner progress bar: `spotify-modal-progressbar-inner`
    - Dock icons container: `spotify-modal-dock-icons`
      - Shuffle icon: `spotify-modal-shuffle-icon`
        - Shuffle icon SVG title: `spotify-modal-shuffle-icon-title`
        - Shuffle icon SVG path: `spotify-modal-shuffle-icon-path`
      - Skip previous icon: `spotify-modal-skip-previous-icon`
        - Skip previous SVG path: `spotify-modal-skip-previous-icon-path`
      - Play/pause icon: `spotify-modal-play-pause-icon`
        - Play SVG path: `spotify-modal-play-icon-path`
        - Pause SVG path: `spotify-modal-pause-icon-path`
      - Skip next icon: `spotify-modal-skip-next-icon`
        - Skip next SVG path: `spotify-modal-skip-next-icon-path`
      - Repeat icon: `spotify-modal-repeat-icon`
        - Repeat icon SVG title: `spotify-modal-repeat-icon-title`
        - Repeat all SVG path: `spotify-modal-repeat-all-path`
        - Repeat one SVG path: `spotify-modal-repeat-one-path`

# Miscellaneous
  - Right clicking on the cover art copies the currently playing album URL, if there's any
  - Right clicking on the song title copies the currently playing song's URL
  - Right clicking on an artist's name copies the artist's user URL

# Roadmap
  - [X] Add basic functionality
  - [X] Song progress bar
  - [ ] Controls
    - [X] Play/pause
    - [X] Skip forwards/backwards
    - [X] Toggle shuffle
    - [X] Change repeat mode
    - [ ] Track seeking
    - [ ] Volume control
  - [X] Styling improvements


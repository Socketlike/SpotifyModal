# SpotifyModal

A Post-SWC Replugged plugin that shows a little modal on your user dock that lets you see & control
what you're playing on Spotify.

# Install

- [Download plugin ASAR file from releases](https://github.com/Socketlike/SpotifyModal/releases)
- Move plugin ASAR file to Replugged plugin directory
- Reload Discord (if running)

# How to use

- Play any Spotify song (that's literally it)

# Preview

![Preview](Preview.gif)

# Customization & debugging

UI elements, the modal class instance and classes are exposed via
`replugged.plugins.getExports('lib.evelyn.SpotifyModal')`.  
UI elements are also exposed to CSS via these classes:

- Main modal: `spotify-modal`
  - Cover art: `cover-art`
  - Metadata container: `metadata`
    - Song title: `song-title`
    - Artists list: `song-artists`
- Dock: `dock`
  - Time display container: `playback-time`
    - Current time display: `playback-time-current`
    - Duration time display: `playback-time-duration`
  - Progress bar: `progressbar`
    - Inner progress bar: `progressbar-inner`
  - Dock icons container: `dock-icons`
    - Shuffle icon: `shuffle-icon`
      - Shuffle icon SVG title: `shuffle-icon-title`
      - Shuffle icon SVG path: `shuffle-icon-path`
    - Skip previous icon: `skip-previous-icon`
      - Skip previous SVG path: `skip-previous-icon-path`
    - Play/pause icon: `play-pause-icon`
      - Play SVG path: `play-icon-path`
      - Pause SVG path: `pause-icon-path`
    - Skip next icon: `skip-next-icon`
      - Skip next SVG path: `skip-next-icon-path`
    - Repeat icon: `repeat-icon`
      - Repeat icon SVG title: `repeat-icon-title`
      - Repeat all SVG path: `repeat-all-path`
      - Repeat one SVG path: `repeat-one-path`

# Known issues

- Leaving Spotify inactive for an hour or so will make the controls stop working until you manually update the player state in the Spotify app  
- The progress bar can (and quite literally) freeze when renderer freezes (i.e. switching channels when system / renderer is under heavy load), causing progress bar inaccuracy  
- The modal can fade out at random when the player state updates (pre-better-codebase bug)  
- The title element does not play the scrolling animation (when it's supposed to) on Discord startup, instead it cuts out (ellipsis)  

# Miscellaneous

- Right clicking on the cover art copies the currently playing album URL, if there's any
- Right clicking on the song title copies the currently playing song's URL
- Right clicking on an artist's name copies the artist's user URL
- Clicking on the progress bar allows you to set current playback position

# Roadmap

- [x] Add basic functionality
- [x] Song progress bar
- [ ] Controls
  - [x] Play/pause
  - [x] Skip forwards/backwards
  - [x] Toggle shuffle
  - [x] Change repeat mode
  - [ ] Track seeking
    - [x] Track seeking by clicking on bar
    - [ ] Track scrubbing
  - [ ] Volume control
- [x] Styling improvements

<p>
  <div style="width: 100%; text-align: center">
    <h1>SpotifyModal</h1>
  </div>
</p>
<p><img alt="Lint Status" src="https://img.shields.io/github/actions/workflow/status/Socketlike/SpotifyModal/lint.yml?label=lint"> <img alt="GitHub release (latest SemVer)" src="https://img.shields.io/github/v/release/Socketlike/SpotifyModal?label=version"></p>

A Post-SWC Replugged plugin that shows a little modal on your user dock that lets you see & control
what you're playing on Spotify.

> **Note**  
> This plugin does **not** require Spotify Premium to function.
> All functionality are built upon Discord's Spotify WebSocket + Spotify WebAPI calls

<div style="width: 100%; text-align: center"><h1>Install</h1></div>

- [Download plugin ASAR file from releases](https://github.com/Socketlike/SpotifyModal/releases)
- Move plugin ASAR file to Replugged plugin directory
- Reload Discord (if running)

**OR**

[![Install in Replugged](https://img.shields.io/badge/-Install%20in%20Replugged-blue?style=for-the-badge&logo=none)](https://replugged.dev/install?identifier=Socketlike/SpotifyModal&source=github)

<div style="width: 100%; text-align: center"><h1>How to use</h1></div>

- Link your Spotify account to Discord if you haven't already  
- Play any Spotify song (that's literally it)

<div style="width: 100%; text-align: center"><h1>Preview</h1></div>

![Preview](Preview.gif)

<div style="width: 100%; text-align: center"><h1>Customization & debugging</h1></div>

UI components, utility functions, variables (current account ID, Spotify store...) are exposed via
`replugged.plugins.getExports('lib.evelyn.SpotifyModal')`.  
  
UI elements are also exposed to CSS via these classes:

- React Root: `spotify-modal-root`
- Main modal: `spotify-modal`
  - Header: `header`
    - Cover art: `cover-art`
    - Track info container: `track-info`
      - Song title: `title`
      - Artists list: `artists`
        - Artist with hyperlink: `artist`
  - Dock: `dock`
    - Progress display container: `progress-display`
      - Current time display: `current`
      - Duration time display: `duration`
    - Progress bar: `seek-bar`
      - Inner progress bar: `inner`
    - Controls container: `controls`
      - Shuffle icon: `shuffle`
      - Skip previous icon: `skip-prev`
      - Play/pause icon: `play-pause`
      - Skip next icon: `skip-next`
      - Repeat icon: `repeat`
  
There also exists a settings menu which allows for some degrees of customization.

# Known issues

- Leaving Spotify inactive for an hour or so will make the controls stop working until you manually update the player state in the Spotify app  
- The progress bar is very sensitive to lag (heavy system load / renderer freezing), causing inaccuracy  
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

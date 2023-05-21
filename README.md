<p>
  <h1 align="center">SpotifyModal</h1>
</p>

<p align="center">
  <a href="https://github.com/Socketlike/SpotifyModal/releases/latest">
    <img alt="latest release" src="https://img.shields.io/github/v/release/Socketlike/SpotifyModal?label=version&sort=semver">
  </a>
  <a href="https://github.com/Socketlike/SpotifyModal/actions/workflows/lint.yml">
    <img alt="lint status" src="https://img.shields.io/github/actions/workflow/status/Socketlike/SpotifyModal/lint.yml?label=lint">
  </a>
  <a href="https://github.com/Socketlike/SpotifyModal/actions/workflows/release.yml">
    <img alt="build status" src="https://img.shields.io/github/actions/workflow/status/Socketlike/SpotifyModal/release.yml?label=build">
  </a>
  <a href="https://github.com/Socketlike/SpotifyModal/actions/workflows/nightly.yml">
    <img alt="nightly status" src="https://img.shields.io/github/actions/workflow/status/Socketlike/SpotifyModal/nightly.yml?label=nightly&color=blueviolet">
  </a>
</p>

<p align="center">
  <a href="https://replugged.dev/install?identifier=Socketlike/SpotifyModal&source=github">
    <img alt="install" src="https://img.shields.io/github/v/release/Socketlike/SpotifyModal?label=Install&sort=semver&style=for-the-badge">
  </a>
</p>

<p align="center">
  A Post-SWC Replugged plugin that shows a little modal on your user dock that lets you see & control
what you're playing on Spotify.
</p>

> **Note**  
> This plugin does **not** require Spotify Premium to function. All functionality are built upon
> Discord's Spotify WebSocket + Spotify WebAPI calls.

## How to use

- Link your Spotify account to Discord if you haven't already
- Play any Spotify song (that's literally it)

## Preview

Theme used for preview: [Matter](https://github.com/Socketlike/Matter)  
![Preview](https://socketlike.github.io/SpotifyModal-Preview.gif)

## Customization & debugging

There exists a settings menu which allows for a certain degree of customization.  
You can also customize how the modal looks via CSS:

- React Root: `.spotify-modal-root` **OR** `#spotify-modal-root`
- Modal: `.spotify-modal` **OR** `#spotify-modal`
  - Main: `.main` (when dock is hidden entirely: `.main.dock-hidden`)
    - Header: `.header`
      - Cover art: `.cover-art`
      - Track info container: `.track-info`
        - Song title: `.title`
        - Artists list: `.artists`
          - Artist with hyperlink: `.artist` or target the `a` element
          - Artist with no hyperlink: none
    - Dock: `.dock`
      - Progress container: `.progress-container`
        - Progress display container: `.progress-display`
          - Current time display: `.current`
          - Duration time display: `.duration`
        - Progress bar: `.seek-bar`
          - Inner progress bar: `.inner`
      - Controls container: `.controls`
        - Shuffle icon: `.shuffle`
        - Skip previous icon: `.skip-prev`
        - Play/pause icon: `.play-pause`
        - Skip next icon: `.skip-next`
        - Repeat icon: `.repeat`
  - Divider: `.divider`

## Known issues

- Leaving Spotify inactive for an hour or so will make the controls stop working until you manually
  update the player state in the Spotify app **(semi-confirmed to be fixed by enabling the
  "Automatic Reauthentication" option under the "Miscellaneous" category in plugin settings)**
- The progress bar can be off by 1s - 5s at times when the Discord app lags and the Spotify state
  updates. **(There is no real fix for this as we cannot trust Spotify's timestamp, it is >=
  ~350000ms off, consistently)**

## Miscellaneous

- Right clicking on the cover art copies the currently playing album URL, if there's any
- Right clicking on the song title copies the currently playing song's URL
- Right clicking on an artist's name copies the artist's user URL
- Clicking on the progress bar allows you to set current playback position

## Roadmap

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
  - [ ] Like / Unlike tracks (**will not be implemented for now, see
        [docs/SCOPES](docs/SCOPES.md)**)
  - [ ] Volume control
- [ ] Add the ability for users to use their custom OAuth2 code to generate access tokens instead of
      using Discord's access token (**see [docs/AUTHORIZATION](docs/AUTHORIZATION.md)**)

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
  <a href="https://replugged.dev/install?identifier=lib.evelyn.SpotifyModal">
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

## Preview

we will be right back

## Customization & debugging

There exists a settings menu which allows for a certain degree of customization.  
You can also customize how the modal looks via CSS:

- root: `.spotify-modal-root` | `#spotify-modal-root`
  - modal: `.spotify-modal` | `#spotify-modal`
    - main view: `.main` (`.dock-hidden`?)
    - header: `.header`
      - cover art: `.cover-art`
      - track info: `.track-info`
        - song name: `.title`
        - artists: `.artists`
    - dock: `.dock`
      - progress container: `.progress-container` -> (**nightly**) `.seekbar-container`
        - song timestamps: `.progress-display` -> (**nightly**) `.seekbar-timestamps`
          - current: `.current`
          - song duration: `.duration`
        - seekbar: `.seek-bar` -> (**nightly**) `.seekbar`
          - inner: `.inner`
      - controls container: `.controls` -> (**nightly**) `removed`
        - shuffle: `.shuffle` -> (**nightly**) `removed`
        - skip prev: `.skip-prev` -> (**nightly**) `removed`
        - play pause: `.play-pause` -> (**nightly**) `removed`
        - skip next: `.skip-next` -> (**nightly**) `removed`
        - repeat: `.repeat` -> (**nightly**) `removed`
  - divider: `.divider`

## Known issues

- leaving Spotify inactive for an hour or so will make the controls stop working until you manually
  update the player state in the Spotify app
  - fix: enable `Automatic Reauthentication` in `Settings` (**nightly**: enabled by default)
- The progress bar can be off by 1s - 5s at times when the Discord app lags and the Spotify state
  updates.
  - fix: none - we cannot trust Spotify's timestamps. they are wildly inaccurate for some reason

## Miscellaneous

- right clicking...
  - on the cover art copies the currently playing album URL, if there's any
  - on the song title copies the currently playing song's URL
  - on an artist's name copies the artist's user URL
  - (**nightly**) on any empty spot in the modal allows you to view the controls context menu
- clicking on the progress bar allows you to set current playback position

## Roadmap

- [x] basic functionality
- [x] progress bar
- [ ] controls
  - [x] play / pause
  - [x] skip forward / backward
  - [x] shuffle
  - [x] repeat
  - [ ] seeking
    - [x] clicking on bar
    - [ ] scrubbing
  - [ ] like / unlike ([docs/SCOPES](docs/SCOPES.md))
  - [x] Volume control (**nightly**)
- [ ] custom oauth2 access tokens ([docs/AUTHORIZATION](docs/AUTHORIZATION.md))

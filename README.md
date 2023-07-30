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
  a post-swc Replugged plugin that shows a little modal on your user dock that lets you see & control
what you're playing on Spotify.
</p>

## Credits

- the plaintext patch for the modal is taken from
  [Vencord's spotifyControls](https://github.com/Vendicated/Vencord/blob/main/src/plugins/spotifyControls/index.tsx#L49-L57)

## Preview

we will be right back

## Customization

there exists a settings menu which allows for a certain degree of customization.  
modal css map:

- root: `#spotify-modal-root`
  - modal: `.spotify-modal` | `#spotify-modal`
    - main view: `.main`
    - header: `.header`
      - cover art: `.cover-art`
      - track info: `.track-info`
        - song name: `.title`
        - artists: `.artists`
    - seekbar container: `.seekbar-container`
      - seekbar timestamps: `.seekbar-timestamps`
        - current: `.current`
        - song duration: `.duration`
      - seekbar: `.seekbar`
        - inner: `.inner`
        - grabber: `.grabber`
    - controls: `.controls`
      - repeat icons:
        - off: `.repeat-off-icon`
        - all: `.repeat-all-icon`
        - track: `.repeat-track-icon`
      - skip previous: `.skip-prev-icon`
      - play: `.play-icon`
      - pause: `.pause-icon`
      - skip next: `.skip-next-icon`
      - shuffle: `.shuffle-icon`
      - no icon: `.no-icon`
      - active (highlight): `.active`
  - divider: `.divider`

## Known issues

- leaving Spotify inactive for an hour or so will make the controls stop working until you manually
  update the player state in the Spotify app
  - fix: enable `Automatic Reauthentication` in `Settings`
- the progress bar can be off by 1s - 5s at times when the Discord app lags and the Spotify state
  updates.
  - fix: none - we cannot trust Spotify's timestamps. they are wildly inaccurate for some reason
- the modal does not update while playing episodes (shows)
  - fix: none - we don't get the item data for the episode at all (`null`). check it yourself by
    executing
    ```js
    replugged.plugins
      .getExports('lib.evelyn.SpotifyModal')
      ._.events.on('message', (e) => console.log(ev.detail.currently_playing_type, ev.detail.item));
    ```
- what happened to the `no Spotify pause` feature?
  - removed. you should check out [`NoSpotifyPause`](https://github.com/Socketlike/NoSpotifyPause)
    instead.

## Miscellaneous

- right clicking...
  - on the cover art copies the currently playing album URL, if there's any
  - on the song title copies the currently playing song's URL
  - on an artist's name copies the artist's user URL
  - on any empty spot in the modal allows you to view the controls context menu
- clicking on the progress bar allows you to set current playback position

## Roadmap

- [x] basic functionality
- [x] progress bar
- [ ] controls
  - [x] play / pause
  - [x] skip forward / backward
  - [x] shuffle
  - [x] repeat
  - [x] seeking
    - [x] clicking on bar
    - [x] scrubbing
  - [ ] like / unlike ([docs/SCOPES](docs/SCOPES.md))
  - [x] volume control
- [ ] custom oauth2 access tokens ([docs/AUTHORIZATION](docs/AUTHORIZATION.md))

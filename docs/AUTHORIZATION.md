<p>
  <h1 align="center">AUTHORIZATION</h1>
  <h4 align="center">My strategies for implementing authorization</h4>
</p>

## Custom authorization strategy

1. User creates a [custom Spotify application](https://developer.spotify.com/dashboard) with the redirect URI of `http://localhost`. Application secret is not required.  
2. User authorizes themselves using this URL: <code>https://accounts.spotify.com/authorize?client_id=<strong>(APPLICATION CLIENT ID HERE)</strong>&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A&scopes=user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing</code>  
3. User retrieves the OAuth2 code from the redirected `http://localhost` URI. (the code is placed right after the `code` query)  
4. User places the received OAuth2 code into an input (Needs to be secure. Perhaps we go the [RepluggedPGP](https://github.com/SammCheese/RepluggedPGP) way)  
5. We retrieve the access token from the OAuth2 code.  

## What custom authorization means for us

- We will no longer be bounded by Discord's Spotify access token's scope restrictions. Allows us to implement features (like / unlike tracks) that would otherwise be restricted by limited scopes.  
- Token reauthorization will be much simpler.  

## Internals

- Provide a modal popout for generating authorization URLs  
- Provide a setting for adding the OAuth2 code  
- Handle both the Discord access token and the OAuth2 access token (by detecting the OAuth2 code's presence?)  
- Handle OAuth2 deauthorization by falling back to Discord's token  

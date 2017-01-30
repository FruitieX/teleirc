Uploading photos with node-imgur
--------------------------------

If you aren't fond of setting up an own HTTP server for media files and you
only need photos from the groups to IRC, Teleirc also offers integration with
Imgur's API.

In order to use the API, you need to
[register to the API](https://api.imgur.com/endpoints). Uploading images
requires authentication, so you need to select "OAuth 2 authorization without
a callback URL" in the application registration. After you've registered, paste
your client id from Imgur to `config.imgurClientId` in your config.js.

After this, you can enable Imgur uploading by setting `config.uploadToImgur` to
true.

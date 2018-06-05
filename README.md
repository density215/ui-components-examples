# ui-components-examples
Example implementations of the RIPE NCC RnD ui components library

The UI components library that is used by these exmamples is a React + D3 Library that focuses on complex interactive components, like maps, combined country+city pickers etc.

There isn't a public NPM package of this library at the moment, so you will have to install it and then `npm link` it to the ui-components-examples app.

# Installation

To do so:

- You'll need node.js installed to make this work. Go to https://nodejs.org/en/download/package-manager/ to see an overview of options for all OSes. I greatly prefer using nodesource.com for linux distros. For MacOS I prefer using the bash install script instead of homebrew, but YMMV.
- Clone this repo somewhere on you local machine with `git@github.com:density215/ui-components-examples.git`
- Go into the eyeballsgraph directory: `cd ui-components-examples`
- Install all dependencies with: `npm install`
- Right now we don't have a (public) npm package for one dependency, the @ripe-rnd/ui-components library. You'll have to link this manually like this:
  - Clone the ui-components library `git clone git@github.com:RIPE-NCC/rnd-ui-components.git` in a directory of your liking.
  - Go into the root of the library with `cd ui-components`
  - Make a linked local package out of this repo with `npm link`
  - Now go (back) into the `template/eyeballsgraph/` diretory of the ixp-country-jedi repo and install the linked package with `npm link @ripe-rnd/ui-components`.
- Now you can start the dev server with `npm start` and go with you favourite web-browser to `localhost:4042`

In the future we will have a npm package of the @ripe-rnd/ui-components and the link steps will go away.

Note that you might run into trouble with the CORS settings of the RIPE NCC webservers when making XHR calls to the json files hosted on the webservers of the RIPE NCC. A workaround is to locally edit your /etc/hosts file to point localhost to something.ripe.net and change the webpack-dev-server port to port 80. Now if you go to https://something.ripe.net on your browser you'll be able to download the JSON files (the CORS headers are set to *.ripe.net).
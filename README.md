# The Monochord

This is the backend and frontend code for the microtonal music app [The Monochord](http://the-monochord.com)

## How to get the project running locally

### Setup HTTPS and subdomains

**1** [Follow these steps](/docs/cert.md) to create a cert for local environment.

**2** Import cert to Chrome

On windows: Open `chrome://settings/?search=Manage+certificates`
Go to the "trusted root authority" panel and import rootCA.crt

On mac: double click on rootCA.crt to add it to the keychain. once added set it to be always trusted

**3** Add subdomain to hosts file

Don't forget to add the following line to `/etc/hosts`:

```
127.0.0.1 cdn.localhost
```

_(apparently wildcards don't work in hosts files, so we can't just write *.localhost)_

### Create .env file

_TODO: describe what fields are needed_

### Start a local dev server

Simply run `npm run dev`, which will host a http and https version of the page with live reload.

It will also watch files inside the `src`, `views` and `static-cdn` folder for changes and it will
restart the server automatically.

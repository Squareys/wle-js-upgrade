# Wonderland Engine JavaScript Upgrade Script

Upgrade JavaScript components to Wonderland Engine 1.0.0 API.

Note: This script is not a silver bullet, it aims to get you 90% of the
way on 90% of scripts, often scripts will need manual adjustment.

# Install

```
npm i -g wle-js-upgrade
```

# Usage

The command upgrades JavaScript files in-place.
```
wle-js-upgrade your-script.js
wle-js-upgrade *.js
```

# Running the tests

Before running the tests, make sure to link the package to make the
command globally available. This is done to allow testing of the
CLI interface.

```sh
npm run build
npm link
npm run test
```

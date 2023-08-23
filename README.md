<!--
 Copyright (c) 2023 Anthony Mugendi

 This software is released under the MIT License.
 https://opensource.org/licenses/MIT
-->

# liveRoute
Watch and reload your routes whenever they change without using tools like [nodemon](https://www.npmjs.com/package/nodemon).

## How to use

Assume you have the router file **./routes/files.js**

```javascript
const express = require('express');
const router = express.Router();

// directory browser route 
router.get('/:dir', async (req, res, next) => {
    let { dir } = req.params;

    // .... do whatever

    res.json({ dir, files:[]});
});

module.exports = router;
```

This is how you would 'live-load' it...

```javascript
const express = require('express');
const app = express();

// require
const LiveRoute = require('liveroute');
// initialize by passing app
const liveRoute = new LiveRoute(app);

// then, pass the route & router file
liveRoute.use('/files', './routes/files.js');
```

Now, behind the scenes, **liveRoute** will load the route file using: 
`app.use('/files', require('./routes/files.js'))`

Then, **liveRoute** uses [watch-modules](https://www.npmjs.com/package/watch-modules) to watch for any changes and reloads the route on change. This means that the route file and all other modules required by it are watched, ensuring your routes are properly live-reloaded.

It is of course a little more complex than explained here but ion general, I use [this approach](https://codeburst.io/dont-use-nodemon-there-are-better-ways-fc016b50b45e) approach.

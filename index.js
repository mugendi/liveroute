/**
 * Copyright (c) 2023 Anthony Mugendi
 * 
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */


const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const reload = require('require-reload')(require);

class HotRouter {
    constructor(app) {
        if (!app.hasOwnProperty('listen') || typeof app.listen !== 'function') {
            throw new Error(
                'You can only instanciate HotRouter with a valid Express App Instance. Got ',
                typeof app
            );
        }

        this.routers = {};

        this.app = app;
    }

    use(routePath = '*', routerFile = null) {
        let self = this;

        if (
            typeof routePath !== 'string' ||
            // simple route validation
            /^[\*\/]/.test(routePath) == false
        ) {
            throw new Error('2nd should be a route/path such as "/api"');
        }

        const routerPath = path.resolve(routerFile);
        if (!fs.existsSync(routerPath)) {
            throw new Error(`Route File "${routePath} does not exist!`);
        }

        const router = reload(routerPath);

        // simple test to ensure is router
        if (
            !router ||
            'stack' in router === false ||
            !Array.isArray(router.stack)
        ) {
            throw new Error('1st argument should be a router object.');
        }

        // ok we can use this router
        self.routers[routerPath] = router;

        // watch & reload file on change
        // this ensures we only require the file when it has changed & not with every call
        chokidar.watch(routerPath).on('change', (filePath) => {
            // console.log(routerPath, ' changed...');
            self.routers[routerPath] = reload(routerPath);
        });

        this.app.use(routePath, function (req, res, next) {
            return self.routers[routerPath](req, res, next);
        });
    }
}

module.exports = HotRouter;

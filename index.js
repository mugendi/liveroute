/**
 * Copyright (c) 2023 Anthony Mugendi
 *
 * This software is released under the MIT License.
 * https://opensource.org/licenses/MIT
 */

const path = require('path');
const fs = require('fs');
// const chokidar = require('chokidar');
const clearModule = require('clear-module');
const FamilyWatcher = require('../watch-modules');
const familyWatcher = new FamilyWatcher();
const logger = require('debug-symbols')('liveRoute');

class HotRouter {
    constructor(app) {
        if (!app.hasOwnProperty('listen') || typeof app.listen !== 'function') {
            throw new Error(
                'You can only instanciate HotRouter with a valid Express App Instance. Got ',
                typeof app
            );
        }

        this.routers = {};
        this.watchers = {};

        this.app = app;
    }

    async use(routePath = '*', routerFile = null) {
        let self = this;
        try {
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

            const { router } = this.__load_route(routerPath);

            // simple test to ensure is router
            if (
                !router ||
                'stack' in router === false ||
                !Array.isArray(router.stack)
            ) {
                throw new Error('1st argument should be a router object.');
            }

            let watcher = await familyWatcher.watch(routerPath);
            watcher.on('change', (filePath) => {
                logger.info(`Reloading route file: ${routerFile}`);
                this.__load_route(routerPath);
            });

            // we noe use 'app.use' so that we can pass the request to our route
            this.app.use(routePath, function (req, res, next) {
                // ensure loaded
                if (typeof self.routers[routerPath].router !== 'function') {
                    self.__load_route(routerPath);
                }

                return self.routers[routerPath].router(req, res, next);
            });
        } catch (error) {
            throw error;
        }
    }

    __load_route(routerPath) {
        // always clear to ensure fresh requires
        clearModule(routerPath);

        // NOTE: We store the router in this.routers[routerPath].router
        // this allows us to simply update this object without running app.use multiple times

        // router...
        this.routers[routerPath] = { router: require(routerPath) };

        return this.routers[routerPath];
    }
}

module.exports = HotRouter;

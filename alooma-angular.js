'use strict';

/**
 * Wraps the alooma JavaScript global to make it injectable and aid in testing.
 * Requires an injectable aloomaApiKey to be present. This can be easily done
 * by configuring the module like so:
 *
 *    angular.module('analytics.alooma')
 *        .config(['$aloomaProvider', function($aloomaProvider) {
 *            $aloomaProvider.setApiKey('<the key>');
 *        }]);
 */
angular.module('analytics.alooma', [])
    .provider('$alooma', function () {
        var apiKey, superProperties, config;

        /**
         * Init the alooma global
         */
        function init() {
            if (!Object.prototype.hasOwnProperty.call(window, 'alooma')) {
                throw 'Global `alooma` not available. Did you forget to include the library on the page?';
            }

            alooma.init(apiKey, config);

            waitTillAsyncApiLoaded(function () {
                if (superProperties) alooma.register(superProperties);
            });
        }

        /**
         * Wait till the async portion of the Alooma lib has loaded otherwise we'll end up passing back a reference
         * to a bare JS array which won't actually track anything when called.
         *
         * @param callback to be called once the API has finished loading
         */
        function waitTillAsyncApiLoaded(callback) {
            if (!Object.prototype.hasOwnProperty.call(window, 'alooma') || (window.alooma['__loaded'] === undefined)) {
                setTimeout(function () {
                    waitTillAsyncApiLoaded(callback);
                }, 500);
            }

            callback();
        }

        /**
         * Perform a dynamic call to the specified alooma function against the window.alooma object.
         *
         * @param name the alooma function name. Can be dot separated to specify sub-property functions
         * @returns {Function} a function that will lookup and dispatch a call to the window.alooma object
         */
        function callAloomaFn(name) {
            return function () {
                var fn = window.alooma,
                    parts = name.split('.'),
                    scope, i;

                for (i = 0; i < parts.length; i++) {
                    scope = fn;
                    fn = fn[parts[i]];
                }

                return fn.apply(scope, arguments);
            };
        }

        /**
         * Get or set the Alooma API key. This can be done via a provider config.
         *
         * @param key your Alooma API key
         */
        this.apiKey = function (key) {
            if (!key) return apiKey;

            apiKey = key;
        };

        /**
         * Get or set the Alooma API config. This can be done via a provider config.
         *
         * @param userConfig your Alooma custom config
         */
        this.config = function (userConfig) {
            if (!userConfig) return config;

            config = userConfig;
        };

        /**
         * Get or set a special set of properties to include/send with every event.
         *
         * @param properties a map properties
         *
         * @see https://alooma.com/help/reference/javascript#super-properties
         */
        this.superProperties = function (properties) {
            if (!properties) return superProperties;

            superProperties = properties;
        };

        this.$get = function () {
            init();

            // This is a bit of a gross hack but here we dynamically call the alooma functions against the
            // window.mixpanel object as we can't be sure when the window reference will be updated.
            return {
                init: callAloomaFn('init'),
                push: callAloomaFn('push'),
                disable: callAloomaFn('disable'),
                track: callAloomaFn('track'),
                track_links: callAloomaFn('track_links'),
                track_forms: callAloomaFn('track_forms'),
                register: callAloomaFn('register'),
                register_once: callAloomaFn('register_once'),
                unregister: callAloomaFn('unregister'),
                identify: callAloomaFn('identify'),
                get_distinct_id: callAloomaFn('get_distinct_id'),
                alias: callAloomaFn('alias'),
                set_config: callAloomaFn('set_config'),
                get_config: callAloomaFn('get_config'),
                get_property: callAloomaFn('get_property'),
                people: {
                    set: callAloomaFn('people.set'),
                    set_once: callAloomaFn('people.set_once'),
                    increment: callAloomaFn('people.increment'),
                    append: callAloomaFn('people.append'),
                    track_charge: callAloomaFn('people.track_charge'),
                    clear_charges: callAloomaFn('people.clear_charges'),
                    delete_user: callAloomaFn('people.delete_user')
                }
            };
        };
    });


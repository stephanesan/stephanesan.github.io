(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.listPersistencePlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global App */
var _             = App._;
var plugin        = ({"github":{"clientId":"stephanesan","clientSecret":"..."}} || {}).github || {};
var CLIENT_ID     = plugin.clientId;

// Detect if the plugin is not enabled.
if (!CLIENT_ID) {
  console.warn('GitHub plugin has not been configured. Please set the ' +
    '`clientId` in your config to use it.');
}

/**
 * Check whether a gist contents are a valid notebook.
 *
 * @param  {Object}  content
 * @return {Boolean}
 */
var isNotebookContent = function (content) {
  return content && content.files && content.files['notebook.md'];
};

/**
 * Parse the link header for the specific links.
 *
 * @param  {String} header
 * @return {Object}
 */
var parseLinkHeader = function (header) {
  var obj = {};

  _.each(header.split(', '), function (part) {
    var matches = /^<([^>]+)>; *rel="([^"]+)"$/.exec(part);
    return matches && (obj[matches[2]] = matches[1]);
  });

  return obj;
};

/**
 * Make saves to the server less frequently. Handles multiple notebooks saving
 * concurrently.
 *
 * @type {Function}
 */
var debounceSave = (function (hash) {
  return function (data) {
    // Remove any previously queued save request for the same resource.
    if (hash[data.id]) {
      clearTimeout(hash[data.id]);
      delete hash[data.id];
    }

    hash[data.id] = setTimeout(function () {
      return data.shouldSave() && data.save();
    }, 600);
  };
})({});

/**
 * When a change occurs *and* we are already authenticated, we can automatically
 * save the update to a gist.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var changePlugin = function (data, next, done) {
  debounceSave(data);

  return done();
};

/**
 * Get the authenticated user id and title by making a request on the users
 * behalf.
 *
 * @param {Function} done
 */
var authenticatedUserId = function (done) {

    return done(null, {
      userId:    CLIENT_ID,
      userTitle: CLIENT_ID 
    });
 
};

/**
 * Authenticate with the github oauth endpoint. Since we are unlikely to include
 * our client secret with the client code, you'll probably want to include the
 * proxy plugin (`./proxy.js`).
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var authenticatePlugin = function (data, next, done) {
    return authenticatedUserId(done);
};

/**
 * Unauthenticate the user.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var unauthenticatePlugin = function (data, next, done) {
  return done();
};

/**
 * Check whether we are authenticated to Github.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var authenticatedPlugin = function (data, next, done) {
  return authenticatedUserId(done);
};

/**
 * Loads a single gist id from Github and checks whether it holds our notebook.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var loadPlugin = function (data, next, done) {
  if (!data.id) {
    return next();
  }

  App.middleware.trigger('ajax', {
    // Add the application client id and secret to load requests to avoid rate
    // limiting in the case that the user is unauthenticated.
    url:    data.id,
    proxy:  false,
    method: 'GET',
  }, function (err, xhr) {
    var content;

    try {
      content = JSON.parse(xhr.responseText);
    } catch (e) {
      return next(e);
    }

    data.ownerId    = CLIENT_ID;
    data.ownerTitle = CLIENT_ID;
    data.content    = atob(content.content);
    return done();
  });
};

/**
 * Save the notebook into a single Github gist for persistence. If the user is
 * not yet authenticated, we'll attempt to do a smoother on boarding by showing
 * a help dialog.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var savePlugin = function (data, next, done) {
    return next(new Error('Request not supported'));
};

/**
 * Push all suitable gists into the list of notebooks.
 *
 * @param {Array}    list
 * @param {Function} next
 * @param {Function} done
 */
var listPlugin = function (list, next, done) {

    var items = App.config.get('list');
    for(var i=0; i<items.length; i++)
        list.push(items[i]);
    return done();
};

/**
 * Delete a single notebook from Github gists.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var removePlugin = function (data, next, done) {
    return next(new Error('Request not supported'));
};

/**
 * Set the config option for the authentication text.
 */
App.config.set('authenticateText', 'Get gist from '+CLIENT_ID);

/**
 * A { key: function } map of all middleware used in the plugin.
 *
 * @type {Object}
 */
module.exports = {
  'persistence:change':         changePlugin,
  'persistence:authenticate':   authenticatePlugin,
  'persistence:unauthenticate': unauthenticatePlugin,
  'persistence:authenticated':  authenticatedPlugin,
  'persistence:load':           loadPlugin,
  'persistence:save':           savePlugin,
  'persistence:list':           listPlugin,
  'persistence:remove':         removePlugin
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9wbHVnaW5zL2xpc3QtcGVyc2lzdGVuY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZ2xvYmFsIEFwcCAqL1xudmFyIF8gICAgICAgICAgICAgPSBBcHAuXztcbnZhciBwbHVnaW4gICAgICAgID0gKHtcImdpdGh1YlwiOntcImNsaWVudElkXCI6XCJzdGVwaGFuZXNhblwiLFwiY2xpZW50U2VjcmV0XCI6XCIuLi5cIn19IHx8IHt9KS5naXRodWIgfHwge307XG52YXIgQ0xJRU5UX0lEICAgICA9IHBsdWdpbi5jbGllbnRJZDtcblxuLy8gRGV0ZWN0IGlmIHRoZSBwbHVnaW4gaXMgbm90IGVuYWJsZWQuXG5pZiAoIUNMSUVOVF9JRCkge1xuICBjb25zb2xlLndhcm4oJ0dpdEh1YiBwbHVnaW4gaGFzIG5vdCBiZWVuIGNvbmZpZ3VyZWQuIFBsZWFzZSBzZXQgdGhlICcgK1xuICAgICdgY2xpZW50SWRgIGluIHlvdXIgY29uZmlnIHRvIHVzZSBpdC4nKTtcbn1cblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGEgZ2lzdCBjb250ZW50cyBhcmUgYSB2YWxpZCBub3RlYm9vay5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9ICBjb250ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG52YXIgaXNOb3RlYm9va0NvbnRlbnQgPSBmdW5jdGlvbiAoY29udGVudCkge1xuICByZXR1cm4gY29udGVudCAmJiBjb250ZW50LmZpbGVzICYmIGNvbnRlbnQuZmlsZXNbJ25vdGVib29rLm1kJ107XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBsaW5rIGhlYWRlciBmb3IgdGhlIHNwZWNpZmljIGxpbmtzLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gaGVhZGVyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbnZhciBwYXJzZUxpbmtIZWFkZXIgPSBmdW5jdGlvbiAoaGVhZGVyKSB7XG4gIHZhciBvYmogPSB7fTtcblxuICBfLmVhY2goaGVhZGVyLnNwbGl0KCcsICcpLCBmdW5jdGlvbiAocGFydCkge1xuICAgIHZhciBtYXRjaGVzID0gL148KFtePl0rKT47ICpyZWw9XCIoW15cIl0rKVwiJC8uZXhlYyhwYXJ0KTtcbiAgICByZXR1cm4gbWF0Y2hlcyAmJiAob2JqW21hdGNoZXNbMl1dID0gbWF0Y2hlc1sxXSk7XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59O1xuXG4vKipcbiAqIE1ha2Ugc2F2ZXMgdG8gdGhlIHNlcnZlciBsZXNzIGZyZXF1ZW50bHkuIEhhbmRsZXMgbXVsdGlwbGUgbm90ZWJvb2tzIHNhdmluZ1xuICogY29uY3VycmVudGx5LlxuICpcbiAqIEB0eXBlIHtGdW5jdGlvbn1cbiAqL1xudmFyIGRlYm91bmNlU2F2ZSA9IChmdW5jdGlvbiAoaGFzaCkge1xuICByZXR1cm4gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAvLyBSZW1vdmUgYW55IHByZXZpb3VzbHkgcXVldWVkIHNhdmUgcmVxdWVzdCBmb3IgdGhlIHNhbWUgcmVzb3VyY2UuXG4gICAgaWYgKGhhc2hbZGF0YS5pZF0pIHtcbiAgICAgIGNsZWFyVGltZW91dChoYXNoW2RhdGEuaWRdKTtcbiAgICAgIGRlbGV0ZSBoYXNoW2RhdGEuaWRdO1xuICAgIH1cblxuICAgIGhhc2hbZGF0YS5pZF0gPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBkYXRhLnNob3VsZFNhdmUoKSAmJiBkYXRhLnNhdmUoKTtcbiAgICB9LCA2MDApO1xuICB9O1xufSkoe30pO1xuXG4vKipcbiAqIFdoZW4gYSBjaGFuZ2Ugb2NjdXJzICphbmQqIHdlIGFyZSBhbHJlYWR5IGF1dGhlbnRpY2F0ZWQsIHdlIGNhbiBhdXRvbWF0aWNhbGx5XG4gKiBzYXZlIHRoZSB1cGRhdGUgdG8gYSBnaXN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGNoYW5nZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIGRlYm91bmNlU2F2ZShkYXRhKTtcblxuICByZXR1cm4gZG9uZSgpO1xufTtcblxuLyoqXG4gKiBHZXQgdGhlIGF1dGhlbnRpY2F0ZWQgdXNlciBpZCBhbmQgdGl0bGUgYnkgbWFraW5nIGEgcmVxdWVzdCBvbiB0aGUgdXNlcnNcbiAqIGJlaGFsZi5cbiAqXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBhdXRoZW50aWNhdGVkVXNlcklkID0gZnVuY3Rpb24gKGRvbmUpIHtcblxuICAgIHJldHVybiBkb25lKG51bGwsIHtcbiAgICAgIHVzZXJJZDogICAgQ0xJRU5UX0lELFxuICAgICAgdXNlclRpdGxlOiBDTElFTlRfSUQgXG4gICAgfSk7XG4gXG59O1xuXG4vKipcbiAqIEF1dGhlbnRpY2F0ZSB3aXRoIHRoZSBnaXRodWIgb2F1dGggZW5kcG9pbnQuIFNpbmNlIHdlIGFyZSB1bmxpa2VseSB0byBpbmNsdWRlXG4gKiBvdXIgY2xpZW50IHNlY3JldCB3aXRoIHRoZSBjbGllbnQgY29kZSwgeW91J2xsIHByb2JhYmx5IHdhbnQgdG8gaW5jbHVkZSB0aGVcbiAqIHByb3h5IHBsdWdpbiAoYC4vcHJveHkuanNgKS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBhdXRoZW50aWNhdGVQbHVnaW4gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICAgIHJldHVybiBhdXRoZW50aWNhdGVkVXNlcklkKGRvbmUpO1xufTtcblxuLyoqXG4gKiBVbmF1dGhlbnRpY2F0ZSB0aGUgdXNlci5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciB1bmF1dGhlbnRpY2F0ZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIHJldHVybiBkb25lKCk7XG59O1xuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgd2UgYXJlIGF1dGhlbnRpY2F0ZWQgdG8gR2l0aHViLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGF1dGhlbnRpY2F0ZWRQbHVnaW4gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICByZXR1cm4gYXV0aGVudGljYXRlZFVzZXJJZChkb25lKTtcbn07XG5cbi8qKlxuICogTG9hZHMgYSBzaW5nbGUgZ2lzdCBpZCBmcm9tIEdpdGh1YiBhbmQgY2hlY2tzIHdoZXRoZXIgaXQgaG9sZHMgb3VyIG5vdGVib29rLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGxvYWRQbHVnaW4gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICBpZiAoIWRhdGEuaWQpIHtcbiAgICByZXR1cm4gbmV4dCgpO1xuICB9XG5cbiAgQXBwLm1pZGRsZXdhcmUudHJpZ2dlcignYWpheCcsIHtcbiAgICAvLyBBZGQgdGhlIGFwcGxpY2F0aW9uIGNsaWVudCBpZCBhbmQgc2VjcmV0IHRvIGxvYWQgcmVxdWVzdHMgdG8gYXZvaWQgcmF0ZVxuICAgIC8vIGxpbWl0aW5nIGluIHRoZSBjYXNlIHRoYXQgdGhlIHVzZXIgaXMgdW5hdXRoZW50aWNhdGVkLlxuICAgIHVybDogICAgZGF0YS5pZCxcbiAgICBwcm94eTogIGZhbHNlLFxuICAgIG1ldGhvZDogJ0dFVCcsXG4gIH0sIGZ1bmN0aW9uIChlcnIsIHhocikge1xuICAgIHZhciBjb250ZW50O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnRlbnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBuZXh0KGUpO1xuICAgIH1cblxuICAgIGRhdGEub3duZXJJZCAgICA9IENMSUVOVF9JRDtcbiAgICBkYXRhLm93bmVyVGl0bGUgPSBDTElFTlRfSUQ7XG4gICAgZGF0YS5jb250ZW50ICAgID0gYXRvYihjb250ZW50LmNvbnRlbnQpO1xuICAgIHJldHVybiBkb25lKCk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBTYXZlIHRoZSBub3RlYm9vayBpbnRvIGEgc2luZ2xlIEdpdGh1YiBnaXN0IGZvciBwZXJzaXN0ZW5jZS4gSWYgdGhlIHVzZXIgaXNcbiAqIG5vdCB5ZXQgYXV0aGVudGljYXRlZCwgd2UnbGwgYXR0ZW1wdCB0byBkbyBhIHNtb290aGVyIG9uIGJvYXJkaW5nIGJ5IHNob3dpbmdcbiAqIGEgaGVscCBkaWFsb2cuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgc2F2ZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gICAgcmV0dXJuIG5leHQobmV3IEVycm9yKCdSZXF1ZXN0IG5vdCBzdXBwb3J0ZWQnKSk7XG59O1xuXG4vKipcbiAqIFB1c2ggYWxsIHN1aXRhYmxlIGdpc3RzIGludG8gdGhlIGxpc3Qgb2Ygbm90ZWJvb2tzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9ICAgIGxpc3RcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGxpc3RQbHVnaW4gPSBmdW5jdGlvbiAobGlzdCwgbmV4dCwgZG9uZSkge1xuXG4gICAgdmFyIGl0ZW1zID0gQXBwLmNvbmZpZy5nZXQoJ2xpc3QnKTtcbiAgICBmb3IodmFyIGk9MDsgaTxpdGVtcy5sZW5ndGg7IGkrKylcbiAgICAgICAgbGlzdC5wdXNoKGl0ZW1zW2ldKTtcbiAgICByZXR1cm4gZG9uZSgpO1xufTtcblxuLyoqXG4gKiBEZWxldGUgYSBzaW5nbGUgbm90ZWJvb2sgZnJvbSBHaXRodWIgZ2lzdHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgcmVtb3ZlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ1JlcXVlc3Qgbm90IHN1cHBvcnRlZCcpKTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb25maWcgb3B0aW9uIGZvciB0aGUgYXV0aGVudGljYXRpb24gdGV4dC5cbiAqL1xuQXBwLmNvbmZpZy5zZXQoJ2F1dGhlbnRpY2F0ZVRleHQnLCAnR2V0IGdpc3QgZnJvbSAnK0NMSUVOVF9JRCk7XG5cbi8qKlxuICogQSB7IGtleTogZnVuY3Rpb24gfSBtYXAgb2YgYWxsIG1pZGRsZXdhcmUgdXNlZCBpbiB0aGUgcGx1Z2luLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAncGVyc2lzdGVuY2U6Y2hhbmdlJzogICAgICAgICBjaGFuZ2VQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTphdXRoZW50aWNhdGUnOiAgIGF1dGhlbnRpY2F0ZVBsdWdpbixcbiAgJ3BlcnNpc3RlbmNlOnVuYXV0aGVudGljYXRlJzogdW5hdXRoZW50aWNhdGVQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTphdXRoZW50aWNhdGVkJzogIGF1dGhlbnRpY2F0ZWRQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpsb2FkJzogICAgICAgICAgIGxvYWRQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpzYXZlJzogICAgICAgICAgIHNhdmVQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpsaXN0JzogICAgICAgICAgIGxpc3RQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpyZW1vdmUnOiAgICAgICAgIHJlbW92ZVBsdWdpblxufTtcbiJdfQ==

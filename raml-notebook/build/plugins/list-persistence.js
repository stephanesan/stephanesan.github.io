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
    for(var i=0; i<items.length; i++) {
        if(items[i]) list.push(items[i]);
    }
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9wbHVnaW5zL2xpc3QtcGVyc2lzdGVuY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgQXBwICovXG52YXIgXyAgICAgICAgICAgICA9IEFwcC5fO1xudmFyIHBsdWdpbiAgICAgICAgPSAoe1wiZ2l0aHViXCI6e1wiY2xpZW50SWRcIjpcInN0ZXBoYW5lc2FuXCIsXCJjbGllbnRTZWNyZXRcIjpcIi4uLlwifX0gfHwge30pLmdpdGh1YiB8fCB7fTtcbnZhciBDTElFTlRfSUQgICAgID0gcGx1Z2luLmNsaWVudElkO1xuXG4vLyBEZXRlY3QgaWYgdGhlIHBsdWdpbiBpcyBub3QgZW5hYmxlZC5cbmlmICghQ0xJRU5UX0lEKSB7XG4gIGNvbnNvbGUud2FybignR2l0SHViIHBsdWdpbiBoYXMgbm90IGJlZW4gY29uZmlndXJlZC4gUGxlYXNlIHNldCB0aGUgJyArXG4gICAgJ2BjbGllbnRJZGAgaW4geW91ciBjb25maWcgdG8gdXNlIGl0LicpO1xufVxuXG4vKipcbiAqIENoZWNrIHdoZXRoZXIgYSBnaXN0IGNvbnRlbnRzIGFyZSBhIHZhbGlkIG5vdGVib29rLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gIGNvbnRlbnRcbiAqIEByZXR1cm4ge0Jvb2xlYW59XG4gKi9cbnZhciBpc05vdGVib29rQ29udGVudCA9IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gIHJldHVybiBjb250ZW50ICYmIGNvbnRlbnQuZmlsZXMgJiYgY29udGVudC5maWxlc1snbm90ZWJvb2subWQnXTtcbn07XG5cbi8qKlxuICogUGFyc2UgdGhlIGxpbmsgaGVhZGVyIGZvciB0aGUgc3BlY2lmaWMgbGlua3MuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBoZWFkZXJcbiAqIEByZXR1cm4ge09iamVjdH1cbiAqL1xudmFyIHBhcnNlTGlua0hlYWRlciA9IGZ1bmN0aW9uIChoZWFkZXIpIHtcbiAgdmFyIG9iaiA9IHt9O1xuXG4gIF8uZWFjaChoZWFkZXIuc3BsaXQoJywgJyksIGZ1bmN0aW9uIChwYXJ0KSB7XG4gICAgdmFyIG1hdGNoZXMgPSAvXjwoW14+XSspPjsgKnJlbD1cIihbXlwiXSspXCIkLy5leGVjKHBhcnQpO1xuICAgIHJldHVybiBtYXRjaGVzICYmIChvYmpbbWF0Y2hlc1syXV0gPSBtYXRjaGVzWzFdKTtcbiAgfSk7XG5cbiAgcmV0dXJuIG9iajtcbn07XG5cbi8qKlxuICogTWFrZSBzYXZlcyB0byB0aGUgc2VydmVyIGxlc3MgZnJlcXVlbnRseS4gSGFuZGxlcyBtdWx0aXBsZSBub3RlYm9va3Mgc2F2aW5nXG4gKiBjb25jdXJyZW50bHkuXG4gKlxuICogQHR5cGUge0Z1bmN0aW9ufVxuICovXG52YXIgZGVib3VuY2VTYXZlID0gKGZ1bmN0aW9uIChoYXNoKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoZGF0YSkge1xuICAgIC8vIFJlbW92ZSBhbnkgcHJldmlvdXNseSBxdWV1ZWQgc2F2ZSByZXF1ZXN0IGZvciB0aGUgc2FtZSByZXNvdXJjZS5cbiAgICBpZiAoaGFzaFtkYXRhLmlkXSkge1xuICAgICAgY2xlYXJUaW1lb3V0KGhhc2hbZGF0YS5pZF0pO1xuICAgICAgZGVsZXRlIGhhc2hbZGF0YS5pZF07XG4gICAgfVxuXG4gICAgaGFzaFtkYXRhLmlkXSA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGRhdGEuc2hvdWxkU2F2ZSgpICYmIGRhdGEuc2F2ZSgpO1xuICAgIH0sIDYwMCk7XG4gIH07XG59KSh7fSk7XG5cbi8qKlxuICogV2hlbiBhIGNoYW5nZSBvY2N1cnMgKmFuZCogd2UgYXJlIGFscmVhZHkgYXV0aGVudGljYXRlZCwgd2UgY2FuIGF1dG9tYXRpY2FsbHlcbiAqIHNhdmUgdGhlIHVwZGF0ZSB0byBhIGdpc3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgY2hhbmdlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgZGVib3VuY2VTYXZlKGRhdGEpO1xuXG4gIHJldHVybiBkb25lKCk7XG59O1xuXG4vKipcbiAqIEdldCB0aGUgYXV0aGVudGljYXRlZCB1c2VyIGlkIGFuZCB0aXRsZSBieSBtYWtpbmcgYSByZXF1ZXN0IG9uIHRoZSB1c2Vyc1xuICogYmVoYWxmLlxuICpcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGF1dGhlbnRpY2F0ZWRVc2VySWQgPSBmdW5jdGlvbiAoZG9uZSkge1xuXG4gICAgcmV0dXJuIGRvbmUobnVsbCwge1xuICAgICAgdXNlcklkOiAgICBDTElFTlRfSUQsXG4gICAgICB1c2VyVGl0bGU6IENMSUVOVF9JRCBcbiAgICB9KTtcbiBcbn07XG5cbi8qKlxuICogQXV0aGVudGljYXRlIHdpdGggdGhlIGdpdGh1YiBvYXV0aCBlbmRwb2ludC4gU2luY2Ugd2UgYXJlIHVubGlrZWx5IHRvIGluY2x1ZGVcbiAqIG91ciBjbGllbnQgc2VjcmV0IHdpdGggdGhlIGNsaWVudCBjb2RlLCB5b3UnbGwgcHJvYmFibHkgd2FudCB0byBpbmNsdWRlIHRoZVxuICogcHJveHkgcGx1Z2luIChgLi9wcm94eS5qc2ApLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGF1dGhlbnRpY2F0ZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gICAgcmV0dXJuIGF1dGhlbnRpY2F0ZWRVc2VySWQoZG9uZSk7XG59O1xuXG4vKipcbiAqIFVuYXV0aGVudGljYXRlIHRoZSB1c2VyLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIHVuYXV0aGVudGljYXRlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgcmV0dXJuIGRvbmUoKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB3ZSBhcmUgYXV0aGVudGljYXRlZCB0byBHaXRodWIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgYXV0aGVudGljYXRlZFBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIHJldHVybiBhdXRoZW50aWNhdGVkVXNlcklkKGRvbmUpO1xufTtcblxuLyoqXG4gKiBMb2FkcyBhIHNpbmdsZSBnaXN0IGlkIGZyb20gR2l0aHViIGFuZCBjaGVja3Mgd2hldGhlciBpdCBob2xkcyBvdXIgbm90ZWJvb2suXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgbG9hZFBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIGlmICghZGF0YS5pZCkge1xuICAgIHJldHVybiBuZXh0KCk7XG4gIH1cblxuICBBcHAubWlkZGxld2FyZS50cmlnZ2VyKCdhamF4Jywge1xuICAgIC8vIEFkZCB0aGUgYXBwbGljYXRpb24gY2xpZW50IGlkIGFuZCBzZWNyZXQgdG8gbG9hZCByZXF1ZXN0cyB0byBhdm9pZCByYXRlXG4gICAgLy8gbGltaXRpbmcgaW4gdGhlIGNhc2UgdGhhdCB0aGUgdXNlciBpcyB1bmF1dGhlbnRpY2F0ZWQuXG4gICAgdXJsOiAgICBkYXRhLmlkLFxuICAgIHByb3h5OiAgZmFsc2UsXG4gICAgbWV0aG9kOiAnR0VUJyxcbiAgfSwgZnVuY3Rpb24gKGVyciwgeGhyKSB7XG4gICAgdmFyIGNvbnRlbnQ7XG5cbiAgICB0cnkge1xuICAgICAgY29udGVudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG5leHQoZSk7XG4gICAgfVxuXG4gICAgZGF0YS5vd25lcklkICAgID0gQ0xJRU5UX0lEO1xuICAgIGRhdGEub3duZXJUaXRsZSA9IENMSUVOVF9JRDtcbiAgICBkYXRhLmNvbnRlbnQgICAgPSBhdG9iKGNvbnRlbnQuY29udGVudCk7XG4gICAgcmV0dXJuIGRvbmUoKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFNhdmUgdGhlIG5vdGVib29rIGludG8gYSBzaW5nbGUgR2l0aHViIGdpc3QgZm9yIHBlcnNpc3RlbmNlLiBJZiB0aGUgdXNlciBpc1xuICogbm90IHlldCBhdXRoZW50aWNhdGVkLCB3ZSdsbCBhdHRlbXB0IHRvIGRvIGEgc21vb3RoZXIgb24gYm9hcmRpbmcgYnkgc2hvd2luZ1xuICogYSBoZWxwIGRpYWxvZy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBzYXZlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ1JlcXVlc3Qgbm90IHN1cHBvcnRlZCcpKTtcbn07XG5cbi8qKlxuICogUHVzaCBhbGwgc3VpdGFibGUgZ2lzdHMgaW50byB0aGUgbGlzdCBvZiBub3RlYm9va3MuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gICAgbGlzdFxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgbGlzdFBsdWdpbiA9IGZ1bmN0aW9uIChsaXN0LCBuZXh0LCBkb25lKSB7XG5cbiAgICB2YXIgaXRlbXMgPSBBcHAuY29uZmlnLmdldCgnbGlzdCcpO1xuICAgIGZvcih2YXIgaT0wOyBpPGl0ZW1zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmKGl0ZW1zW2ldKSBsaXN0LnB1c2goaXRlbXNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gZG9uZSgpO1xufTtcblxuLyoqXG4gKiBEZWxldGUgYSBzaW5nbGUgbm90ZWJvb2sgZnJvbSBHaXRodWIgZ2lzdHMuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgcmVtb3ZlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ1JlcXVlc3Qgbm90IHN1cHBvcnRlZCcpKTtcbn07XG5cbi8qKlxuICogU2V0IHRoZSBjb25maWcgb3B0aW9uIGZvciB0aGUgYXV0aGVudGljYXRpb24gdGV4dC5cbiAqL1xuQXBwLmNvbmZpZy5zZXQoJ2F1dGhlbnRpY2F0ZVRleHQnLCAnR2V0IGdpc3QgZnJvbSAnK0NMSUVOVF9JRCk7XG5cbi8qKlxuICogQSB7IGtleTogZnVuY3Rpb24gfSBtYXAgb2YgYWxsIG1pZGRsZXdhcmUgdXNlZCBpbiB0aGUgcGx1Z2luLlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbm1vZHVsZS5leHBvcnRzID0ge1xuICAncGVyc2lzdGVuY2U6Y2hhbmdlJzogICAgICAgICBjaGFuZ2VQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTphdXRoZW50aWNhdGUnOiAgIGF1dGhlbnRpY2F0ZVBsdWdpbixcbiAgJ3BlcnNpc3RlbmNlOnVuYXV0aGVudGljYXRlJzogdW5hdXRoZW50aWNhdGVQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTphdXRoZW50aWNhdGVkJzogIGF1dGhlbnRpY2F0ZWRQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpsb2FkJzogICAgICAgICAgIGxvYWRQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpzYXZlJzogICAgICAgICAgIHNhdmVQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpsaXN0JzogICAgICAgICAgIGxpc3RQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTpyZW1vdmUnOiAgICAgICAgIHJlbW92ZVBsdWdpblxufTtcbiJdfQ==

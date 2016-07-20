(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.publicGistPlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    url:    'https://api.github.com/gists/' + data.id /*+ '?_=' + Date.now()*/,
    proxy:  false,
    method: 'GET',
  }, function (err, xhr) {
    var content;

    try {
      content = JSON.parse(xhr.responseText);
    } catch (e) {
      return next(e);
    }

    if (!isNotebookContent(content)) {
      return next(new Error('Unexpected notebook response'));
    }

    data.id         = content.id;
    data.ownerId    = content.owner.id;
    data.ownerTitle = content.owner.login;
    data.content    = content.files['notebook.md'].content;
    data.updatedAt  = new Date(content.updated_at);
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

  (function recurse (link) {
    App.middleware.trigger('ajax', {
      url:    link + (link.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now(),
      proxy:  false,
      method: 'GET'
    }, function (err, xhr) {
      if (err) { return done(err); }

      var nextLink = parseLinkHeader(xhr.getResponseHeader('link') || '').next;
      var response;

      try {
        response = JSON.parse(xhr.responseText);
      } catch (e) {
        return next(e);
      }

      if (typeof response !== 'object') {
        return next(new Error('Unexpected response'));
      }

      _.each(response, function (content) {
        if (!isNotebookContent(content)) { return; }

        list.push({
          id: content.id,
          updatedAt: new Date(content.updated_at),
          meta: {
            title: content.description
          }
        });
      });

      // Proceed to the next link or return done.
      return nextLink ? recurse(nextLink) : done();
    });
  })('https://api.github.com/users/'+CLIENT_ID+'/gists');
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9wbHVnaW5zL3B1YmxpYy1naXN0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIGdsb2JhbCBBcHAgKi9cbnZhciBfICAgICAgICAgICAgID0gQXBwLl87XG52YXIgcGx1Z2luICAgICAgICA9ICh7XCJnaXRodWJcIjp7XCJjbGllbnRJZFwiOlwic3RlcGhhbmVzYW5cIixcImNsaWVudFNlY3JldFwiOlwiLi4uXCJ9fSB8fCB7fSkuZ2l0aHViIHx8IHt9O1xudmFyIENMSUVOVF9JRCAgICAgPSBwbHVnaW4uY2xpZW50SWQ7XG5cbi8vIERldGVjdCBpZiB0aGUgcGx1Z2luIGlzIG5vdCBlbmFibGVkLlxuaWYgKCFDTElFTlRfSUQpIHtcbiAgY29uc29sZS53YXJuKCdHaXRIdWIgcGx1Z2luIGhhcyBub3QgYmVlbiBjb25maWd1cmVkLiBQbGVhc2Ugc2V0IHRoZSAnICtcbiAgICAnYGNsaWVudElkYCBpbiB5b3VyIGNvbmZpZyB0byB1c2UgaXQuJyk7XG59XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciBhIGdpc3QgY29udGVudHMgYXJlIGEgdmFsaWQgbm90ZWJvb2suXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSAgY29udGVudFxuICogQHJldHVybiB7Qm9vbGVhbn1cbiAqL1xudmFyIGlzTm90ZWJvb2tDb250ZW50ID0gZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgcmV0dXJuIGNvbnRlbnQgJiYgY29udGVudC5maWxlcyAmJiBjb250ZW50LmZpbGVzWydub3RlYm9vay5tZCddO1xufTtcblxuLyoqXG4gKiBQYXJzZSB0aGUgbGluayBoZWFkZXIgZm9yIHRoZSBzcGVjaWZpYyBsaW5rcy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGhlYWRlclxuICogQHJldHVybiB7T2JqZWN0fVxuICovXG52YXIgcGFyc2VMaW5rSGVhZGVyID0gZnVuY3Rpb24gKGhlYWRlcikge1xuICB2YXIgb2JqID0ge307XG5cbiAgXy5lYWNoKGhlYWRlci5zcGxpdCgnLCAnKSwgZnVuY3Rpb24gKHBhcnQpIHtcbiAgICB2YXIgbWF0Y2hlcyA9IC9ePChbXj5dKyk+OyAqcmVsPVwiKFteXCJdKylcIiQvLmV4ZWMocGFydCk7XG4gICAgcmV0dXJuIG1hdGNoZXMgJiYgKG9ialttYXRjaGVzWzJdXSA9IG1hdGNoZXNbMV0pO1xuICB9KTtcblxuICByZXR1cm4gb2JqO1xufTtcblxuLyoqXG4gKiBNYWtlIHNhdmVzIHRvIHRoZSBzZXJ2ZXIgbGVzcyBmcmVxdWVudGx5LiBIYW5kbGVzIG11bHRpcGxlIG5vdGVib29rcyBzYXZpbmdcbiAqIGNvbmN1cnJlbnRseS5cbiAqXG4gKiBAdHlwZSB7RnVuY3Rpb259XG4gKi9cbnZhciBkZWJvdW5jZVNhdmUgPSAoZnVuY3Rpb24gKGhhc2gpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgLy8gUmVtb3ZlIGFueSBwcmV2aW91c2x5IHF1ZXVlZCBzYXZlIHJlcXVlc3QgZm9yIHRoZSBzYW1lIHJlc291cmNlLlxuICAgIGlmIChoYXNoW2RhdGEuaWRdKSB7XG4gICAgICBjbGVhclRpbWVvdXQoaGFzaFtkYXRhLmlkXSk7XG4gICAgICBkZWxldGUgaGFzaFtkYXRhLmlkXTtcbiAgICB9XG5cbiAgICBoYXNoW2RhdGEuaWRdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZGF0YS5zaG91bGRTYXZlKCkgJiYgZGF0YS5zYXZlKCk7XG4gICAgfSwgNjAwKTtcbiAgfTtcbn0pKHt9KTtcblxuLyoqXG4gKiBXaGVuIGEgY2hhbmdlIG9jY3VycyAqYW5kKiB3ZSBhcmUgYWxyZWFkeSBhdXRoZW50aWNhdGVkLCB3ZSBjYW4gYXV0b21hdGljYWxseVxuICogc2F2ZSB0aGUgdXBkYXRlIHRvIGEgZ2lzdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBjaGFuZ2VQbHVnaW4gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICBkZWJvdW5jZVNhdmUoZGF0YSk7XG5cbiAgcmV0dXJuIGRvbmUoKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgaWQgYW5kIHRpdGxlIGJ5IG1ha2luZyBhIHJlcXVlc3Qgb24gdGhlIHVzZXJzXG4gKiBiZWhhbGYuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgYXV0aGVudGljYXRlZFVzZXJJZCA9IGZ1bmN0aW9uIChkb25lKSB7XG5cbiAgICByZXR1cm4gZG9uZShudWxsLCB7XG4gICAgICB1c2VySWQ6ICAgIENMSUVOVF9JRCxcbiAgICAgIHVzZXJUaXRsZTogQ0xJRU5UX0lEIFxuICAgIH0pO1xuIFxufTtcblxuLyoqXG4gKiBBdXRoZW50aWNhdGUgd2l0aCB0aGUgZ2l0aHViIG9hdXRoIGVuZHBvaW50LiBTaW5jZSB3ZSBhcmUgdW5saWtlbHkgdG8gaW5jbHVkZVxuICogb3VyIGNsaWVudCBzZWNyZXQgd2l0aCB0aGUgY2xpZW50IGNvZGUsIHlvdSdsbCBwcm9iYWJseSB3YW50IHRvIGluY2x1ZGUgdGhlXG4gKiBwcm94eSBwbHVnaW4gKGAuL3Byb3h5LmpzYCkuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgYXV0aGVudGljYXRlUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgICByZXR1cm4gYXV0aGVudGljYXRlZFVzZXJJZChkb25lKTtcbn07XG5cbi8qKlxuICogVW5hdXRoZW50aWNhdGUgdGhlIHVzZXIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgdW5hdXRoZW50aWNhdGVQbHVnaW4gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICByZXR1cm4gZG9uZSgpO1xufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIHdlIGFyZSBhdXRoZW50aWNhdGVkIHRvIEdpdGh1Yi5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBhdXRoZW50aWNhdGVkUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgcmV0dXJuIGF1dGhlbnRpY2F0ZWRVc2VySWQoZG9uZSk7XG59O1xuXG4vKipcbiAqIExvYWRzIGEgc2luZ2xlIGdpc3QgaWQgZnJvbSBHaXRodWIgYW5kIGNoZWNrcyB3aGV0aGVyIGl0IGhvbGRzIG91ciBub3RlYm9vay5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBsb2FkUGx1Z2luID0gZnVuY3Rpb24gKGRhdGEsIG5leHQsIGRvbmUpIHtcbiAgaWYgKCFkYXRhLmlkKSB7XG4gICAgcmV0dXJuIG5leHQoKTtcbiAgfVxuXG4gIEFwcC5taWRkbGV3YXJlLnRyaWdnZXIoJ2FqYXgnLCB7XG4gICAgLy8gQWRkIHRoZSBhcHBsaWNhdGlvbiBjbGllbnQgaWQgYW5kIHNlY3JldCB0byBsb2FkIHJlcXVlc3RzIHRvIGF2b2lkIHJhdGVcbiAgICAvLyBsaW1pdGluZyBpbiB0aGUgY2FzZSB0aGF0IHRoZSB1c2VyIGlzIHVuYXV0aGVudGljYXRlZC5cbiAgICB1cmw6ICAgICdodHRwczovL2FwaS5naXRodWIuY29tL2dpc3RzLycgKyBkYXRhLmlkIC8qKyAnP189JyArIERhdGUubm93KCkqLyxcbiAgICBwcm94eTogIGZhbHNlLFxuICAgIG1ldGhvZDogJ0dFVCcsXG4gIH0sIGZ1bmN0aW9uIChlcnIsIHhocikge1xuICAgIHZhciBjb250ZW50O1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnRlbnQgPSBKU09OLnBhcnNlKHhoci5yZXNwb25zZVRleHQpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBuZXh0KGUpO1xuICAgIH1cblxuICAgIGlmICghaXNOb3RlYm9va0NvbnRlbnQoY29udGVudCkpIHtcbiAgICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcignVW5leHBlY3RlZCBub3RlYm9vayByZXNwb25zZScpKTtcbiAgICB9XG5cbiAgICBkYXRhLmlkICAgICAgICAgPSBjb250ZW50LmlkO1xuICAgIGRhdGEub3duZXJJZCAgICA9IGNvbnRlbnQub3duZXIuaWQ7XG4gICAgZGF0YS5vd25lclRpdGxlID0gY29udGVudC5vd25lci5sb2dpbjtcbiAgICBkYXRhLmNvbnRlbnQgICAgPSBjb250ZW50LmZpbGVzWydub3RlYm9vay5tZCddLmNvbnRlbnQ7XG4gICAgZGF0YS51cGRhdGVkQXQgID0gbmV3IERhdGUoY29udGVudC51cGRhdGVkX2F0KTtcbiAgICByZXR1cm4gZG9uZSgpO1xuICB9KTtcbn07XG5cbi8qKlxuICogU2F2ZSB0aGUgbm90ZWJvb2sgaW50byBhIHNpbmdsZSBHaXRodWIgZ2lzdCBmb3IgcGVyc2lzdGVuY2UuIElmIHRoZSB1c2VyIGlzXG4gKiBub3QgeWV0IGF1dGhlbnRpY2F0ZWQsIHdlJ2xsIGF0dGVtcHQgdG8gZG8gYSBzbW9vdGhlciBvbiBib2FyZGluZyBieSBzaG93aW5nXG4gKiBhIGhlbHAgZGlhbG9nLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIHNhdmVQbHVnaW4gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcignUmVxdWVzdCBub3Qgc3VwcG9ydGVkJykpO1xufTtcblxuLyoqXG4gKiBQdXNoIGFsbCBzdWl0YWJsZSBnaXN0cyBpbnRvIHRoZSBsaXN0IG9mIG5vdGVib29rcy5cbiAqXG4gKiBAcGFyYW0ge0FycmF5fSAgICBsaXN0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBsaXN0UGx1Z2luID0gZnVuY3Rpb24gKGxpc3QsIG5leHQsIGRvbmUpIHtcblxuICAoZnVuY3Rpb24gcmVjdXJzZSAobGluaykge1xuICAgIEFwcC5taWRkbGV3YXJlLnRyaWdnZXIoJ2FqYXgnLCB7XG4gICAgICB1cmw6ICAgIGxpbmsgKyAobGluay5pbmRleE9mKCc/JykgPiAtMSA/ICcmJyA6ICc/JykgKyAnXz0nICsgRGF0ZS5ub3coKSxcbiAgICAgIHByb3h5OiAgZmFsc2UsXG4gICAgICBtZXRob2Q6ICdHRVQnXG4gICAgfSwgZnVuY3Rpb24gKGVyciwgeGhyKSB7XG4gICAgICBpZiAoZXJyKSB7IHJldHVybiBkb25lKGVycik7IH1cblxuICAgICAgdmFyIG5leHRMaW5rID0gcGFyc2VMaW5rSGVhZGVyKHhoci5nZXRSZXNwb25zZUhlYWRlcignbGluaycpIHx8ICcnKS5uZXh0O1xuICAgICAgdmFyIHJlc3BvbnNlO1xuXG4gICAgICB0cnkge1xuICAgICAgICByZXNwb25zZSA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBuZXh0KGUpO1xuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHJlc3BvbnNlICE9PSAnb2JqZWN0Jykge1xuICAgICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ1VuZXhwZWN0ZWQgcmVzcG9uc2UnKSk7XG4gICAgICB9XG5cbiAgICAgIF8uZWFjaChyZXNwb25zZSwgZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICAgICAgaWYgKCFpc05vdGVib29rQ29udGVudChjb250ZW50KSkgeyByZXR1cm47IH1cblxuICAgICAgICBsaXN0LnB1c2goe1xuICAgICAgICAgIGlkOiBjb250ZW50LmlkLFxuICAgICAgICAgIHVwZGF0ZWRBdDogbmV3IERhdGUoY29udGVudC51cGRhdGVkX2F0KSxcbiAgICAgICAgICBtZXRhOiB7XG4gICAgICAgICAgICB0aXRsZTogY29udGVudC5kZXNjcmlwdGlvblxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gUHJvY2VlZCB0byB0aGUgbmV4dCBsaW5rIG9yIHJldHVybiBkb25lLlxuICAgICAgcmV0dXJuIG5leHRMaW5rID8gcmVjdXJzZShuZXh0TGluaykgOiBkb25lKCk7XG4gICAgfSk7XG4gIH0pKCdodHRwczovL2FwaS5naXRodWIuY29tL3VzZXJzLycrQ0xJRU5UX0lEKycvZ2lzdHMnKTtcbn07XG5cbi8qKlxuICogRGVsZXRlIGEgc2luZ2xlIG5vdGVib29rIGZyb20gR2l0aHViIGdpc3RzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIHJlbW92ZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gICAgcmV0dXJuIG5leHQobmV3IEVycm9yKCdSZXF1ZXN0IG5vdCBzdXBwb3J0ZWQnKSk7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29uZmlnIG9wdGlvbiBmb3IgdGhlIGF1dGhlbnRpY2F0aW9uIHRleHQuXG4gKi9cbkFwcC5jb25maWcuc2V0KCdhdXRoZW50aWNhdGVUZXh0JywgJ0dldCBnaXN0IGZyb20gJytDTElFTlRfSUQpO1xuXG4vKipcbiAqIEEgeyBrZXk6IGZ1bmN0aW9uIH0gbWFwIG9mIGFsbCBtaWRkbGV3YXJlIHVzZWQgaW4gdGhlIHBsdWdpbi5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgJ3BlcnNpc3RlbmNlOmNoYW5nZSc6ICAgICAgICAgY2hhbmdlUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6YXV0aGVudGljYXRlJzogICBhdXRoZW50aWNhdGVQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTp1bmF1dGhlbnRpY2F0ZSc6IHVuYXV0aGVudGljYXRlUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6YXV0aGVudGljYXRlZCc6ICBhdXRoZW50aWNhdGVkUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6bG9hZCc6ICAgICAgICAgICBsb2FkUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6c2F2ZSc6ICAgICAgICAgICBzYXZlUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6bGlzdCc6ICAgICAgICAgICBsaXN0UGx1Z2luLFxuICAncGVyc2lzdGVuY2U6cmVtb3ZlJzogICAgICAgICByZW1vdmVQbHVnaW5cbn07XG4iXX0=

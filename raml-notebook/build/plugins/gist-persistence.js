(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.gistPersistencePlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global App */
var _             = App._;
var AUTH_URL      = 'https://github.com/login/oauth/authorize';
var TOKEN_URL     = 'https://github.com/login/oauth/access_token';
var plugin        = ({"github":{"clientId":"stephanesan","clientSecret":"..."}} || {}).github || {};
var CLIENT_ID     = plugin.clientId;
var CLIENT_SECRET = plugin.clientSecret;

// Detect if the plugin is not enabled.
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('GitHub plugin has not been configured. Please set the ' +
    '`clientId` and `clientSecret` in your config to use it.');
}

/**
 * OAuth2 authentication options object.
 *
 * @type {Object}
 */
var AUTH_OPTIONS = {
  scopes:              ['gist'],
  type:                'OAuth 2.0',
  clientId:            CLIENT_ID,
  clientSecret:        CLIENT_SECRET,
  accessTokenUri:      TOKEN_URL,
  authorizationUri:    AUTH_URL,
  authorizationGrants: 'code',
  modal: {
    title: 'Authenticate Notebook',
    content: [
      '<p>Notebooks are saved as gists to your GitHub account.</p>',
      '<p>',
      'Please authorize this application in order to ',
      'save, edit, and share your notebooks.',
      '</p>'
    ].join('\n'),
    btnText: 'Authorize With GitHub'
  }
};

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
 * Generate a custom store for the Github OAuth2 response tokens.
 *
 * @type {Object}
 */
var oauth2Store = App.store.customStore('github');

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
  if (!oauth2Store.has('accessToken')) {
    return done(new Error('No access token'));
  }

  // Make a request to the check authorization url, which doesn't incur any
  // rate limiting penalties.
  App.middleware.trigger('ajax:basicAuth', {
    url: 'https://api.github.com/applications/' + CLIENT_ID + '/tokens/' +
      oauth2Store.get('accessToken'),
    proxy: false,
    basicAuth: {
      username: CLIENT_ID,
      password: CLIENT_SECRET
    }
  }, function (err, xhr) {
    var content;

    // Proxy any errors back to the user.
    if (err) { return done(err); }

    // Check if the connection was rejected because of invalid credentials.
    if (xhr.status === 404) {
      oauth2Store.clear();
      return done(new Error('Invalid credentials'));
    }

    try {
      content = JSON.parse(xhr.responseText);
    } catch (e) {
      return done(e);
    }

    return done(null, {
      userId:    content.user.id,
      userTitle: content.user.login
    });
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
  App.middleware.trigger('authenticate', AUTH_OPTIONS, function (err, auth) {
    if (err) { return next(err); }

    oauth2Store.set(auth);

    return authenticatedUserId(done);
  });
};

/**
 * Unauthenticate the user.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var unauthenticatePlugin = function (data, next, done) {
  oauth2Store.clear();

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

  App.middleware.trigger('ajax:oauth2', {
    // Add the application client id and secret to load requests to avoid rate
    // limiting in the case that the user is unauthenticated.
    url:    'https://api.github.com/gists/' + data.id + '?_=' + Date.now(),
    proxy:  false,
    method: 'GET',
    oauth2: oauth2Store.toJSON()
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
  if (!data.isAuthenticated()) {
    return data.authenticate(function (err) {
      if (err) { return next(err); }

      return done(), data.save();
    });
  }

  App.middleware.trigger('ajax:oauth2', {
    url:    'https://api.github.com/gists' + (data.id ? '/' + data.id : ''),
    proxy:  false,
    method: data.id ? 'PATCH' : 'POST',
    data: JSON.stringify({
      description: data.meta.title,
      files: {
        'notebook.md': {
          content: data.content
        }
      }
    }),
    oauth2: oauth2Store.toJSON()
  }, function (err, xhr) {
    if (err) { return next(err); }

    // The status does not equal a sucessful patch or creation.
    if (xhr.status !== 200 && xhr.status !== 201) {
      return next(new Error('Request failed'));
    }

    try {
      var content = JSON.parse(xhr.responseText);
      data.id         = content.id;
      data.ownerId    = content.owner.id;
      data.ownerTitle = content.owner.login;
    } catch (e) {
      return next(e);
    }

    return done();
  });
};

/**
 * Push all suitable gists into the list of notebooks.
 *
 * @param {Array}    list
 * @param {Function} next
 * @param {Function} done
 */
var listPlugin = function (list, next, done) {
  if (!oauth2Store.has('accessToken')) {
    return done(new Error('Listing notebooks requires authentication'));
  }

  (function recurse (link) {
    App.middleware.trigger('ajax:oauth2', {
      url:    link + (link.indexOf('?') > -1 ? '&' : '?') + '_=' + Date.now(),
      proxy:  false,
      method: 'GET',
      oauth2: oauth2Store.toJSON()
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
  })('https://api.github.com/gists');
};

/**
 * Delete a single notebook from Github gists.
 *
 * @param {Object}   data
 * @param {Function} next
 * @param {Function} done
 */
var removePlugin = function (data, next, done) {
  return App.middleware.trigger('ajax:oauth2', {
    url:    'https://api.github.com/gists/' + data.id,
    proxy:  false,
    method: 'DELETE',
    oauth2: oauth2Store.toJSON()
  }, done);
};

/**
 * Set the config option for the authentication text.
 */
App.config.set('authenticateText', 'Connect using Github');

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9wbHVnaW5zL2dpc3QtcGVyc2lzdGVuY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgQXBwICovXG52YXIgXyAgICAgICAgICAgICA9IEFwcC5fO1xudmFyIEFVVEhfVVJMICAgICAgPSAnaHR0cHM6Ly9naXRodWIuY29tL2xvZ2luL29hdXRoL2F1dGhvcml6ZSc7XG52YXIgVE9LRU5fVVJMICAgICA9ICdodHRwczovL2dpdGh1Yi5jb20vbG9naW4vb2F1dGgvYWNjZXNzX3Rva2VuJztcbnZhciBwbHVnaW4gICAgICAgID0gKHtcImdpdGh1YlwiOntcImNsaWVudElkXCI6XCJzdGVwaGFuZXNhblwiLFwiY2xpZW50U2VjcmV0XCI6XCIuLi5cIn19IHx8IHt9KS5naXRodWIgfHwge307XG52YXIgQ0xJRU5UX0lEICAgICA9IHBsdWdpbi5jbGllbnRJZDtcbnZhciBDTElFTlRfU0VDUkVUID0gcGx1Z2luLmNsaWVudFNlY3JldDtcblxuLy8gRGV0ZWN0IGlmIHRoZSBwbHVnaW4gaXMgbm90IGVuYWJsZWQuXG5pZiAoIUNMSUVOVF9JRCB8fCAhQ0xJRU5UX1NFQ1JFVCkge1xuICBjb25zb2xlLndhcm4oJ0dpdEh1YiBwbHVnaW4gaGFzIG5vdCBiZWVuIGNvbmZpZ3VyZWQuIFBsZWFzZSBzZXQgdGhlICcgK1xuICAgICdgY2xpZW50SWRgIGFuZCBgY2xpZW50U2VjcmV0YCBpbiB5b3VyIGNvbmZpZyB0byB1c2UgaXQuJyk7XG59XG5cbi8qKlxuICogT0F1dGgyIGF1dGhlbnRpY2F0aW9uIG9wdGlvbnMgb2JqZWN0LlxuICpcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cbnZhciBBVVRIX09QVElPTlMgPSB7XG4gIHNjb3BlczogICAgICAgICAgICAgIFsnZ2lzdCddLFxuICB0eXBlOiAgICAgICAgICAgICAgICAnT0F1dGggMi4wJyxcbiAgY2xpZW50SWQ6ICAgICAgICAgICAgQ0xJRU5UX0lELFxuICBjbGllbnRTZWNyZXQ6ICAgICAgICBDTElFTlRfU0VDUkVULFxuICBhY2Nlc3NUb2tlblVyaTogICAgICBUT0tFTl9VUkwsXG4gIGF1dGhvcml6YXRpb25Vcmk6ICAgIEFVVEhfVVJMLFxuICBhdXRob3JpemF0aW9uR3JhbnRzOiAnY29kZScsXG4gIG1vZGFsOiB7XG4gICAgdGl0bGU6ICdBdXRoZW50aWNhdGUgTm90ZWJvb2snLFxuICAgIGNvbnRlbnQ6IFtcbiAgICAgICc8cD5Ob3RlYm9va3MgYXJlIHNhdmVkIGFzIGdpc3RzIHRvIHlvdXIgR2l0SHViIGFjY291bnQuPC9wPicsXG4gICAgICAnPHA+JyxcbiAgICAgICdQbGVhc2UgYXV0aG9yaXplIHRoaXMgYXBwbGljYXRpb24gaW4gb3JkZXIgdG8gJyxcbiAgICAgICdzYXZlLCBlZGl0LCBhbmQgc2hhcmUgeW91ciBub3RlYm9va3MuJyxcbiAgICAgICc8L3A+J1xuICAgIF0uam9pbignXFxuJyksXG4gICAgYnRuVGV4dDogJ0F1dGhvcml6ZSBXaXRoIEdpdEh1YidcbiAgfVxufTtcblxuLyoqXG4gKiBDaGVjayB3aGV0aGVyIGEgZ2lzdCBjb250ZW50cyBhcmUgYSB2YWxpZCBub3RlYm9vay5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9ICBjb250ZW50XG4gKiBAcmV0dXJuIHtCb29sZWFufVxuICovXG52YXIgaXNOb3RlYm9va0NvbnRlbnQgPSBmdW5jdGlvbiAoY29udGVudCkge1xuICByZXR1cm4gY29udGVudCAmJiBjb250ZW50LmZpbGVzICYmIGNvbnRlbnQuZmlsZXNbJ25vdGVib29rLm1kJ107XG59O1xuXG4vKipcbiAqIFBhcnNlIHRoZSBsaW5rIGhlYWRlciBmb3IgdGhlIHNwZWNpZmljIGxpbmtzLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gaGVhZGVyXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbnZhciBwYXJzZUxpbmtIZWFkZXIgPSBmdW5jdGlvbiAoaGVhZGVyKSB7XG4gIHZhciBvYmogPSB7fTtcblxuICBfLmVhY2goaGVhZGVyLnNwbGl0KCcsICcpLCBmdW5jdGlvbiAocGFydCkge1xuICAgIHZhciBtYXRjaGVzID0gL148KFtePl0rKT47ICpyZWw9XCIoW15cIl0rKVwiJC8uZXhlYyhwYXJ0KTtcbiAgICByZXR1cm4gbWF0Y2hlcyAmJiAob2JqW21hdGNoZXNbMl1dID0gbWF0Y2hlc1sxXSk7XG4gIH0pO1xuXG4gIHJldHVybiBvYmo7XG59O1xuXG4vKipcbiAqIEdlbmVyYXRlIGEgY3VzdG9tIHN0b3JlIGZvciB0aGUgR2l0aHViIE9BdXRoMiByZXNwb25zZSB0b2tlbnMuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqL1xudmFyIG9hdXRoMlN0b3JlID0gQXBwLnN0b3JlLmN1c3RvbVN0b3JlKCdnaXRodWInKTtcblxuLyoqXG4gKiBNYWtlIHNhdmVzIHRvIHRoZSBzZXJ2ZXIgbGVzcyBmcmVxdWVudGx5LiBIYW5kbGVzIG11bHRpcGxlIG5vdGVib29rcyBzYXZpbmdcbiAqIGNvbmN1cnJlbnRseS5cbiAqXG4gKiBAdHlwZSB7RnVuY3Rpb259XG4gKi9cbnZhciBkZWJvdW5jZVNhdmUgPSAoZnVuY3Rpb24gKGhhc2gpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgLy8gUmVtb3ZlIGFueSBwcmV2aW91c2x5IHF1ZXVlZCBzYXZlIHJlcXVlc3QgZm9yIHRoZSBzYW1lIHJlc291cmNlLlxuICAgIGlmIChoYXNoW2RhdGEuaWRdKSB7XG4gICAgICBjbGVhclRpbWVvdXQoaGFzaFtkYXRhLmlkXSk7XG4gICAgICBkZWxldGUgaGFzaFtkYXRhLmlkXTtcbiAgICB9XG5cbiAgICBoYXNoW2RhdGEuaWRdID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gZGF0YS5zaG91bGRTYXZlKCkgJiYgZGF0YS5zYXZlKCk7XG4gICAgfSwgNjAwKTtcbiAgfTtcbn0pKHt9KTtcblxuLyoqXG4gKiBXaGVuIGEgY2hhbmdlIG9jY3VycyAqYW5kKiB3ZSBhcmUgYWxyZWFkeSBhdXRoZW50aWNhdGVkLCB3ZSBjYW4gYXV0b21hdGljYWxseVxuICogc2F2ZSB0aGUgdXBkYXRlIHRvIGEgZ2lzdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciBjaGFuZ2VQbHVnaW4gPSBmdW5jdGlvbiAoZGF0YSwgbmV4dCwgZG9uZSkge1xuICBkZWJvdW5jZVNhdmUoZGF0YSk7XG5cbiAgcmV0dXJuIGRvbmUoKTtcbn07XG5cbi8qKlxuICogR2V0IHRoZSBhdXRoZW50aWNhdGVkIHVzZXIgaWQgYW5kIHRpdGxlIGJ5IG1ha2luZyBhIHJlcXVlc3Qgb24gdGhlIHVzZXJzXG4gKiBiZWhhbGYuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgYXV0aGVudGljYXRlZFVzZXJJZCA9IGZ1bmN0aW9uIChkb25lKSB7XG4gIGlmICghb2F1dGgyU3RvcmUuaGFzKCdhY2Nlc3NUb2tlbicpKSB7XG4gICAgcmV0dXJuIGRvbmUobmV3IEVycm9yKCdObyBhY2Nlc3MgdG9rZW4nKSk7XG4gIH1cblxuICAvLyBNYWtlIGEgcmVxdWVzdCB0byB0aGUgY2hlY2sgYXV0aG9yaXphdGlvbiB1cmwsIHdoaWNoIGRvZXNuJ3QgaW5jdXIgYW55XG4gIC8vIHJhdGUgbGltaXRpbmcgcGVuYWx0aWVzLlxuICBBcHAubWlkZGxld2FyZS50cmlnZ2VyKCdhamF4OmJhc2ljQXV0aCcsIHtcbiAgICB1cmw6ICdodHRwczovL2FwaS5naXRodWIuY29tL2FwcGxpY2F0aW9ucy8nICsgQ0xJRU5UX0lEICsgJy90b2tlbnMvJyArXG4gICAgICBvYXV0aDJTdG9yZS5nZXQoJ2FjY2Vzc1Rva2VuJyksXG4gICAgcHJveHk6IGZhbHNlLFxuICAgIGJhc2ljQXV0aDoge1xuICAgICAgdXNlcm5hbWU6IENMSUVOVF9JRCxcbiAgICAgIHBhc3N3b3JkOiBDTElFTlRfU0VDUkVUXG4gICAgfVxuICB9LCBmdW5jdGlvbiAoZXJyLCB4aHIpIHtcbiAgICB2YXIgY29udGVudDtcblxuICAgIC8vIFByb3h5IGFueSBlcnJvcnMgYmFjayB0byB0aGUgdXNlci5cbiAgICBpZiAoZXJyKSB7IHJldHVybiBkb25lKGVycik7IH1cblxuICAgIC8vIENoZWNrIGlmIHRoZSBjb25uZWN0aW9uIHdhcyByZWplY3RlZCBiZWNhdXNlIG9mIGludmFsaWQgY3JlZGVudGlhbHMuXG4gICAgaWYgKHhoci5zdGF0dXMgPT09IDQwNCkge1xuICAgICAgb2F1dGgyU3RvcmUuY2xlYXIoKTtcbiAgICAgIHJldHVybiBkb25lKG5ldyBFcnJvcignSW52YWxpZCBjcmVkZW50aWFscycpKTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgY29udGVudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIGRvbmUoZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRvbmUobnVsbCwge1xuICAgICAgdXNlcklkOiAgICBjb250ZW50LnVzZXIuaWQsXG4gICAgICB1c2VyVGl0bGU6IGNvbnRlbnQudXNlci5sb2dpblxuICAgIH0pO1xuICB9KTtcbn07XG5cbi8qKlxuICogQXV0aGVudGljYXRlIHdpdGggdGhlIGdpdGh1YiBvYXV0aCBlbmRwb2ludC4gU2luY2Ugd2UgYXJlIHVubGlrZWx5IHRvIGluY2x1ZGVcbiAqIG91ciBjbGllbnQgc2VjcmV0IHdpdGggdGhlIGNsaWVudCBjb2RlLCB5b3UnbGwgcHJvYmFibHkgd2FudCB0byBpbmNsdWRlIHRoZVxuICogcHJveHkgcGx1Z2luIChgLi9wcm94eS5qc2ApLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGF1dGhlbnRpY2F0ZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIEFwcC5taWRkbGV3YXJlLnRyaWdnZXIoJ2F1dGhlbnRpY2F0ZScsIEFVVEhfT1BUSU9OUywgZnVuY3Rpb24gKGVyciwgYXV0aCkge1xuICAgIGlmIChlcnIpIHsgcmV0dXJuIG5leHQoZXJyKTsgfVxuXG4gICAgb2F1dGgyU3RvcmUuc2V0KGF1dGgpO1xuXG4gICAgcmV0dXJuIGF1dGhlbnRpY2F0ZWRVc2VySWQoZG9uZSk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBVbmF1dGhlbnRpY2F0ZSB0aGUgdXNlci5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gICBkYXRhXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBuZXh0XG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBkb25lXG4gKi9cbnZhciB1bmF1dGhlbnRpY2F0ZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIG9hdXRoMlN0b3JlLmNsZWFyKCk7XG5cbiAgcmV0dXJuIGRvbmUoKTtcbn07XG5cbi8qKlxuICogQ2hlY2sgd2hldGhlciB3ZSBhcmUgYXV0aGVudGljYXRlZCB0byBHaXRodWIuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgYXV0aGVudGljYXRlZFBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIHJldHVybiBhdXRoZW50aWNhdGVkVXNlcklkKGRvbmUpO1xufTtcblxuLyoqXG4gKiBMb2FkcyBhIHNpbmdsZSBnaXN0IGlkIGZyb20gR2l0aHViIGFuZCBjaGVja3Mgd2hldGhlciBpdCBob2xkcyBvdXIgbm90ZWJvb2suXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgbG9hZFBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIGlmICghZGF0YS5pZCkge1xuICAgIHJldHVybiBuZXh0KCk7XG4gIH1cblxuICBBcHAubWlkZGxld2FyZS50cmlnZ2VyKCdhamF4Om9hdXRoMicsIHtcbiAgICAvLyBBZGQgdGhlIGFwcGxpY2F0aW9uIGNsaWVudCBpZCBhbmQgc2VjcmV0IHRvIGxvYWQgcmVxdWVzdHMgdG8gYXZvaWQgcmF0ZVxuICAgIC8vIGxpbWl0aW5nIGluIHRoZSBjYXNlIHRoYXQgdGhlIHVzZXIgaXMgdW5hdXRoZW50aWNhdGVkLlxuICAgIHVybDogICAgJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMvJyArIGRhdGEuaWQgKyAnP189JyArIERhdGUubm93KCksXG4gICAgcHJveHk6ICBmYWxzZSxcbiAgICBtZXRob2Q6ICdHRVQnLFxuICAgIG9hdXRoMjogb2F1dGgyU3RvcmUudG9KU09OKClcbiAgfSwgZnVuY3Rpb24gKGVyciwgeGhyKSB7XG4gICAgdmFyIGNvbnRlbnQ7XG5cbiAgICB0cnkge1xuICAgICAgY29udGVudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG5leHQoZSk7XG4gICAgfVxuXG4gICAgaWYgKCFpc05vdGVib29rQ29udGVudChjb250ZW50KSkge1xuICAgICAgcmV0dXJuIG5leHQobmV3IEVycm9yKCdVbmV4cGVjdGVkIG5vdGVib29rIHJlc3BvbnNlJykpO1xuICAgIH1cblxuICAgIGRhdGEuaWQgICAgICAgICA9IGNvbnRlbnQuaWQ7XG4gICAgZGF0YS5vd25lcklkICAgID0gY29udGVudC5vd25lci5pZDtcbiAgICBkYXRhLm93bmVyVGl0bGUgPSBjb250ZW50Lm93bmVyLmxvZ2luO1xuICAgIGRhdGEuY29udGVudCAgICA9IGNvbnRlbnQuZmlsZXNbJ25vdGVib29rLm1kJ10uY29udGVudDtcbiAgICBkYXRhLnVwZGF0ZWRBdCAgPSBuZXcgRGF0ZShjb250ZW50LnVwZGF0ZWRfYXQpO1xuICAgIHJldHVybiBkb25lKCk7XG4gIH0pO1xufTtcblxuLyoqXG4gKiBTYXZlIHRoZSBub3RlYm9vayBpbnRvIGEgc2luZ2xlIEdpdGh1YiBnaXN0IGZvciBwZXJzaXN0ZW5jZS4gSWYgdGhlIHVzZXIgaXNcbiAqIG5vdCB5ZXQgYXV0aGVudGljYXRlZCwgd2UnbGwgYXR0ZW1wdCB0byBkbyBhIHNtb290aGVyIG9uIGJvYXJkaW5nIGJ5IHNob3dpbmdcbiAqIGEgaGVscCBkaWFsb2cuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9ICAgZGF0YVxuICogQHBhcmFtIHtGdW5jdGlvbn0gbmV4dFxuICogQHBhcmFtIHtGdW5jdGlvbn0gZG9uZVxuICovXG52YXIgc2F2ZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIGlmICghZGF0YS5pc0F1dGhlbnRpY2F0ZWQoKSkge1xuICAgIHJldHVybiBkYXRhLmF1dGhlbnRpY2F0ZShmdW5jdGlvbiAoZXJyKSB7XG4gICAgICBpZiAoZXJyKSB7IHJldHVybiBuZXh0KGVycik7IH1cblxuICAgICAgcmV0dXJuIGRvbmUoKSwgZGF0YS5zYXZlKCk7XG4gICAgfSk7XG4gIH1cblxuICBBcHAubWlkZGxld2FyZS50cmlnZ2VyKCdhamF4Om9hdXRoMicsIHtcbiAgICB1cmw6ICAgICdodHRwczovL2FwaS5naXRodWIuY29tL2dpc3RzJyArIChkYXRhLmlkID8gJy8nICsgZGF0YS5pZCA6ICcnKSxcbiAgICBwcm94eTogIGZhbHNlLFxuICAgIG1ldGhvZDogZGF0YS5pZCA/ICdQQVRDSCcgOiAnUE9TVCcsXG4gICAgZGF0YTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgZGVzY3JpcHRpb246IGRhdGEubWV0YS50aXRsZSxcbiAgICAgIGZpbGVzOiB7XG4gICAgICAgICdub3RlYm9vay5tZCc6IHtcbiAgICAgICAgICBjb250ZW50OiBkYXRhLmNvbnRlbnRcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLFxuICAgIG9hdXRoMjogb2F1dGgyU3RvcmUudG9KU09OKClcbiAgfSwgZnVuY3Rpb24gKGVyciwgeGhyKSB7XG4gICAgaWYgKGVycikgeyByZXR1cm4gbmV4dChlcnIpOyB9XG5cbiAgICAvLyBUaGUgc3RhdHVzIGRvZXMgbm90IGVxdWFsIGEgc3VjZXNzZnVsIHBhdGNoIG9yIGNyZWF0aW9uLlxuICAgIGlmICh4aHIuc3RhdHVzICE9PSAyMDAgJiYgeGhyLnN0YXR1cyAhPT0gMjAxKSB7XG4gICAgICByZXR1cm4gbmV4dChuZXcgRXJyb3IoJ1JlcXVlc3QgZmFpbGVkJykpO1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICB2YXIgY29udGVudCA9IEpTT04ucGFyc2UoeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICBkYXRhLmlkICAgICAgICAgPSBjb250ZW50LmlkO1xuICAgICAgZGF0YS5vd25lcklkICAgID0gY29udGVudC5vd25lci5pZDtcbiAgICAgIGRhdGEub3duZXJUaXRsZSA9IGNvbnRlbnQub3duZXIubG9naW47XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgcmV0dXJuIG5leHQoZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRvbmUoKTtcbiAgfSk7XG59O1xuXG4vKipcbiAqIFB1c2ggYWxsIHN1aXRhYmxlIGdpc3RzIGludG8gdGhlIGxpc3Qgb2Ygbm90ZWJvb2tzLlxuICpcbiAqIEBwYXJhbSB7QXJyYXl9ICAgIGxpc3RcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIGxpc3RQbHVnaW4gPSBmdW5jdGlvbiAobGlzdCwgbmV4dCwgZG9uZSkge1xuICBpZiAoIW9hdXRoMlN0b3JlLmhhcygnYWNjZXNzVG9rZW4nKSkge1xuICAgIHJldHVybiBkb25lKG5ldyBFcnJvcignTGlzdGluZyBub3RlYm9va3MgcmVxdWlyZXMgYXV0aGVudGljYXRpb24nKSk7XG4gIH1cblxuICAoZnVuY3Rpb24gcmVjdXJzZSAobGluaykge1xuICAgIEFwcC5taWRkbGV3YXJlLnRyaWdnZXIoJ2FqYXg6b2F1dGgyJywge1xuICAgICAgdXJsOiAgICBsaW5rICsgKGxpbmsuaW5kZXhPZignPycpID4gLTEgPyAnJicgOiAnPycpICsgJ189JyArIERhdGUubm93KCksXG4gICAgICBwcm94eTogIGZhbHNlLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIG9hdXRoMjogb2F1dGgyU3RvcmUudG9KU09OKClcbiAgICB9LCBmdW5jdGlvbiAoZXJyLCB4aHIpIHtcbiAgICAgIGlmIChlcnIpIHsgcmV0dXJuIGRvbmUoZXJyKTsgfVxuXG4gICAgICB2YXIgbmV4dExpbmsgPSBwYXJzZUxpbmtIZWFkZXIoeGhyLmdldFJlc3BvbnNlSGVhZGVyKCdsaW5rJykgfHwgJycpLm5leHQ7XG4gICAgICB2YXIgcmVzcG9uc2U7XG5cbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc3BvbnNlID0gSlNPTi5wYXJzZSh4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG5leHQoZSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0eXBlb2YgcmVzcG9uc2UgIT09ICdvYmplY3QnKSB7XG4gICAgICAgIHJldHVybiBuZXh0KG5ldyBFcnJvcignVW5leHBlY3RlZCByZXNwb25zZScpKTtcbiAgICAgIH1cblxuICAgICAgXy5lYWNoKHJlc3BvbnNlLCBmdW5jdGlvbiAoY29udGVudCkge1xuICAgICAgICBpZiAoIWlzTm90ZWJvb2tDb250ZW50KGNvbnRlbnQpKSB7IHJldHVybjsgfVxuXG4gICAgICAgIGxpc3QucHVzaCh7XG4gICAgICAgICAgaWQ6IGNvbnRlbnQuaWQsXG4gICAgICAgICAgdXBkYXRlZEF0OiBuZXcgRGF0ZShjb250ZW50LnVwZGF0ZWRfYXQpLFxuICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgIHRpdGxlOiBjb250ZW50LmRlc2NyaXB0aW9uXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBQcm9jZWVkIHRvIHRoZSBuZXh0IGxpbmsgb3IgcmV0dXJuIGRvbmUuXG4gICAgICByZXR1cm4gbmV4dExpbmsgPyByZWN1cnNlKG5leHRMaW5rKSA6IGRvbmUoKTtcbiAgICB9KTtcbiAgfSkoJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vZ2lzdHMnKTtcbn07XG5cbi8qKlxuICogRGVsZXRlIGEgc2luZ2xlIG5vdGVib29rIGZyb20gR2l0aHViIGdpc3RzLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSAgIGRhdGFcbiAqIEBwYXJhbSB7RnVuY3Rpb259IG5leHRcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGRvbmVcbiAqL1xudmFyIHJlbW92ZVBsdWdpbiA9IGZ1bmN0aW9uIChkYXRhLCBuZXh0LCBkb25lKSB7XG4gIHJldHVybiBBcHAubWlkZGxld2FyZS50cmlnZ2VyKCdhamF4Om9hdXRoMicsIHtcbiAgICB1cmw6ICAgICdodHRwczovL2FwaS5naXRodWIuY29tL2dpc3RzLycgKyBkYXRhLmlkLFxuICAgIHByb3h5OiAgZmFsc2UsXG4gICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICBvYXV0aDI6IG9hdXRoMlN0b3JlLnRvSlNPTigpXG4gIH0sIGRvbmUpO1xufTtcblxuLyoqXG4gKiBTZXQgdGhlIGNvbmZpZyBvcHRpb24gZm9yIHRoZSBhdXRoZW50aWNhdGlvbiB0ZXh0LlxuICovXG5BcHAuY29uZmlnLnNldCgnYXV0aGVudGljYXRlVGV4dCcsICdDb25uZWN0IHVzaW5nIEdpdGh1YicpO1xuXG4vKipcbiAqIEEgeyBrZXk6IGZ1bmN0aW9uIH0gbWFwIG9mIGFsbCBtaWRkbGV3YXJlIHVzZWQgaW4gdGhlIHBsdWdpbi5cbiAqXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgJ3BlcnNpc3RlbmNlOmNoYW5nZSc6ICAgICAgICAgY2hhbmdlUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6YXV0aGVudGljYXRlJzogICBhdXRoZW50aWNhdGVQbHVnaW4sXG4gICdwZXJzaXN0ZW5jZTp1bmF1dGhlbnRpY2F0ZSc6IHVuYXV0aGVudGljYXRlUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6YXV0aGVudGljYXRlZCc6ICBhdXRoZW50aWNhdGVkUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6bG9hZCc6ICAgICAgICAgICBsb2FkUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6c2F2ZSc6ICAgICAgICAgICBzYXZlUGx1Z2luLFxuICAncGVyc2lzdGVuY2U6bGlzdCc6ICAgICAgICAgICBsaXN0UGx1Z2luLFxuICAncGVyc2lzdGVuY2U6cmVtb3ZlJzogICAgICAgICByZW1vdmVQbHVnaW5cbn07XG4iXX0=

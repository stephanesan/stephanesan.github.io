(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.embedHashPersistencePlugin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var NOTEBOOK_URL = {"url":"./","title":"API Notebook","oauthCallback":"/authenticate/oauth.html"}.url;

/**
 * Export the attaching functionality.
 *
 * @param {Function} Notebook
 */
module.exports = function (Notebook) {
  /**
   * Subscribe to a single notebook for hash changes.
   *
   * @param {Object} notebook
   */
  Notebook.subscribe(function (notebook) {
    // Update the id and url when the hash of the window changes.
    var updateId = function () {
      var id  = window.location.hash.substr(1);
      var url = window.location.href;

      notebook.config('id',  id);
      notebook.config('url', url);
    };

    var updateUrl = function () {
      var id = notebook.options.config.id;

      id = (id == null ? '' : String(id));

      // Update the hash url if it changed.
      if (window.location.hash.substr(1) !== id) {
        window.location.hash = id;
        notebook.config('fullUrl', NOTEBOOK_URL + (id ? '#' + id : ''));
      }
    };

    updateId();
    window.addEventListener('hashchange', updateId);

    // Update the window hash when the id changes.
    notebook.on('config', function (name) {
      if (name !== 'id') { return; }

      return updateUrl();
    });

    /**
     * Unsubscribe to a single notebook from hash changes.
     *
     * @param {Object} notebook
     */
    Notebook.unsubscribe(function () {
      window.removeEventListener('hashchange', updateId);
    });
  });
};

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9wbHVnaW5zL2VtYmVkLWhhc2gtcGVyc2lzdGVuY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBOT1RFQk9PS19VUkwgPSB7XCJ1cmxcIjpcIi4vXCIsXCJ0aXRsZVwiOlwiQVBJIE5vdGVib29rXCIsXCJvYXV0aENhbGxiYWNrXCI6XCIvYXV0aGVudGljYXRlL29hdXRoLmh0bWxcIn0udXJsO1xuXG4vKipcbiAqIEV4cG9ydCB0aGUgYXR0YWNoaW5nIGZ1bmN0aW9uYWxpdHkuXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gTm90ZWJvb2tcbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoTm90ZWJvb2spIHtcbiAgLyoqXG4gICAqIFN1YnNjcmliZSB0byBhIHNpbmdsZSBub3RlYm9vayBmb3IgaGFzaCBjaGFuZ2VzLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gbm90ZWJvb2tcbiAgICovXG4gIE5vdGVib29rLnN1YnNjcmliZShmdW5jdGlvbiAobm90ZWJvb2spIHtcbiAgICAvLyBVcGRhdGUgdGhlIGlkIGFuZCB1cmwgd2hlbiB0aGUgaGFzaCBvZiB0aGUgd2luZG93IGNoYW5nZXMuXG4gICAgdmFyIHVwZGF0ZUlkID0gZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGlkICA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKTtcbiAgICAgIHZhciB1cmwgPSB3aW5kb3cubG9jYXRpb24uaHJlZjtcblxuICAgICAgbm90ZWJvb2suY29uZmlnKCdpZCcsICBpZCk7XG4gICAgICBub3RlYm9vay5jb25maWcoJ3VybCcsIHVybCk7XG4gICAgfTtcblxuICAgIHZhciB1cGRhdGVVcmwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgaWQgPSBub3RlYm9vay5vcHRpb25zLmNvbmZpZy5pZDtcblxuICAgICAgaWQgPSAoaWQgPT0gbnVsbCA/ICcnIDogU3RyaW5nKGlkKSk7XG5cbiAgICAgIC8vIFVwZGF0ZSB0aGUgaGFzaCB1cmwgaWYgaXQgY2hhbmdlZC5cbiAgICAgIGlmICh3aW5kb3cubG9jYXRpb24uaGFzaC5zdWJzdHIoMSkgIT09IGlkKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gaWQ7XG4gICAgICAgIG5vdGVib29rLmNvbmZpZygnZnVsbFVybCcsIE5PVEVCT09LX1VSTCArIChpZCA/ICcjJyArIGlkIDogJycpKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdXBkYXRlSWQoKTtcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHVwZGF0ZUlkKTtcblxuICAgIC8vIFVwZGF0ZSB0aGUgd2luZG93IGhhc2ggd2hlbiB0aGUgaWQgY2hhbmdlcy5cbiAgICBub3RlYm9vay5vbignY29uZmlnJywgZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgIGlmIChuYW1lICE9PSAnaWQnKSB7IHJldHVybjsgfVxuXG4gICAgICByZXR1cm4gdXBkYXRlVXJsKCk7XG4gICAgfSk7XG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZSB0byBhIHNpbmdsZSBub3RlYm9vayBmcm9tIGhhc2ggY2hhbmdlcy5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBub3RlYm9va1xuICAgICAqL1xuICAgIE5vdGVib29rLnVuc3Vic2NyaWJlKGZ1bmN0aW9uICgpIHtcbiAgICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgdXBkYXRlSWQpO1xuICAgIH0pO1xuICB9KTtcbn07XG4iXX0=

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global mocha, chai */
mocha.setup('bdd');
mocha.reporter('html');

window.expect       = chai.expect;
window.NOTEBOOK_URL = {"url":"./","title":"API Notebook","oauthCallback":"/authenticate/oauth.html"}.url;
window.FIXTURES_URL = window.NOTEBOOK_URL + '/test/fixtures';

},{}],2:[function(require,module,exports){
/**
 * Extend a destination object with any number of properties and any number of
 * source object. This will override from left to right.
 *
 * @param  {Object} obj
 * @param  {Object} ...
 * @return {Object}
 */
window.extend = function (obj /*, ...source */) {
  var sources = Array.prototype.slice.call(arguments, 1);

  for (var i = 0; i < sources.length; i++) {
    for (var prop in sources[i]) {
      obj[prop] = sources[i][prop];
    }
  }

  return obj;
};

/**
 * Simulate a keypress event enough to test CodeMirror.
 *
 * @param  {CodeMirror}    editor
 * @param  {String|Number} code
 * @param  {Object}        props
 */
window.fakeKey = function (cm, code, props) {
  if (typeof code === 'string') {
    code = code.charCodeAt(0);
  }

  var e = extend({
    type: 'keydown',
    keyCode: code,
    preventDefault: function () {},
    stopPropagation: function () {}
  }, props);

  cm.triggerOnKeyDown(e);
};

/**
 * Test the autocompletion widget on a javascript editor instance.
 *
 * @param  {CodeMirror} editor
 * @param  {String}     value
 * @return {Array}
 */
window.testCompletion = function (editor, text, done) {
  // Listens to an event triggered by the widget
  editor.on('refreshCompletion', function refresh (cm, results) {
    editor.off('refreshCompletion', refresh);
    return done(App._.pluck(results, 'value'));
  });

  // Set the correct positioning
  editor.focus();
  editor.setValue(text);
  editor.setCursor(editor.lastLine(), Infinity);

  var cursor = editor.getCursor();

  // Trigger a fake change event to cause autocompletion to occur
  App.CodeMirror.Editor.signal(editor, 'change', editor, {
    origin: '+input',
    to:     extend({}, cursor),
    from:   extend({}, cursor, { ch: cursor.ch - 1 }),
    text:   [text.slice(-1)]
  });
};

/**
 * Simulate events using JavaScript.
 *
 * @return {Function}
 */
window.simulateEvent = (function () {
  var eventMatchers = {
    'HTMLEvents': /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll|focusin|focusout)$/,
    'MouseEvents': /^(?:click|dblclick|mouse(?:enter|leave|down|up|over|move|out))$/,
    'KeyboardEvent': /^(?:key(?:down|press|up))$/
  };

  var defaultOptions = {
    pointerX:   0,
    pointerY:   0,
    button:     0,
    ctrlKey:    false,
    altKey:     false,
    shiftKey:   false,
    metaKey:    false,
    bubbles:    true,
    cancelable: true
  };

  return function (element, eventName, options) {
    options = extend({}, defaultOptions, options || {});

    var eventType = null;
    var oEvent;

    // Check the event name against the available types.
    for (var name in eventMatchers) {
      if (eventMatchers[name].test(eventName)) {
        eventType = name;
        break;
      }
    }

    if (!eventType) {
      throw new SyntaxError(
        'Only HTMLEvents, MouseEvents and KeyboardEvent interfaces are supported'
      );
    }

    if (document.createEvent) {
      oEvent = document.createEvent(eventType);

      if (eventType === 'HTMLEvents') {
        oEvent.initEvent(eventName, options.bubbles, options.cancelable);
      } else if (eventType === 'KeyboardEvent') {
        oEvent.initKeyboardEvent(
          eventName,
          options.bubbles,
          options.cancelable,
          document.defaultView,
          options.char,
          options.key,
          options.location,
          '', // Fix `modifiersListArg`
          options.repeat,
          options.locale
        );
      } else {
        oEvent.initMouseEvent(
          eventName,
          options.bubbles,
          options.cancelable,
          document.defaultView,
          options.button,
          options.pointerX,
          options.pointerY,
          options.pointerX,
          options.pointerY,
          options.ctrlKey,
          options.altKey,
          options.shiftKey,
          options.metaKey,
          options.button,
          element
        );
      }

      element.dispatchEvent(oEvent);
    } else {
      // Alias position options.
      options.clientX = options.pointerX;
      options.clientY = options.pointerY;

      oEvent = extend(document.createEventObject(), options);
      element.fireEvent('on' + eventName, oEvent);
    }

    return element;
  };
})();

},{}]},{},[1,2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ0ZXN0L3NjcmlwdHMvY29tbW9uLmpzIiwidGVzdC9zY3JpcHRzL2hlbHBlcnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvKiBnbG9iYWwgbW9jaGEsIGNoYWkgKi9cbm1vY2hhLnNldHVwKCdiZGQnKTtcbm1vY2hhLnJlcG9ydGVyKCdodG1sJyk7XG5cbndpbmRvdy5leHBlY3QgICAgICAgPSBjaGFpLmV4cGVjdDtcbndpbmRvdy5OT1RFQk9PS19VUkwgPSB7XCJ1cmxcIjpcIi4vXCIsXCJ0aXRsZVwiOlwiQVBJIE5vdGVib29rXCIsXCJvYXV0aENhbGxiYWNrXCI6XCIvYXV0aGVudGljYXRlL29hdXRoLmh0bWxcIn0udXJsO1xud2luZG93LkZJWFRVUkVTX1VSTCA9IHdpbmRvdy5OT1RFQk9PS19VUkwgKyAnL3Rlc3QvZml4dHVyZXMnO1xuIiwiLyoqXG4gKiBFeHRlbmQgYSBkZXN0aW5hdGlvbiBvYmplY3Qgd2l0aCBhbnkgbnVtYmVyIG9mIHByb3BlcnRpZXMgYW5kIGFueSBudW1iZXIgb2ZcbiAqIHNvdXJjZSBvYmplY3QuIFRoaXMgd2lsbCBvdmVycmlkZSBmcm9tIGxlZnQgdG8gcmlnaHQuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSAge09iamVjdH0gLi4uXG4gKiBAcmV0dXJuIHtPYmplY3R9XG4gKi9cbndpbmRvdy5leHRlbmQgPSBmdW5jdGlvbiAob2JqIC8qLCAuLi5zb3VyY2UgKi8pIHtcbiAgdmFyIHNvdXJjZXMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc291cmNlcy5sZW5ndGg7IGkrKykge1xuICAgIGZvciAodmFyIHByb3AgaW4gc291cmNlc1tpXSkge1xuICAgICAgb2JqW3Byb3BdID0gc291cmNlc1tpXVtwcm9wXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JqO1xufTtcblxuLyoqXG4gKiBTaW11bGF0ZSBhIGtleXByZXNzIGV2ZW50IGVub3VnaCB0byB0ZXN0IENvZGVNaXJyb3IuXG4gKlxuICogQHBhcmFtICB7Q29kZU1pcnJvcn0gICAgZWRpdG9yXG4gKiBAcGFyYW0gIHtTdHJpbmd8TnVtYmVyfSBjb2RlXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICBwcm9wc1xuICovXG53aW5kb3cuZmFrZUtleSA9IGZ1bmN0aW9uIChjbSwgY29kZSwgcHJvcHMpIHtcbiAgaWYgKHR5cGVvZiBjb2RlID09PSAnc3RyaW5nJykge1xuICAgIGNvZGUgPSBjb2RlLmNoYXJDb2RlQXQoMCk7XG4gIH1cblxuICB2YXIgZSA9IGV4dGVuZCh7XG4gICAgdHlwZTogJ2tleWRvd24nLFxuICAgIGtleUNvZGU6IGNvZGUsXG4gICAgcHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uICgpIHt9LFxuICAgIHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24gKCkge31cbiAgfSwgcHJvcHMpO1xuXG4gIGNtLnRyaWdnZXJPbktleURvd24oZSk7XG59O1xuXG4vKipcbiAqIFRlc3QgdGhlIGF1dG9jb21wbGV0aW9uIHdpZGdldCBvbiBhIGphdmFzY3JpcHQgZWRpdG9yIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSAge0NvZGVNaXJyb3J9IGVkaXRvclxuICogQHBhcmFtICB7U3RyaW5nfSAgICAgdmFsdWVcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG53aW5kb3cudGVzdENvbXBsZXRpb24gPSBmdW5jdGlvbiAoZWRpdG9yLCB0ZXh0LCBkb25lKSB7XG4gIC8vIExpc3RlbnMgdG8gYW4gZXZlbnQgdHJpZ2dlcmVkIGJ5IHRoZSB3aWRnZXRcbiAgZWRpdG9yLm9uKCdyZWZyZXNoQ29tcGxldGlvbicsIGZ1bmN0aW9uIHJlZnJlc2ggKGNtLCByZXN1bHRzKSB7XG4gICAgZWRpdG9yLm9mZigncmVmcmVzaENvbXBsZXRpb24nLCByZWZyZXNoKTtcbiAgICByZXR1cm4gZG9uZShBcHAuXy5wbHVjayhyZXN1bHRzLCAndmFsdWUnKSk7XG4gIH0pO1xuXG4gIC8vIFNldCB0aGUgY29ycmVjdCBwb3NpdGlvbmluZ1xuICBlZGl0b3IuZm9jdXMoKTtcbiAgZWRpdG9yLnNldFZhbHVlKHRleHQpO1xuICBlZGl0b3Iuc2V0Q3Vyc29yKGVkaXRvci5sYXN0TGluZSgpLCBJbmZpbml0eSk7XG5cbiAgdmFyIGN1cnNvciA9IGVkaXRvci5nZXRDdXJzb3IoKTtcblxuICAvLyBUcmlnZ2VyIGEgZmFrZSBjaGFuZ2UgZXZlbnQgdG8gY2F1c2UgYXV0b2NvbXBsZXRpb24gdG8gb2NjdXJcbiAgQXBwLkNvZGVNaXJyb3IuRWRpdG9yLnNpZ25hbChlZGl0b3IsICdjaGFuZ2UnLCBlZGl0b3IsIHtcbiAgICBvcmlnaW46ICcraW5wdXQnLFxuICAgIHRvOiAgICAgZXh0ZW5kKHt9LCBjdXJzb3IpLFxuICAgIGZyb206ICAgZXh0ZW5kKHt9LCBjdXJzb3IsIHsgY2g6IGN1cnNvci5jaCAtIDEgfSksXG4gICAgdGV4dDogICBbdGV4dC5zbGljZSgtMSldXG4gIH0pO1xufTtcblxuLyoqXG4gKiBTaW11bGF0ZSBldmVudHMgdXNpbmcgSmF2YVNjcmlwdC5cbiAqXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xud2luZG93LnNpbXVsYXRlRXZlbnQgPSAoZnVuY3Rpb24gKCkge1xuICB2YXIgZXZlbnRNYXRjaGVycyA9IHtcbiAgICAnSFRNTEV2ZW50cyc6IC9eKD86bG9hZHx1bmxvYWR8YWJvcnR8ZXJyb3J8c2VsZWN0fGNoYW5nZXxzdWJtaXR8cmVzZXR8Zm9jdXN8Ymx1cnxyZXNpemV8c2Nyb2xsfGZvY3VzaW58Zm9jdXNvdXQpJC8sXG4gICAgJ01vdXNlRXZlbnRzJzogL14oPzpjbGlja3xkYmxjbGlja3xtb3VzZSg/OmVudGVyfGxlYXZlfGRvd258dXB8b3Zlcnxtb3ZlfG91dCkpJC8sXG4gICAgJ0tleWJvYXJkRXZlbnQnOiAvXig/OmtleSg/OmRvd258cHJlc3N8dXApKSQvXG4gIH07XG5cbiAgdmFyIGRlZmF1bHRPcHRpb25zID0ge1xuICAgIHBvaW50ZXJYOiAgIDAsXG4gICAgcG9pbnRlclk6ICAgMCxcbiAgICBidXR0b246ICAgICAwLFxuICAgIGN0cmxLZXk6ICAgIGZhbHNlLFxuICAgIGFsdEtleTogICAgIGZhbHNlLFxuICAgIHNoaWZ0S2V5OiAgIGZhbHNlLFxuICAgIG1ldGFLZXk6ICAgIGZhbHNlLFxuICAgIGJ1YmJsZXM6ICAgIHRydWUsXG4gICAgY2FuY2VsYWJsZTogdHJ1ZVxuICB9O1xuXG4gIHJldHVybiBmdW5jdGlvbiAoZWxlbWVudCwgZXZlbnROYW1lLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IGV4dGVuZCh7fSwgZGVmYXVsdE9wdGlvbnMsIG9wdGlvbnMgfHwge30pO1xuXG4gICAgdmFyIGV2ZW50VHlwZSA9IG51bGw7XG4gICAgdmFyIG9FdmVudDtcblxuICAgIC8vIENoZWNrIHRoZSBldmVudCBuYW1lIGFnYWluc3QgdGhlIGF2YWlsYWJsZSB0eXBlcy5cbiAgICBmb3IgKHZhciBuYW1lIGluIGV2ZW50TWF0Y2hlcnMpIHtcbiAgICAgIGlmIChldmVudE1hdGNoZXJzW25hbWVdLnRlc3QoZXZlbnROYW1lKSkge1xuICAgICAgICBldmVudFR5cGUgPSBuYW1lO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoIWV2ZW50VHlwZSkge1xuICAgICAgdGhyb3cgbmV3IFN5bnRheEVycm9yKFxuICAgICAgICAnT25seSBIVE1MRXZlbnRzLCBNb3VzZUV2ZW50cyBhbmQgS2V5Ym9hcmRFdmVudCBpbnRlcmZhY2VzIGFyZSBzdXBwb3J0ZWQnXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuICAgICAgb0V2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoZXZlbnRUeXBlKTtcblxuICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gJ0hUTUxFdmVudHMnKSB7XG4gICAgICAgIG9FdmVudC5pbml0RXZlbnQoZXZlbnROYW1lLCBvcHRpb25zLmJ1YmJsZXMsIG9wdGlvbnMuY2FuY2VsYWJsZSk7XG4gICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gJ0tleWJvYXJkRXZlbnQnKSB7XG4gICAgICAgIG9FdmVudC5pbml0S2V5Ym9hcmRFdmVudChcbiAgICAgICAgICBldmVudE5hbWUsXG4gICAgICAgICAgb3B0aW9ucy5idWJibGVzLFxuICAgICAgICAgIG9wdGlvbnMuY2FuY2VsYWJsZSxcbiAgICAgICAgICBkb2N1bWVudC5kZWZhdWx0VmlldyxcbiAgICAgICAgICBvcHRpb25zLmNoYXIsXG4gICAgICAgICAgb3B0aW9ucy5rZXksXG4gICAgICAgICAgb3B0aW9ucy5sb2NhdGlvbixcbiAgICAgICAgICAnJywgLy8gRml4IGBtb2RpZmllcnNMaXN0QXJnYFxuICAgICAgICAgIG9wdGlvbnMucmVwZWF0LFxuICAgICAgICAgIG9wdGlvbnMubG9jYWxlXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvRXZlbnQuaW5pdE1vdXNlRXZlbnQoXG4gICAgICAgICAgZXZlbnROYW1lLFxuICAgICAgICAgIG9wdGlvbnMuYnViYmxlcyxcbiAgICAgICAgICBvcHRpb25zLmNhbmNlbGFibGUsXG4gICAgICAgICAgZG9jdW1lbnQuZGVmYXVsdFZpZXcsXG4gICAgICAgICAgb3B0aW9ucy5idXR0b24sXG4gICAgICAgICAgb3B0aW9ucy5wb2ludGVyWCxcbiAgICAgICAgICBvcHRpb25zLnBvaW50ZXJZLFxuICAgICAgICAgIG9wdGlvbnMucG9pbnRlclgsXG4gICAgICAgICAgb3B0aW9ucy5wb2ludGVyWSxcbiAgICAgICAgICBvcHRpb25zLmN0cmxLZXksXG4gICAgICAgICAgb3B0aW9ucy5hbHRLZXksXG4gICAgICAgICAgb3B0aW9ucy5zaGlmdEtleSxcbiAgICAgICAgICBvcHRpb25zLm1ldGFLZXksXG4gICAgICAgICAgb3B0aW9ucy5idXR0b24sXG4gICAgICAgICAgZWxlbWVudFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBlbGVtZW50LmRpc3BhdGNoRXZlbnQob0V2ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQWxpYXMgcG9zaXRpb24gb3B0aW9ucy5cbiAgICAgIG9wdGlvbnMuY2xpZW50WCA9IG9wdGlvbnMucG9pbnRlclg7XG4gICAgICBvcHRpb25zLmNsaWVudFkgPSBvcHRpb25zLnBvaW50ZXJZO1xuXG4gICAgICBvRXZlbnQgPSBleHRlbmQoZG9jdW1lbnQuY3JlYXRlRXZlbnRPYmplY3QoKSwgb3B0aW9ucyk7XG4gICAgICBlbGVtZW50LmZpcmVFdmVudCgnb24nICsgZXZlbnROYW1lLCBvRXZlbnQpO1xuICAgIH1cblxuICAgIHJldHVybiBlbGVtZW50O1xuICB9O1xufSkoKTtcbiJdfQ==

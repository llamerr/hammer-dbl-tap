(function DblTap(Hammer) {
  if (typeof Hammer === 'undefined') {
    throw new Error('Hammer isn\'t defined.');
  }

  /**
   * calculate the absolute distance between two points
   * @param {Object} p1 {x, y}
   * @param {Object} p2 {x, y}
   * @param {Array} [props_] containing x and y keys
   * @return {Number} distance
   */
  function getDistance(p1, p2, props_) {
    var props = props_ || [ 'x', 'y' ];
    var x = p2[ props[ 0 ] ] - p1[ props[ 0 ] ];
    var y = p2[ props[ 1 ] ] - p1[ props[ 1 ] ];

    return Math.sqrt((x * x) + (y * y));
  }

//https://github.com/hammerjs/hammer.js/issues/747
//https://gist.github.com/FFittkau/462df729e728ffb3188e#file-gistfile1-js

// Basing on http://hammerjs.github.io/recognizer-tap/ version 2.0.4
// Double Tap Recognizer implementation to directly fire DblTap Event when tapCount 2 is reached.
// It can/should be used in parallel with a single tap recognizer.
// Original implementation waits for a third tap (requiring 300ms more time for recognition)...

  function DblTapRecognizer() {
    Hammer.Recognizer.apply(this, arguments);

    // previous time and center,
    // used for tap counting
    this.pTime = false;
    this.pCenter = false;

    this._timer = null;
    this._input = null;
    this.count = 0;
  }

  Hammer.inherit(DblTapRecognizer, Hammer.Tap, {
    defaults: {
      event: 'dbltap',
      pointers: 1,
      taps: 2,
      interval: 300, // max time between the multi-tap taps
      time: 250, // max time of the pointer to be down (like finger on the screen)
      threshold: 2, // a minimal movement is ok, but keep it low
      posThreshold: 10 // a multi-tap can be a bit off the initial position
    },

    process: function(input) {
      var options = this.options;

      var validPointers = input.pointers.length === options.pointers;
      var validMovement = input.distance < options.threshold;
      var validTouchTime = input.deltaTime < options.time;

      this.reset();

      if ((input.eventType & Hammer.INPUT_START) && (this.count === 0)) {
        return this.failTimeout();
      }

      // we only allow little movement
      // and we've reached an end event, so a tap is possible
      if (validMovement && validTouchTime && validPointers) {
        if (input.eventType !== Hammer.INPUT_END) {
          return this.failTimeout();
        }

        var validInterval = this.pTime ? input.timeStamp - this.pTime < options.interval : true;
        var validMultiTap = !this.pCenter || getDistance(this.pCenter, input.center) < options.posThreshold;

        this.pTime = input.timeStamp;
        this.pCenter = input.center;

        if (!validMultiTap || !validInterval) {
          this.count = 1;
        }
        else {
          this.count += 1;
        }

        this._input = input;

        // if tap count matches we have recognized it,
        // else it has began recognizing...
        var tapCount = this.count % options.taps;

        if (tapCount === 0) {
          return Hammer.STATE_RECOGNIZED;
        }
      }

      return Hammer.STATE_FAILED;
    }
  });

  Hammer.assign(Hammer, {
    DblTap: DblTapRecognizer
  });
})(window.Hammer);

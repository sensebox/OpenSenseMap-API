'use strict';

const Transform = require('stream').Transform,
  inherits = require('util').inherits,
  simpleStatistics = require('simple-statistics');

const descriptiveStatisticsTransformer = function (descriptiveStatisticsTransformerOptions, streamOptions) {
  if (!(this instanceof descriptiveStatisticsTransformer)) {
    return new descriptiveStatisticsTransformer(descriptiveStatisticsTransformerOptions, streamOptions);
  }

  if (!streamOptions) {
    streamOptions = {};
  }
  streamOptions.decodeStrings = false;
  streamOptions.objectMode = true;

  const { windows, operation, tidy = false } = descriptiveStatisticsTransformerOptions;
  if (!windows) {
    throw new Error('Missing options. Please specify `windows` and `operation`.');
  }

  this._tidy = tidy;
  this._windows = windows;

  // compute possible average windows
  this._currSensor;
  this._currWindowIndex = 0;

  // Object with windows as keys to be filled with computed values
  // { new Date('2018-01-02T12:00:00Z'): 5, new Date('2018-01-02T12:00:00Z'): 7 ... }
  this._windowValues = Object.create(null);

  // selected operation
  switch (operation) {
  case ('arithmeticMean'):
    this._operation = simpleStatistics['mean'];
    break;
  case ('mode'):
    this._operation = simpleStatistics['modeFast'];
    break;

  default:
    this._operation = simpleStatistics[operation];
  }

  Transform.call(this, streamOptions);
};

descriptiveStatisticsTransformer.prototype.resetSensor = function resetSensor (measurement) {
  this._currValues = [];
  // assign measurement as _currSensor
  // no need to strip unwanted properties, this is done later in stringification
  this._currSensor = measurement;

  this._windowValues = Object.create(null);

  // find the right _currWindowIndex to start..
  this._currWindowIndex = 0;
  this.nextWindow(measurement);
};

descriptiveStatisticsTransformer.prototype.nextWindow = function nextWindow (measurement) {
  while (measurement.createdAt > this._windows[this._currWindowIndex]) {
    this._currWindowIndex = this._currWindowIndex + 1;
  }
  // back up one step, the measurement has not yet been handled
  this._currWindowIndex = this._currWindowIndex - 1;
  // reset _currValues array
  this._currValues = [];
};

descriptiveStatisticsTransformer.prototype.executeOperation = function executeOperation () {
  try {
    this._windowValues[this._windows[this._currWindowIndex].toISOString()] = this._operation(this._currValues);
    /* eslint-disable no-empty */
  } catch (e) { /* ignore the error */ }
  /* eslint-enable */
};

descriptiveStatisticsTransformer.prototype.pushResults = function pushResults () {
  if (this._tidy) {
    // push windows one by one
    for (const [windowKey, windowValue] of Object.entries(this._windowValues)) {
      this.push({
        ...this._currSensor,
        ...{ time_start: windowKey, operation_window: windowValue }
      });
    }
  } else {
    this.push({
      ...this._currSensor,
      ...this._windowValues
    });
  }
};

descriptiveStatisticsTransformer.prototype._transform = function _transform (measurement, encoding, callback) {
  // data is an object with at least createdAt (Date), value (float) and sensorId (string) properties

  // First measurement
  // Initialize _currSensor and _currValues array
  if (!this._currSensor) {
    this.resetSensor(measurement);
  }

  // new sensor, push everything of the last sensor down the stream
  if (this._currSensor.sensorId !== measurement.sensorId) {
    // one last time for this sensor, execute the operation
    this.executeOperation();
    // push the sensor down the stream
    this.pushResults();

    // reset _currValues and reset _currSensor
    this.resetSensor(measurement);
  }

  // if the measurement is outside of the currentWindow, execute the operation
  if (measurement.createdAt > this._windows[this._currWindowIndex + 1]) {
    this.executeOperation();
    // reset for next window, increases _currentWindowIndex and resets _currValues array
    this.nextWindow(measurement);
  }

  // push the measurement to the currValues array
  this._currValues.push(measurement.value);

  callback();
};

descriptiveStatisticsTransformer.prototype._flush = function (done) {
  if (this._currSensor) {
    this.executeOperation();
    // push the sensor down the stream
    this.pushResults();
  }
  done();
};

inherits(descriptiveStatisticsTransformer, Transform);

module.exports = descriptiveStatisticsTransformer;


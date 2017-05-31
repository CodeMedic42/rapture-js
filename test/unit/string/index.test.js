/* eslint-disable import/no-extraneous-dependencies */

const BaseTest = require('./base.spec.js');
const LengthTest = require('./length.spec.js');
const MaxTest = require('./max.spec.js');
const MinTest = require('./min.spec.js');
const ValidTest = require('./valid.spec.js');

describe('String Tests :', () => {
    BaseTest();
    LengthTest();
    MaxTest();
    MinTest();
    ValidTest();
});

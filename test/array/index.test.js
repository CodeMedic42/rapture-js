/* eslint-disable import/no-extraneous-dependencies */

const BaseTest = require('./base.spec.js');
const ItemsTest = require('./items.spec.js');
const LengthTest = require('./length.spec.js');
const MaxTest = require('./max.spec.js');
const MinTest = require('./min.spec.js');

describe('Array Tests :', () => {
    BaseTest();
    ItemsTest();
    LengthTest();
    MaxTest();
    MinTest();
});

/* eslint-disable import/no-extraneous-dependencies */

const BaseTest = require('./base.spec.js');

const KeysTest = require('./keys.spec.js');
const MatchTest = require('./match.spec.js');

const NandTest = require('./nand.spec.js');
const RequiredTest = require('./required.spec.js');
const WithoutTest = require('./without.spec.js');
const XorTest = require('./xor.spec.js');

describe('Object Tests :', () => {
    BaseTest();
    KeysTest();
    MatchTest();

    NandTest();
    RequiredTest();
    WithoutTest();
    XorTest();
});

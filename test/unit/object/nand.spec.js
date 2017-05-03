const Rapture = require('../../../src');
const TestingSupport = require('../../testingSupport');

/*

Defines a relationship between keys where not all peers can be present at the same time where:

peers - the key names of which if one present, the others may not all be present. peers can be a single string value, an array of string values, or each peer provided as an argument.
const schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).nand('a', 'b');

*/

module.exports = () => {
    describe('Rule - nand :', () => {
        it('does not generate an issue when not an object', () => {
            const testObject = [];

            const rule = Rapture.object().nand('foo', 'bar');

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 0,
                rowEnd: 0,
                columnStart: 0,
                columnEnd: 0,
                message: 'When defined this field must be a plain object',
                cause: '',
                severity: 'error'
            });
        });

        it('No property exists', () => {
            const testObject = {
                goo: 'gaz'
            };

            const rule = Rapture.object().nand('foo', 'bar');

            TestingSupport.pass(testObject, rule);
        });

        describe('First Property exists', () => {
            it('Second does not exist', () => {
                const testObject = {
                    foo: 'faz',
                    goo: 'gaz'
                };

                const rule = Rapture.object().nand('foo', 'bar');

                TestingSupport.pass(testObject, rule);
            });

            it('Second does exist', () => {
                const testObject = {
                    foo: 'faz',
                    bar: 'baz',
                    goo: 'gaz'
                };

                const rule = Rapture.object().nand('foo', 'bar');

                TestingSupport.fail(testObject, rule, [{
                    type: 'schema',
                    rowStart: 1,
                    rowEnd: 1,
                    columnStart: 2,
                    columnEnd: 7,
                    message: '["foo","bar"] cannot all exist at the same time.',
                    cause: 'foo',
                    severity: 'error'
                }, {
                    type: 'schema',
                    rowStart: 2,
                    rowEnd: 2,
                    columnStart: 2,
                    columnEnd: 7,
                    message: '["foo","bar"] cannot all exist at the same time.',
                    cause: 'bar',
                    severity: 'error'
                }]);
            });
        });

        describe('Second Property exists', () => {
            it('First does not exist', () => {
                const testObject = {
                    bar: 'baz',
                    goo: 'gaz'
                };

                const rule = Rapture.object().nand('foo', 'bar');

                TestingSupport.pass(testObject, rule);
            });
        });

        it('Flattens Arrays', () => {
            const testObject = {
                fooA: 'fazA',
                fooB: 'fazB'
            };

            const rule = Rapture.object().nand([[]], ['fooA', [], 'fooB', [[['fooC']]]], 'fooD');

            TestingSupport.fail(testObject, rule, [{
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 8,
                message: '["fooA","fooB","fooC","fooD"] cannot all exist at the same time.',
                cause: 'fooA',
                severity: 'error'
            }, {
                type: 'schema',
                rowStart: 2,
                rowEnd: 2,
                columnStart: 2,
                columnEnd: 8,
                message: '["fooA","fooB","fooC","fooD"] cannot all exist at the same time.',
                cause: 'fooB',
                severity: 'error'
            }]);
        });
    });
};

const Rapture = require('../../../src');
const TestingSupport = require('../../testingSupport');

/*

Defines an exclusive relationship between a set of keys where one of them is required but not at the same time where:

peers - the exclusive key names that must not appear together but where one of them is required. peers can be a single string value, an array of string values, or each peer provided as an argument.
const schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).xor('a', 'b');

*/

module.exports = () => {
    describe('Rule - xor :', () => {
        it('does not generate an issue when not an object', () => {
            const testObject = [];

            const rule = Rapture.object().xor('foo', 'bar');

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
            const testObject = {};

            const rule = Rapture.object().xor('foo', 'bar');

            TestingSupport.fail(testObject, rule, [{
                type: 'schema',
                rowStart: 0,
                rowEnd: 0,
                columnStart: 0,
                columnEnd: 0,
                message: 'One of ["foo","bar"] is required',
                cause: '',
                severity: 'error'
            }]);
        });

        describe('First Property exists', () => {
            it('Second does not exist', () => {
                const testObject = {
                    foo: 'faz'
                };

                const rule = Rapture.object().xor('foo', 'bar');

                TestingSupport.pass(testObject, rule);
            });

            it('Second does exist', () => {
                const testObject = {
                    foo: 'faz',
                    bar: 'baz'
                };

                const rule = Rapture.object().xor('foo', 'bar');

                TestingSupport.fail(testObject, rule, [{
                    type: 'schema',
                    rowStart: 1,
                    rowEnd: 1,
                    columnStart: 2,
                    columnEnd: 7,
                    message: 'Only one of ["foo","bar"] is allowed',
                    cause: 'foo',
                    severity: 'error'
                }, {
                    type: 'schema',
                    rowStart: 2,
                    rowEnd: 2,
                    columnStart: 2,
                    columnEnd: 7,
                    message: 'Only one of ["foo","bar"] is allowed',
                    cause: 'bar',
                    severity: 'error'
                }]);
            });
        });

        describe('Second Property exists', () => {
            it('First does not exist', () => {
                const testObject = {
                    bar: 'baz'
                };

                const rule = Rapture.object().xor('foo', 'bar');

                TestingSupport.pass(testObject, rule);
            });
        });

        it('Flattens Arrays', () => {
            const testObject = {
                fooA: 'fazA',
                fooB: 'fazB',
                fooC: 'fazC'
            };

            const rule = Rapture.object().xor([[]], ['fooA', [], 'fooB', [[['fooC']]]], 'fooD');

            TestingSupport.fail(testObject, rule, [{
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 8,
                message: 'Only one of ["fooA","fooB","fooC","fooD"] is allowed',
                cause: 'fooA',
                severity: 'error'
            }, {
                type: 'schema',
                rowStart: 2,
                rowEnd: 2,
                columnStart: 2,
                columnEnd: 8,
                message: 'Only one of ["fooA","fooB","fooC","fooD"] is allowed',
                cause: 'fooB',
                severity: 'error'
            }, {
                type: 'schema',
                rowStart: 3,
                rowEnd: 3,
                columnStart: 2,
                columnEnd: 8,
                message: 'Only one of ["fooA","fooB","fooC","fooD"] is allowed',
                cause: 'fooC',
                severity: 'error'
            }]);
        });
    });
};

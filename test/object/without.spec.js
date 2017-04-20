const Rapture = require('../../src');
const TestingSupport = require('../testingSupport');

/*

Forbids the presence of other keys whenever the specified is present where:

key - the reference key.
peers - the forbidden peer key names that must not appear together with key. peers can be a single string value or an array of string values.
const schema = Joi.object().keys({
    a: Joi.any(),
    b: Joi.any()
}).without('a', ['b']);

*/

module.exports = () => {
    describe('Rule - without :', () => {
        it('does not generate an issue when not an object', () => {
            const testObject = [];

            const rule = Rapture.object().without('foo', 'bar');

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

            const rule = Rapture.object().without('foo', 'bar');

            TestingSupport.pass(testObject, rule);
        });

        describe('First Property exists', () => {
            it('Second does not exist', () => {
                const testObject = {
                    foo: 'faz'
                };

                const rule = Rapture.object().without('foo', 'bar');

                TestingSupport.pass(testObject, rule);
            });

            it('Second does exist', () => {
                const testObject = {
                    foo: 'faz',
                    bar: 'baz'
                };

                const rule = Rapture.object().without('foo', 'bar');

                TestingSupport.fail(testObject, rule, [{
                    type: 'schema',
                    rowStart: 2,
                    rowEnd: 2,
                    columnStart: 2,
                    columnEnd: 7,
                    message: 'Cannot exist when "foo" exists',
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

                const rule = Rapture.object().without('foo', 'bar');

                TestingSupport.pass(testObject, rule);
            });
        });

        it('Flattens Arrays', () => {
            const testObject = {
                bar: 'baz',
                fooA: 'fazA',
                fooB: 'fazB'
            };

            const rule = Rapture.object().without('bar', [[]], ['fooA', [], 'fooB', [[['fooC']]]], 'fooD');

            TestingSupport.fail(testObject, rule, [{
                type: 'schema',
                rowStart: 2,
                rowEnd: 2,
                columnStart: 2,
                columnEnd: 8,
                message: 'Cannot exist when "bar" exists',
                cause: 'fooA',
                severity: 'error'
            }, {
                type: 'schema',
                rowStart: 3,
                rowEnd: 3,
                columnStart: 2,
                columnEnd: 8,
                message: 'Cannot exist when "bar" exists',
                cause: 'fooB',
                severity: 'error'
            }]);
        });
    });
};

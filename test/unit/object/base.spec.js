/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Rapture = require('../../../src');
const TestingSupport = require('../../testingSupport');

Chai.use(DirtyChai);

const expect = Chai.expect;

module.exports = () => {
    describe('Base Rule:', () => {
        describe('Rule called once :', () => {
            it('Empty object', () => {
                const testObject = {};

                const rule = Rapture.object();

                TestingSupport.pass(testObject, rule);
            });

            it('Object with a property', () => {
                const testObject = {
                    foo: 'foo'
                };

                const rule = Rapture.object();

                TestingSupport.pass(testObject, rule);
            });

            it('Not an object', () => {
                const testObject = [];

                const rule = Rapture.object();

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

            it('Not an object then becomes one', () => {
                let testObject = [];

                const rule = Rapture.object();

                const context = TestingSupport.fail(testObject, rule, {
                    type: 'schema',
                    rowStart: 0,
                    rowEnd: 0,
                    columnStart: 0,
                    columnEnd: 0,
                    message: 'When defined this field must be a plain object',
                    cause: '',
                    severity: 'error'
                });

                testObject = {};

                TestingSupport.updatePass(context, testObject);
            });

            it('Is null', () => {
                const testObject = null;

                const rule = Rapture.object();

                TestingSupport.pass(testObject, rule);
            });
        });

        it('Rule cannot be called twice :', () => {
            const rule = Rapture.object();

            expect(rule.object).to.not.exist();
        });
    });
};

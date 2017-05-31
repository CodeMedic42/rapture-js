/* eslint-disable import/no-extraneous-dependencies */
const Rapture = require('../../../src');
const TestingSupport = require('../../testingSupport');

module.exports = () => {
    describe('Rule - Max :', () => {
        it('is a string with max', () => {
            const testObject = {
                strValue: 'foo'
            };

            const rule = Rapture.object().valid({
                strValue: Rapture.string().max(4)
            });

            TestingSupport.pass(testObject, rule);
        });

        it('is a string with max - fail', () => {
            const testObject = {
                strValue: 'foobar'
            };

            const rule = Rapture.object().valid({
                strValue: Rapture.string().max(4)
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 12,
                message: 'Must be less than 5 characters long.',
                cause: 'strValue',
                severity: 'error'
            });
        });
    });
};

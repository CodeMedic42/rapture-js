/* eslint-disable import/no-extraneous-dependencies */
const Rapture = require('../../src');
const TestingSupport = require('../testingSupport');

module.exports = () => {
    describe('Base Rule:', () => {
        it('is a string', () => {
            const testObject = {
                strValue: 'valid'
            };

            const rule = Rapture.object().keys({
                strValue: Rapture.string()
            });

            TestingSupport.pass(testObject, rule);
        });

        it('is not a string', () => {
            const testObject = {
                strValue: 42
            };

            const rule = Rapture.object().keys({
                strValue: Rapture.string()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 12,
                message: 'When defined this field must be a string.',
                cause: 'strValue',
                severity: 'error'
            });
        });
    });
};

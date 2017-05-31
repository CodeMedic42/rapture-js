const Rapture = require('../../../src');
const TestingSupport = require('../../testingSupport');

module.exports = () => {
    describe('Rule - required :', () => {
        it('does not generate an issue when not an object', () => {
            const testObject = [];

            const rule = Rapture.object().required('foo', 'bar');

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
    });
};

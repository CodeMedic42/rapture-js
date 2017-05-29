const Rapture = require('../../../src');
const TestingSupport = require('../../testingSupport');

describe('Is Tests :', () => {
    describe('String Type :', () => {
        it('Is a String', () => {
            const testObject = {
                foo: 'faz'
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('string', Rapture.string().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Is Running',
                cause: 'foo',
                severity: 'error'
            });
        });

        it('Is not a String', () => {
            const testObject = {
                foo: 42
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('string', Rapture.string().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Invalid value type',
                cause: 'foo',
                severity: 'error'
            });
        });
    });

    describe('Number Type :', () => {
        it('Is a Number', () => {
            const testObject = {
                foo: 42
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('number', Rapture.number().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Is Running',
                cause: 'foo',
                severity: 'error'
            });
        });

        it('Is not a Number', () => {
            const testObject = {
                foo: 'faz'
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('number', Rapture.number().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Invalid value type',
                cause: 'foo',
                severity: 'error'
            });
        });
    });

    describe('Boolean Type :', () => {
        it('Is a Boolean', () => {
            const testObject = {
                foo: true
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('boolean', Rapture.boolean().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Is Running',
                cause: 'foo',
                severity: 'error'
            });
        });

        it('Is not a Boolean', () => {
            const testObject = {
                foo: 42
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('boolean', Rapture.boolean().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Invalid value type',
                cause: 'foo',
                severity: 'error'
            });
        });
    });

    describe('Date Type :', () => {
        it('Is a Date', () => {
            const testObject = {
                foo: new Date()
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('date', Rapture.date().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Is Running',
                cause: 'foo',
                severity: 'error'
            });
        });

        it('Is not a Date', () => {
            const testObject = {
                foo: 42
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('date', Rapture.date().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Invalid value type',
                cause: 'foo',
                severity: 'error'
            });
        });
    });

    describe('Object Type :', () => {
        it('Is a Object', () => {
            const testObject = {
                foo: {}
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('object', Rapture.object().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Is Running',
                cause: 'foo',
                severity: 'error'
            });
        });

        it('Is not a Object', () => {
            const testObject = {
                foo: 42
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('object', Rapture.object().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Invalid value type',
                cause: 'foo',
                severity: 'error'
            });
        });
    });

    describe('Array Type :', () => {
        it('Is a Array', () => {
            const testObject = {
                foo: []
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('array', Rapture.array().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Is Running',
                cause: 'foo',
                severity: 'error'
            });
        });

        it('Is not a Array', () => {
            const testObject = {
                foo: 42
            };

            const rule = Rapture.object().valid({
                foo: Rapture.is('array', Rapture.array().custom({
                    onValid: control =>
                        control.raise('schema', 'Is Running', 'error')
                })).endIs()
            });

            TestingSupport.fail(testObject, rule, {
                type: 'schema',
                rowStart: 1,
                rowEnd: 1,
                columnStart: 2,
                columnEnd: 7,
                message: 'Invalid value type',
                cause: 'foo',
                severity: 'error'
            });
        });
    });
});

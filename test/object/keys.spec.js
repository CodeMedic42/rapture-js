const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Rapture = require('../../src');
const TestingSupport = require('../testingSupport');

Chai.use(DirtyChai);

const expect = Chai.expect;

module.exports = () => {
    describe('Rule - Keys :', () => {
        describe('No options :', () => {
            const option = null;

            describe('Rule called once :', () => {
                describe('Parameter - Empty :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys(undefined, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = {
                            validKey: 'foo'
                        };

                        const rule = Rapture.object().keys(undefined, option);

                        TestingSupport.pass(testObject, rule);
                    });
                });

                describe('Parameter - Empty object :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys({}, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().keys({}, option);

                        TestingSupport.fail(testObject, rule, {
                            type: 'schema',
                            rowStart: 1,
                            rowEnd: 1,
                            columnStart: 2,
                            columnEnd: 14,
                            message: 'The property "invalidKey" is not allowed to exist.',
                            cause: 'invalidKey',
                            severity: 'error'
                        });
                    });
                });

                describe('Parameter - Object with single key("validKey") :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        TestingSupport.fail(testObject, rule, {
                            type: 'schema',
                            rowStart: 1,
                            rowEnd: 1,
                            columnStart: 2,
                            columnEnd: 14,
                            message: 'The property "invalidKey" is not allowed to exist.',
                            cause: 'invalidKey',
                            severity: 'error'
                        });
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = { validKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with keys("validKey", "invalidKey")', () => {
                        const testObject = { validKey: 'foo', invalidKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        TestingSupport.fail(testObject, rule, {
                            type: 'schema',
                            rowStart: 2,
                            rowEnd: 2,
                            columnStart: 2,
                            columnEnd: 14,
                            message: 'The property "invalidKey" is not allowed to exist.',
                            cause: 'invalidKey',
                            severity: 'error'
                        });
                    });
                });

                describe('Parameter - Rapture logic :', () => {
                    describe('Does not result in a plain object :', () => {
                        it('Results in null', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return null; }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Results in Rapture logic', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return Rapture.logic({
                                        onRun: () => {
                                            return {};
                                        }
                                    });
                                }
                            }), option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'rule',
                                rowStart: 0,
                                rowEnd: 0,
                                columnStart: 0,
                                columnEnd: 0,
                                message: 'Keys must either be undefined, null, or a plain object',
                                cause: '',
                                severity: 'error'
                            });
                        });
                    });

                    it('Never loads', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys(Rapture.logic({
                            require: 'willNotExist',
                            onRun: () => {
                                // Should not call because "keys" dones not exist
                                expect().TestingSupport.fail();
                            }
                        }), option);

                        TestingSupport.fail(testObject, rule, {
                            type: 'rule',
                            rowStart: 0,
                            rowEnd: 0,
                            columnStart: 0,
                            columnEnd: 0,
                            message: 'Required rule value "willNotExist" is not defined.',
                            cause: '',
                            severity: 'warning'
                        });
                    });

                    describe('Results in empty object :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return {}; }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return {}; }
                            }), option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });

                    describe('Results in object with single key("validKey") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKey")', () => {
                            const testObject = { validKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKey", "invalidKey")', () => {
                            const testObject = { validKey: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 2,
                                rowEnd: 2,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });
                });

                xit('Parameter - Neither', () => {});
            });

            describe('Rule called twice :', () => {
                describe('First param empty object :', () => {
                    describe('Second param empty object:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({}, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({}, option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });

                    describe('Second param with single key("validKeyB") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKeyB")', () => {
                            const testObject = { validKeyB: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyB", "invalidKey")', () => {
                            const testObject = { validKeyB: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 2,
                                rowEnd: 2,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });
                });

                describe('First param with single key("validKeyA") :', () => {
                    describe('Second param empty object:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKeyA")', () => {
                            const testObject = { validKeyA: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyA", "invalidKey")', () => {
                            const testObject = { validKeyA: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 2,
                                rowEnd: 2,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });

                    describe('Second param with single key("validKeyB") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 1,
                                rowEnd: 1,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });

                        it('Test data - Object with key("validKeyA")', () => {
                            const testObject = { validKeyA: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyB")', () => {
                            const testObject = { validKeyB: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyA, validKeyB")', () => {
                            const testObject = { validKeyA: 'foo', validKeyB: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyA", "validKeyB", "invalidKey")', () => {
                            const testObject = { validKeyA: 'foo', validKeyB: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'schema',
                                rowStart: 3,
                                rowEnd: 3,
                                columnStart: 2,
                                columnEnd: 14,
                                message: 'The property "invalidKey" is not allowed to exist.',
                                cause: 'invalidKey',
                                severity: 'error'
                            });
                        });
                    });
                });
            });
        });

        describe('Option allowAll is true :', () => {
            const option = {
                allowAll: true
            };

            describe('Rule called once :', () => {
                describe('Parameter - Empty :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys(undefined, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = {
                            validKey: 'foo'
                        };

                        const rule = Rapture.object().keys(undefined, option);

                        TestingSupport.pass(testObject, rule);
                    });
                });

                describe('Parameter - Empty object :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys({}, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().keys({}, option);

                        TestingSupport.pass(testObject, rule);
                    });
                });

                describe('Parameter - Object with single key("validKey") :', () => {
                    it('Test data - Empty object', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("invalidKey")', () => {
                        const testObject = { invalidKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with key("validKey")', () => {
                        const testObject = { validKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        TestingSupport.pass(testObject, rule);
                    });

                    it('Test data - Object with keys("validKey", "invalidKey")', () => {
                        const testObject = { validKey: 'foo', invalidKey: 'foo' };

                        const rule = Rapture.object().keys({
                            validKey: Rapture.any()
                        }, option);

                        TestingSupport.pass(testObject, rule);
                    });
                });

                describe('Parameter - Rapture logic :', () => {
                    describe('Does not result in a plain object :', () => {
                        it('Results in null', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return null; }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Results in Rapture logic', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return Rapture.logic({
                                        onRun: () => {
                                            return {};
                                        }
                                    });
                                }
                            }), option);

                            TestingSupport.fail(testObject, rule, {
                                type: 'rule',
                                rowStart: 0,
                                rowEnd: 0,
                                columnStart: 0,
                                columnEnd: 0,
                                message: 'Keys must either be undefined, null, or a plain object',
                                cause: '',
                                severity: 'error'
                            });
                        });
                    });

                    it('Never loads', () => {
                        const testObject = {};

                        const rule = Rapture.object().keys(Rapture.logic({
                            require: 'willNotExist',
                            onRun: () => {
                                // Should not call because "keys" dones not exist
                                expect().TestingSupport.fail();
                            }
                        }), option);

                        TestingSupport.fail(testObject, rule, {
                            type: 'rule',
                            rowStart: 0,
                            rowEnd: 0,
                            columnStart: 0,
                            columnEnd: 0,
                            message: 'Required rule value "willNotExist" is not defined.',
                            cause: '',
                            severity: 'warning'
                        });
                    });

                    describe('Results in empty object :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return {}; }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => { return {}; }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });
                    });

                    describe('Results in object with single key("validKey") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKey")', () => {
                            const testObject = { validKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKey", "invalidKey")', () => {
                            const testObject = { validKey: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys(Rapture.logic({
                                onRun: () => {
                                    return {
                                        validKey: Rapture.any()
                                    };
                                }
                            }), option);

                            TestingSupport.pass(testObject, rule);
                        });
                    });
                });
            });

            describe('Rule called twice :', () => {
                describe('First param empty object :', () => {
                    describe('Second param empty object:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({}, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });
                    });

                    describe('Second param with single key("validKeyB") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyB")', () => {
                            const testObject = { validKeyB: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyB", "invalidKey")', () => {
                            const testObject = { validKeyB: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({}, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });
                    });
                });

                describe('First param with single key("validKeyA") :', () => {
                    describe('Second param empty object:', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyA")', () => {
                            const testObject = { validKeyA: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyA", "invalidKey")', () => {
                            const testObject = { validKeyA: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({}, option);

                            TestingSupport.pass(testObject, rule);
                        });
                    });

                    describe('Second param with single key("validKeyB") :', () => {
                        it('Test data - Empty object', () => {
                            const testObject = {};

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("invalidKey")', () => {
                            const testObject = { invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyA")', () => {
                            const testObject = { validKeyA: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyB")', () => {
                            const testObject = { validKeyB: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with key("validKeyA, validKeyB")', () => {
                            const testObject = { validKeyA: 'foo', validKeyB: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });

                        it('Test data - Object with keys("validKeyA", "validKeyB", "invalidKey")', () => {
                            const testObject = { validKeyA: 'foo', validKeyB: 'foo', invalidKey: 'foo' };

                            const rule = Rapture.object().keys({
                                validKeyA: Rapture.any()
                            }, option).keys({
                                validKeyB: Rapture.any()
                            }, option);

                            TestingSupport.pass(testObject, rule);
                        });
                    });
                });
            });
        });
    });
};

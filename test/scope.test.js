/* eslint-disable import/no-extraneous-dependencies */
const _ = require('lodash');
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Scope = require('../src/scope.js');

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('Scope Tests :', () => {
    describe('Construction Tests :', () => {
        it('Zero parameters', () => {
            const scope = Scope();

            expect(scope.id).to.equal(null);
            expect(scope.parentScope).to.equal(null);
        });

        describe('One parameter :', () => {
            it('undefined', () => {
                const scope = Scope(undefined);

                expect(scope.id).to.equal(null);
                expect(scope.parentScope).to.equal(null);
            });

            it('null', () => {
                const scope = Scope(null);

                expect(scope.id).to.equal(null);
                expect(scope.parentScope).to.equal(null);
            });

            it('empty string', () => {
                const scope = Scope('');

                expect(scope.id).to.equal('');
                expect(scope.parentScope).to.equal(null);
            });

            it('"foo" string', () => {
                const scope = Scope('foo');

                expect(scope.id).to.equal('foo');
                expect(scope.parentScope).to.equal(null);
            });

            it('number', () => {
                try {
                    Scope(42);

                    expect.fail();
                } catch (err) {
                    expect(err.message).to.equal('When defined id must be a string');
                }
            });
        });

        describe('Two parameters :', () => {
            it('undefined', () => {
                const scopeChild = Scope('child', undefined);

                expect(scopeChild.id).to.equal('child');
                expect(scopeChild.parentScope).to.equal(null);
            });

            it('null', () => {
                const scopeChild = Scope('child', null);

                expect(scopeChild.id).to.equal('child');
                expect(scopeChild.parentScope).to.equal(null);
            });

            it('scope', () => {
                const scopeParent = Scope('parent', undefined);
                const scopeChild = Scope('child', scopeParent);

                expect(scopeChild.id).to.equal('child');
                expect(scopeChild.parentScope).to.equal(scopeParent);
            });

            it('number', () => {
                try {
                    Scope('child', 42);

                    expect.fail();
                } catch (err) {
                    expect(err.message).to.equal('When defined parentScope must be an instance of Scope');
                }
            });
        });
    });

    describe('set :', () => {
        beforeEach(function beforeEach() {
            this.scopeA = Scope('A');
        });

        afterEach(function afterEach() {
            this.scopeA.dispose();
        });

        describe('paramteres :', () => {
            describe('id :', () => {
                it('undefined', function test() {
                    this.scopeA.set(undefined, 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('null', function test() {
                    this.scopeA.set(null, 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('string exists', function test() {
                    this.scopeA.set('A', 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('string does not exist', function test() {
                    try {
                        this.scopeA.set('B', 'key', 42, true, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Scope "B" does not exist');
                    }
                });

                it('number', function test() {
                    try {
                        this.scopeA.set(42, 'key', 42, true, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('When defined the id must be a string');
                    }
                });
            });

            describe('key :', () => {
                it('undefined', function test() {
                    try {
                        this.scopeA.set('A', undefined, 42, true, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Key must be a string');
                    }
                });

                it('null', function test() {
                    try {
                        this.scopeA.set('A', null, 42, true, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Key must be a string');
                    }
                });

                it('number', function test() {
                    try {
                        this.scopeA.set('A', 42, 42, true, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Key must be a string');
                    }
                });
            });

            describe('value :', () => {
                it('undefined', function test() {
                    this.scopeA.set('A', 'key', undefined, true, this);

                    expect(this.scopeA.data.key.value).to.equal(undefined);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('null', function test() {
                    this.scopeA.set('A', 'key', null, true, this);

                    expect(this.scopeA.data.key.value).to.equal(null);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('string', function test() {
                    this.scopeA.set('A', 'key', 'foo', true, this);

                    expect(this.scopeA.data.key.value).to.equal('foo');
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('number', function test() {
                    this.scopeA.set('A', 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('boolean', function test() {
                    this.scopeA.set('A', 'key', false, true, this);

                    expect(this.scopeA.data.key.value).to.equal(false);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('object', function test() {
                    const testData = {};
                    this.scopeA.set('A', 'key', testData, true, this);

                    expect(this.scopeA.data.key.value).to.equal(testData);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('array', function test() {
                    const testData = [];
                    this.scopeA.set('A', 'key', testData, true, this);

                    expect(this.scopeA.data.key.value).to.equal(testData);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });
            });

            describe('ready :', () => {
                it('undefined', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, undefined, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Status must be a boolean value');
                    }
                });

                it('null', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, null, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Status must be a boolean value');
                    }
                });

                it('true', function test() {
                    this.scopeA.set('A', 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('false', function test() {
                    this.scopeA.set('A', 'key', 42, false, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('failed');
                    expect(this.scopeA.data.key.owner).to.equal(this);
                });

                it('number', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, 42, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Status must be a boolean value');
                    }
                });
            });

            describe('owner :', () => {
                it('undefined', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, undefined);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Owner cannot be nil');
                    }
                });

                it('null', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, null);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Owner cannot be nil');
                    }
                });

                it('string', function test() {
                    this.scopeA.set('A', 'key', 42, true, 'foo');

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal('foo');
                });

                it('number', function test() {
                    this.scopeA.set('A', 'key', 42, true, 42);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(42);
                });

                it('object', function test() {
                    const testData = {};
                    this.scopeA.set('A', 'key', 42, true, testData);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(testData);
                });

                it('array', function test() {
                    const testData = [];
                    this.scopeA.set('A', 'key', 42, true, testData);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(testData);
                });
            });
        });

        describe('misc :', () => {
            it('already exists buy another owner', function test() {
                this.scopeA.set('A', 'key', 42, true, 'foo');

                expect(this.scopeA.data.key.value).to.equal(42);
                expect(this.scopeA.data.key.status).to.equal('ready');
                expect(this.scopeA.data.key.owner).to.equal('foo');

                try {
                    this.scopeA.set('A', 'key', 42, true, 'bar');

                    expect.fail();
                } catch (err) {
                    expect(err.message).to.equal('Cannot set duplicate value for "key"');
                }
            });
        });
    });

    describe('get :', () => {
        beforeEach(function beforeEach() {
            this.scopeA = Scope('A');
        });

        afterEach(function afterEach() {
            this.scopeA.dispose();
        });

        it('key undefined', function test() {
            try {
                this.scopeA.get(undefined);

                expect.fail();
            } catch (err) {
                expect(err.message).to.equal('Key must be a string');
            }
        });

        it('key null', function test() {
            try {
                this.scopeA.get(null);

                expect.fail();
            } catch (err) {
                expect(err.message).to.equal('Key must be a string');
            }
        });

        it('key string exists', function test() {
            this.scopeA.set('A', 'key', 42, true, this);

            const observed = this.scopeA.get('key');

            expect(observed.value).to.equal(42);
            expect(observed.status).to.equal('ready');
            expect(observed.owner).to.equal(this);
        });

        it('key string does not exist', function test() {
            const observed = this.scopeA.get('key');

            expect(observed).to.equal(undefined);
        });

        it('key number', function test() {
            try {
                this.scopeA.get(42);

                expect.fail();
            } catch (err) {
                expect(err.message).to.equal('Key must be a string');
            }
        });
    });

    describe('remove :', () => {
        beforeEach(function beforeEach() {
            this.scopeA = Scope('A');
        });

        afterEach(function afterEach() {
            this.scopeA.dispose();
        });

        describe('parameters :', () => {
            describe('id :', () => {
                it('undefined', function test() {
                    this.scopeA.set('A', 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);

                    this.scopeA.remove(undefined, 'key', this);

                    expect(this.scopeA.data.key).to.equal(undefined);
                });

                it('null', function test() {
                    this.scopeA.set('A', 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);

                    this.scopeA.remove(null, 'key', this);

                    expect(this.scopeA.data.key).to.equal(undefined);
                });

                it('string exists', function test() {
                    this.scopeA.set('A', 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);

                    this.scopeA.remove('A', 'key', this);

                    expect(this.scopeA.data.key).to.equal(undefined);
                });

                it('string does not exist', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, this);

                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);

                        this.scopeA.remove('B', 'key', this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Scope "B" does not exist');
                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);
                    }
                });

                it('number', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, this);

                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);

                        this.scopeA.remove(42, 'key', this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('When defined the id must be a string');
                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);
                    }
                });
            });

            describe('key :', () => {
                it('undefined', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, this);

                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);

                        this.scopeA.remove('A', undefined, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Key must be a string');
                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);
                    }
                });

                it('null', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, this);
                        this.scopeA.remove('A', null, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Key must be a string');
                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);
                    }
                });

                it('number', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, this);

                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);

                        this.scopeA.remove('A', 42, this);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Key must be a string');
                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);
                    }
                });

                it('string does not exist', function test() {
                    expect(this.scopeA.data.key).to.equal(undefined);

                    this.scopeA.remove('A', 'key', this);

                    expect(this.scopeA.data.key).to.equal(undefined);
                });
            });

            describe('owner :', () => {
                it('undefined', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, this);

                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);

                        this.scopeA.remove('A', 'key', undefined);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Owner cannot be nil');
                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);
                    }
                });

                it('null', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, this);

                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);

                        this.scopeA.remove('A', 'key', null);

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Owner cannot be nil');
                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);
                    }
                });

                it('correct owner', function test() {
                    this.scopeA.set('A', 'key', 42, true, this);

                    expect(this.scopeA.data.key.value).to.equal(42);
                    expect(this.scopeA.data.key.status).to.equal('ready');
                    expect(this.scopeA.data.key.owner).to.equal(this);

                    this.scopeA.remove('A', 'key', this);

                    expect(this.scopeA.data.key).to.equal(undefined);
                });

                it('incorrect owner', function test() {
                    try {
                        this.scopeA.set('A', 'key', 42, true, this);

                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);

                        this.scopeA.remove('A', 'key', 'foo');

                        expect.fail();
                    } catch (err) {
                        expect(err.message).to.equal('Only owner can remove key');
                        expect(this.scopeA.data.key.value).to.equal(42);
                        expect(this.scopeA.data.key.status).to.equal('ready');
                        expect(this.scopeA.data.key.owner).to.equal(this);
                    }
                });
            });
        });
    });

    describe('watch :', () => {
        beforeEach(function beforeEach() {
            this.scopeA = Scope('A');
        });

        afterEach(function afterEach() {
            this.scopeA.dispose();
        });

        describe('value does not exist :', () => {
            describe('parameters :', () => {
                describe('key :', () => {
                    it('undefined', function test() {
                        try {
                            this.scopeA.watch(undefined, () => {
                                expect.fail();
                            });

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Key must be a string');
                        }
                    });

                    it('null', function test() {
                        try {
                            this.scopeA.watch(null, () => {
                                expect.fail();
                            });

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Key must be a string');
                        }
                    });

                    it('number', function test() {
                        try {
                            this.scopeA.watch(42, () => {
                                expect.fail();
                            });

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Key must be a string');
                        }
                    });

                    it('string', function test() {
                        let called = false;

                        this.scopeA.watch('key', (status, value) => {
                            called = true;

                            expect(status).to.equal('undefined');
                            expect(value).to.equal(undefined);
                        });

                        expect(called).to.equal(true);
                    });
                });

                describe('callback :', () => {
                    it('undefined', function test() {
                        try {
                            this.scopeA.watch('key', undefined);

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Callback must be a function');
                        }
                    });

                    it('null', function test() {
                        try {
                            this.scopeA.watch('key', null);

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Callback must be a function');
                        }
                    });

                    it('number', function test() {
                        try {
                            this.scopeA.watch('key', 42);

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Callback must be a function');
                        }
                    });
                });
            });

            it('value gets created pass', function test() {
                const expectedValue = [undefined, 42];
                let counter = 0;

                this.scopeA.watch('key', (status, value) => {
                    const target = expectedValue[counter];

                    if (_.isNil(target)) {
                        expect(status).to.equal('undefined');
                        expect(value).to.equal(undefined);
                    } else {
                        expect(status).to.equal('ready');
                        expect(value).to.equal(target);
                    }

                    counter += 1;
                });

                this.scopeA.set('A', 'key', 42, true, this);

                expect(counter).to.equal(2);
            });

            it('value gets created fail', function test() {
                const expectedValue = [undefined, 42];
                let counter = 0;

                this.scopeA.watch('key', (status, value) => {
                    const target = expectedValue[counter];

                    if (_.isNil(target)) {
                        expect(status).to.equal('undefined');
                        expect(value).to.equal(undefined);
                    } else {
                        expect(status).to.equal('failed');
                        expect(value).to.equal(target);
                    }

                    counter += 1;
                });

                this.scopeA.set('A', 'key', 42, false, this);

                expect(counter).to.equal(2);
            });
        });

        describe('value does exist :', () => {
            beforeEach(function beforeEachSetValue() {
                this.scopeA.set('A', 'key', 42, true, this);
            });

            describe('parameters :', () => {
                describe('key :', () => {
                    it('undefined', function test() {
                        try {
                            this.scopeA.watch(undefined, () => {
                                expect.fail();
                            });

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Key must be a string');
                        }
                    });

                    it('null', function test() {
                        try {
                            this.scopeA.watch(null, () => {
                                expect.fail();
                            });

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Key must be a string');
                        }
                    });

                    it('number', function test() {
                        try {
                            this.scopeA.watch(42, () => {
                                expect.fail();
                            });

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Key must be a string');
                        }
                    });

                    it('string', function test() {
                        let called = false;

                        const listner = this.scopeA.watch('key', (status, value) => {
                            called = true;

                            expect(status).to.equal('ready');
                            expect(value).to.equal(42);
                        });

                        expect(called).to.equal(true);

                        listner();
                    });
                });

                describe('callback :', () => {
                    it('undefined', function test() {
                        try {
                            this.scopeA.watch('key', undefined);

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Callback must be a function');
                        }
                    });

                    it('null', function test() {
                        try {
                            this.scopeA.watch('key', null);

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Callback must be a function');
                        }
                    });

                    it('number', function test() {
                        try {
                            this.scopeA.watch('key', 42);

                            expect.fail();
                        } catch (err) {
                            expect(err.message).to.equal('Callback must be a function');
                        }
                    });
                });
            });

            it('value is set to same value but is failing', function test() {
                const expectedValue = [{ status: 'ready', value: 42 }, { status: 'failed', value: 42 }];
                let counter = 0;

                this.scopeA.watch('key', (status, value) => {
                    const target = expectedValue[counter];

                    if (_.isNil(target)) {
                        expect(status).to.equal('undefined');
                        expect(value).to.equal(undefined);
                    } else {
                        expect(status).to.equal(target.status);
                        expect(value).to.equal(target.value);
                    }

                    counter += 1;
                });

                this.scopeA.set('A', 'key', 42, false, this);

                expect(counter).to.equal(2);
            });

            it('value is set to same value but is passing', function test() {
                const expectedValue = [42];
                let counter = 0;

                this.scopeA.watch('key', (status, value) => {
                    const target = expectedValue[counter];

                    if (_.isNil(target)) {
                        expect(status).to.equal('undefined');
                        expect(value).to.equal(undefined);
                    } else {
                        expect(status).to.equal('ready');
                        expect(value).to.equal(target);
                    }

                    counter += 1;
                });

                this.scopeA.set('A', 'key', 42, true, this);

                expect(counter).to.equal(expectedValue.length);
            });

            it('value is set to different value but is failing', function test() {
                const expectedValue = [{ status: 'ready', value: 42 }, { status: 'failed', value: 43 }];
                let counter = 0;

                this.scopeA.watch('key', (status, value) => {
                    const target = expectedValue[counter];

                    if (_.isNil(target)) {
                        expect(status).to.equal('undefined');
                        expect(value).to.equal(undefined);
                    } else {
                        expect(status).to.equal(target.status);
                        expect(value).to.equal(target.value);
                    }

                    counter += 1;
                });

                this.scopeA.set('A', 'key', 43, false, this);

                expect(counter).to.equal(expectedValue.length);
            });

            it('value is set to differnt value but is passing', function test() {
                const expectedValue = [{ status: 'ready', value: 42 }, { status: 'ready', value: 43 }];
                let counter = 0;

                this.scopeA.watch('key', (status, value) => {
                    const target = expectedValue[counter];

                    if (_.isNil(target)) {
                        expect(status).to.equal('undefined');
                        expect(value).to.equal(undefined);
                    } else {
                        expect(status).to.equal(target.status);
                        expect(value).to.equal(target.value);
                    }

                    counter += 1;
                });

                this.scopeA.set('A', 'key', 43, true, this);

                expect(counter).to.equal(expectedValue.length);
            });

            it('does not get called when disposed', function test() {
                const expectedValue = [{ status: 'ready', value: 42 }];
                let counter = 0;

                const listener = this.scopeA.watch('key', (status, value) => {
                    const target = expectedValue[counter];

                    if (_.isNil(target)) {
                        expect(status).to.equal('undefined');
                        expect(value).to.equal(undefined);
                    } else {
                        expect(status).to.equal(target.status);
                        expect(value).to.equal(target.value);
                    }

                    counter += 1;
                });

                expect(listener).to.be.instanceOf(Function);

                listener();

                this.scopeA.set('A', 'key', 43, true, this);

                expect(counter).to.equal(expectedValue.length);
            });
        });
    });

    describe('parented :', () => {
        beforeEach(function beforeEach() {
            this.scope1 = Scope('1');
            this.scope2 = Scope('2', this.scope1);
            this.scope3 = Scope('3', this.scope2);
        });

        function setupWatch(scope, watchId, targetValues) {
            let counter = 0;

            const listener = scope.watch(watchId, (status, value) => {
                expect(counter, `Should not have been called for scope ${scope.id}`).to.below(targetValues.length);

                const expected = targetValues[counter];

                if (expected === undefined) {
                    expect(value).to.not.exist();
                    expect(status).to.equal('undefined');
                } else {
                    expect(value).to.equal(expected.value);
                    expect(status).to.equal(expected.status);
                }

                counter += 1;
            });

            return () => {
                expect(counter).to.equal(targetValues.length);

                listener();
            };
        }

        function checkGotted(scope, target, expected) {
            const gotted = scope.get(target);

            if (_.isNil(expected)) {
                expect(gotted).to.not.exist();
            } else {
                expect(gotted.value).to.equal(expected);
                expect(gotted.status).to.equal('ready');
            }
        }

        describe('directly', () => {
            it('set foo at 3', function test() {
                setupWatch(this.scope1, 'foo', [undefined]);
                setupWatch(this.scope2, 'foo', [undefined]);
                setupWatch(this.scope3, 'foo', [undefined, { status: 'ready', value: 42 }]);

                this.scope3.set(null, 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo');
                checkGotted(this.scope1, 'foo');
            });

            it('set foo at 2', function test() {
                setupWatch(this.scope1, 'foo', [undefined]);
                setupWatch(this.scope2, 'foo', [undefined, { status: 'ready', value: 42 }]);
                setupWatch(this.scope3, 'foo', [undefined, { status: 'ready', value: 42 }]);

                this.scope2.set(null, 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo');
            });

            it('set foo at 1', function test() {
                setupWatch(this.scope1, 'foo', [undefined, { status: 'ready', value: 42 }]);
                setupWatch(this.scope2, 'foo', [undefined, { status: 'ready', value: 42 }]);
                setupWatch(this.scope3, 'foo', [undefined, { status: 'ready', value: 42 }]);

                this.scope1.set(null, 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo', 42);
            });
        });

        describe('in-directly :', () => {
            it('set foo at 3', function test() {
                setupWatch(this.scope1, 'foo', [undefined]);
                setupWatch(this.scope2, 'foo', [undefined]);
                setupWatch(this.scope3, 'foo', [undefined, { status: 'ready', value: 42 }]);

                this.scope3.set('3', 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo');
                checkGotted(this.scope1, 'foo');
            });

            it('set foo at 2', function test() {
                setupWatch(this.scope1, 'foo', [undefined]);
                setupWatch(this.scope2, 'foo', [undefined, { status: 'ready', value: 42 }]);
                setupWatch(this.scope3, 'foo', [undefined, { status: 'ready', value: 42 }]);

                this.scope2.set('2', 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo');
            });

            it('set foo at 1', function test() {
                setupWatch(this.scope1, 'foo', [undefined, { status: 'ready', value: 42 }]);
                setupWatch(this.scope2, 'foo', [undefined, { status: 'ready', value: 42 }]);
                setupWatch(this.scope3, 'foo', [undefined, { status: 'ready', value: 42 }]);

                this.scope1.set('1', 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo', 42);
            });
        });

        describe('override :', () => {
            it('set foo at 3', function test() {
                const validateCount1 = setupWatch(this.scope1, 'foo', [undefined, { status: 'ready', value: 41 }]);
                const validateCount2 = setupWatch(this.scope2, 'foo', [undefined, { status: 'ready', value: 41 }, { status: 'ready', value: 42 }]);
                const validateCount3 = setupWatch(this.scope3, 'foo', [undefined, { status: 'ready', value: 41 }, { status: 'ready', value: 42 }, { status: 'ready', value: 43 }]);

                this.scope1.set(null, 'foo', 41, true, this);

                checkGotted(this.scope3, 'foo', 41);
                checkGotted(this.scope2, 'foo', 41);
                checkGotted(this.scope1, 'foo', 41);

                this.scope2.set(null, 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo', 41);

                this.scope3.set(null, 'foo', 43, true, this);

                checkGotted(this.scope3, 'foo', 43);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo', 41);

                validateCount1();
                validateCount2();
                validateCount3();
            });
        });

        describe('remove :', () => {
            beforeEach(function beforeEach() {
                this.scope1.set(null, 'foo', 42, true, this);
                this.scope2.set(null, 'foo', 43, true, this);
                this.scope3.set(null, 'foo', 44, true, this);
            });

            it('remove foo at 3', function test() {
                const validateCount1 = setupWatch(this.scope1, 'foo', [{ status: 'ready', value: 42 }]);
                const validateCount2 = setupWatch(this.scope2, 'foo', [{ status: 'ready', value: 43 }]);
                const validateCount3 = setupWatch(this.scope3, 'foo', [{ status: 'ready', value: 44 }, { status: 'ready', value: 43 }]);

                this.scope3.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo', 42);
                checkGotted(this.scope2, 'foo', 43);
                checkGotted(this.scope3, 'foo', 43);

                validateCount1();
                validateCount2();
                validateCount3();
            });

            it('remove foo at 3 then 2', function test() {
                const validateCount1 = setupWatch(this.scope1, 'foo', [{ status: 'ready', value: 42 }]);
                const validateCount2 = setupWatch(this.scope2, 'foo', [{ status: 'ready', value: 43 }, { status: 'ready', value: 42 }]);
                const validateCount3 = setupWatch(this.scope3, 'foo', [{ status: 'ready', value: 44 }, { status: 'ready', value: 43 }, { status: 'ready', value: 42 }]);

                this.scope3.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo', 42);
                checkGotted(this.scope2, 'foo', 43);
                checkGotted(this.scope3, 'foo', 43);

                this.scope2.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope3, 'foo', 42);

                validateCount1();
                validateCount2();
                validateCount3();
            });

            it('remove foo at 3 then 2 then 1', function test() {
                const validateCount1 = setupWatch(this.scope1, 'foo', [{ status: 'ready', value: 42 }, undefined]);
                const validateCount2 = setupWatch(this.scope2, 'foo', [{ status: 'ready', value: 43 }, { status: 'ready', value: 42 }, undefined]);
                const validateCount3 = setupWatch(this.scope3, 'foo', [{ status: 'ready', value: 44 }, { status: 'ready', value: 43 }, { status: 'ready', value: 42 }, undefined]);

                this.scope3.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo', 42);
                checkGotted(this.scope2, 'foo', 43);
                checkGotted(this.scope3, 'foo', 43);

                this.scope2.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope3, 'foo', 42);

                this.scope3.remove('1', 'foo', this);

                checkGotted(this.scope1, 'foo');
                checkGotted(this.scope2, 'foo');
                checkGotted(this.scope3, 'foo');

                validateCount1();
                validateCount2();
                validateCount3();
            });

            it('remove foo at 1 then 2 then 3', function test() {
                const validateCount1 = setupWatch(this.scope1, 'foo', [{ status: 'ready', value: 42 }, undefined]);
                const validateCount2 = setupWatch(this.scope2, 'foo', [{ status: 'ready', value: 43 }, undefined]);
                const validateCount3 = setupWatch(this.scope3, 'foo', [{ status: 'ready', value: 44 }, undefined]);

                this.scope1.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo');
                checkGotted(this.scope2, 'foo', 43);
                checkGotted(this.scope3, 'foo', 44);

                this.scope2.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo');
                checkGotted(this.scope2, 'foo');
                checkGotted(this.scope3, 'foo', 44);

                this.scope3.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo');
                checkGotted(this.scope2, 'foo');
                checkGotted(this.scope3, 'foo');

                validateCount1();
                validateCount2();
                validateCount3();
            });

            it('try to remove foo when not yours', function test() {
                this.scope2.set(null, 'bar', 40, true, this);

                try {
                    this.scope3.remove(null, 'bar', this);

                    expect.fail();
                } catch (err) {
                    expect(err.message).to.equal('Attempting to remove a value from the wrong scope');
                }
            });

            it('all the same except 3, then remove 2', function test() {
                debugger;
                this.scope1.set(null, 'foo', 42, true, this);
                this.scope2.set(null, 'foo', 42, true, this);
                this.scope3.remove(null, 'foo', this);

                const validateCount1 = setupWatch(this.scope1, 'foo', [{ status: 'ready', value: 42 }]);
                const validateCount2 = setupWatch(this.scope2, 'foo', [{ status: 'ready', value: 42 }]);
                const validateCount3 = setupWatch(this.scope3, 'foo', [{ status: 'ready', value: 42 }]);

                this.scope2.remove(null, 'foo', this);

                checkGotted(this.scope1, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope3, 'foo', 42);

                validateCount1();
                validateCount2();
                validateCount3();
            });
        });

        describe('dispose :', () => {
            function setupDispose(scope) {
                let counter = 0;

                scope.on('disposed', () => {
                    counter += 1;
                });

                return (expected) => {
                    expect(counter).to.equal(expected);
                };
            }

            it('Dispose From 3', function test() {
                const validateDisposeCall1 = setupDispose(this.scope1);
                const validateDisposeCall2 = setupDispose(this.scope2);
                const validateDisposeCall3 = setupDispose(this.scope2);

                this.scope1.set(null, 'foo', 42, true, '1');
                this.scope2.set(null, 'foo', 43, true, '2');
                this.scope3.set(null, 'foo', 44, true, '3');

                const validateCount1 = setupWatch(this.scope1, 'foo', [{ status: 'ready', value: 42 }, undefined]);
                const validateCount2 = setupWatch(this.scope2, 'foo', [{ status: 'ready', value: 43 }, undefined]);
                const validateCount3 = setupWatch(this.scope3, 'foo', [{ status: 'ready', value: 44 }, undefined]);

                this.scope3.dispose();

                checkGotted(this.scope1, 'foo', 42);
                checkGotted(this.scope2, 'foo', 43);
                // checkGotted(this.scope3, 'foo');

                this.scope2.dispose();

                checkGotted(this.scope1, 'foo', 42);
                // checkGotted(this.scope2, 'foo');
                // checkGotted(this.scope3, 'foo');

                this.scope1.dispose();

                // checkGotted(this.scope1, 'foo');
                // checkGotted(this.scope2, 'foo');
                // checkGotted(this.scope3, 'foo');

                validateDisposeCall1(1);
                validateDisposeCall2(1);
                validateDisposeCall3(1);

                validateCount1();
                validateCount2();
                validateCount3();
            });

            it('Dispose from 1', function test() {
                const validateDisposeCall1 = setupDispose(this.scope1);
                const validateDisposeCall2 = setupDispose(this.scope2);
                const validateDisposeCall3 = setupDispose(this.scope2);

                this.scope1.set(null, 'foo', 42, true, this);
                this.scope2.set(null, 'foo', 43, true, this);
                this.scope3.set(null, 'foo', 44, true, this);

                const validateCount1 = setupWatch(this.scope1, 'foo', [{ status: 'ready', value: 42 }, undefined]);
                const validateCount2 = setupWatch(this.scope2, 'foo', [{ status: 'ready', value: 43 }, undefined]);
                const validateCount3 = setupWatch(this.scope3, 'foo', [{ status: 'ready', value: 44 }, undefined]);

                this.scope1.dispose();

                // checkGotted(this.scope1, 'foo');
                checkGotted(this.scope2, 'foo', 43);
                checkGotted(this.scope3, 'foo', 44);

                this.scope2.dispose();

                // checkGotted(this.scope1, 'foo');
                // checkGotted(this.scope2, 'foo');
                checkGotted(this.scope3, 'foo', 44);

                this.scope3.dispose();

                // checkGotted(this.scope1, 'foo');
                // checkGotted(this.scope2, 'foo');
                // checkGotted(this.scope3, 'foo');

                validateDisposeCall1(1);
                validateDisposeCall2(1);
                validateDisposeCall3(1);

                validateCount1();
                validateCount2();
                validateCount3();
            });
        });
    });
});

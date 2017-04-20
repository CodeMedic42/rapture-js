/* eslint-disable import/no-extraneous-dependencies */
const _ = require('lodash');
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Scope = require('../src/scope.js');
const Observable = require('../src/observable.js');

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('Scope Tests', () => {
    describe('Construction Tests', () => {
        it('set this', () => {
            const scope = Scope();

            expect(scope.id).to.not.exist();
        });
    });

    it('set foo', () => {
        const scope = Scope();

        let first = true;

        scope.watch('foo', (status, value) => {
            if (first) {
                expect(value).to.not.exist();
                expect(status).to.equal('undefined');
            } else {
                expect(value).to.equal(42);
                expect(status).to.equal('ready');
            }

            first = false;
        });

        scope.set(null, 'foo', 42, true, this);

        const gotted = scope.get('foo');

        expect(gotted.value).to.equal(42);
        expect(gotted.status).to.equal('ready');
    });

    describe('parented', () => {
        beforeEach(function beforeEach() {
            this.scope1 = Scope('1');
            this.scope2 = Scope('2', this.scope1);
            this.scope3 = Scope('3', this.scope2);
        });

        function setupWatch(scope, watchId, targetValue) {
            let first = true;

            scope.watch(watchId, (status, value) => {
                if (first) {
                    expect(value).to.not.exist();
                    expect(status).to.equal('undefined');

                    first = false;
                } else if (!_.isNil(targetValue)) {
                    expect(value).to.equal(targetValue);
                    expect(status).to.equal('ready');
                } else {
                    expect.fail(`Should not have been called for scope ${scope.id}`);
                }
            });
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
                setupWatch(this.scope1, 'foo');
                setupWatch(this.scope2, 'foo');
                setupWatch(this.scope3, 'foo', 42);

                this.scope3.set(null, 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo');
                checkGotted(this.scope1, 'foo');
            });

            it('set foo at 2', function test() {
                setupWatch(this.scope1, 'foo');
                setupWatch(this.scope2, 'foo', 42);
                setupWatch(this.scope3, 'foo', 42);

                this.scope2.set(null, 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo');
            });

            it('set foo at 1', function test() {
                setupWatch(this.scope1, 'foo', 42);
                setupWatch(this.scope2, 'foo', 42);
                setupWatch(this.scope3, 'foo', 42);

                this.scope1.set(null, 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo', 42);
            });
        });

        describe('in-directly', () => {
            it('set foo at 3', function test() {
                setupWatch(this.scope1, 'foo');
                setupWatch(this.scope2, 'foo');
                setupWatch(this.scope3, 'foo', 42);

                this.scope3.set('3', 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo');
                checkGotted(this.scope1, 'foo');
            });

            it('set foo at 2', function test() {
                setupWatch(this.scope1, 'foo');
                setupWatch(this.scope2, 'foo', 42);
                setupWatch(this.scope3, 'foo', 42);

                this.scope2.set('2', 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo');
            });

            it('set foo at 1', function test() {
                setupWatch(this.scope1, 'foo', 42);
                setupWatch(this.scope2, 'foo', 42);
                setupWatch(this.scope3, 'foo', 42);

                this.scope1.set('1', 'foo', 42, true, this);

                checkGotted(this.scope3, 'foo', 42);
                checkGotted(this.scope2, 'foo', 42);
                checkGotted(this.scope1, 'foo', 42);
            });
        });
    });

    describe('observable', () => {
        beforeEach(function beforeEach() {
            this.scope1 = Scope('1');
            this.scope2 = Scope('2', this.scope1);
            this.scope3 = Scope('3', this.scope2);
        });

        xit('array', function test() {
            const targetValue = [];

            const observable = this.scope3.set(null, 'foo', targetValue, true, this);

            expect(observable).to.be.instanceof(Array);
            expect(observable).to.be.instanceof(Observable);
            expect(observable.length).to.be.instanceof(0);

            this.scope3.watch('foo', (status, value) => {
                expect(value).to.be.equal(observable);
                expect(status).to.equal('ready');
            });

            const observableGotted = this.scope3.get(null, 'foo');
            expect(observableGotted).to.be.equal(observable);
        });
    });
});

/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const Observable = require('../src/observable.js');

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('Observable Tests', () => {
    describe('Set Tests', () => {
        it('set this', (done) => {
            const ob = Observable({
                foo: 'test'
            });

            expect(ob.value.foo.value).to.equal('test');

            ob.on('change', () => {
                done();
            });

            ob.set({
                bar: 42
            });

            expect(ob.value.bar.value).to.equal(42);
            expect(ob.value.foo.value).to.not.exist();
        });

        it('set foo', (done) => {
            const ob = Observable({
                foo: 'test'
            });

            expect(ob.value.foo.value).to.equal('test');

            ob.on('change', () => {
                done();
            });

            ob.set('foo', 'new');

            expect(ob.value.foo.value).to.equal('new');
        });

        it('set complext foo', (done) => {
            const ob = Observable({
                rules: {},
                keys: {}
            });

            ob.on('change', () => {
                done();
            });

            ob.set('rules.foo', true);

            expect(ob.value.rules.value.foo.value).to.be.true();
        });
    });
});

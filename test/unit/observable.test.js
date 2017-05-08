/* eslint-disable import/no-extraneous-dependencies */

const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const _ = require('lodash');
const Sinon = require('sinon');
const Observable = require('../../src/observable/index.js');

Chai.use(DirtyChai);

const expect = Chai.expect;

const basicObject = {
    str: 'foo',
    num: 42,
    bool: true,
    date: new Date()
};

basicObject.obj = _.cloneDeep(basicObject);

const basicArray = [
    _.cloneDeep(basicObject),
    _.cloneDeep(basicObject)
];

basicObject.arr = _.cloneDeep(basicArray);

function createOnChangeSpy(targetOb) {
    targetOb.on();

    const spy = Sinon.spy();

    targetOb.on('change', spy);

    return spy;
}

describe('Observable Tests :', () => {
    describe('Construction :', () => {
        it('initialize with no data', () => {
            const ob = Observable();

            expect(ob.value()).to.equal(undefined);
        });

        it('initialize with null', () => {
            const ob = Observable(null);

            expect(ob.value()).to.equal(null);
        });

        it('initialize with number', () => {
            const ob = Observable(42);

            expect(ob.value()).to.equal(42);
        });

        it('initialize with string', () => {
            const ob = Observable('foo');

            expect(ob.value()).to.equal('foo');
        });

        it('initialize with object', () => {
            const ob = Observable(basicObject);

            expect(ob.value()).to.deep.equal(basicObject);
        });

        it('initialize with array', () => {
            const ob = Observable(basicArray);

            expect(ob.value()).to.deep.equal(basicArray);
        });

        it('initialize with Observable number', () => {
            const testData = 42;

            const initWith = Observable(testData);

            const ob = Observable(initWith);

            expect(ob.value()).to.equal(42);
        });

        it('initialize with Observable object', () => {
            const initWith = Observable(basicObject);

            const ob = Observable(initWith);

            expect(ob.value()).to.deep.equal(basicObject);
        });
    });

    describe('Set :', () => {
        it('No id provided', () => {
            const ob = Observable(basicObject);

            ob.set(42);

            expect(ob.value()).to.equal(42);
        });

        it('Set id null', () => {
            const ob = Observable(basicObject);

            ob.set(null, 42);

            expect(ob.value()).to.equal(42);
        });

        it('Set id ""', () => {
            const ob = Observable(basicObject);

            ob.set('', 42);

            expect(ob.value()).to.equal(42);
        });

        it('Set id "str"', () => {
            const ob = Observable(basicObject);

            ob.set('str', 'bar');

            const clone = _.cloneDeep(basicObject);

            clone.str = 'bar';

            expect(ob.value()).to.deep.equal(clone);
        });

        it('Set id "dne"', () => {
            const ob = Observable(basicObject);

            ob.set('dne', 'bar');

            const clone = _.cloneDeep(basicObject);

            clone.dne = 'bar';

            expect(ob.value()).to.deep.equal(clone);
        });

        it('Set id "arr.1.num"', () => {
            const ob = Observable(basicObject);

            ob.set('arr.1.num', 43);

            const clone = _.cloneDeep(basicObject);

            clone.arr[1].num = 43;

            expect(ob.value()).to.deep.equal(clone);
        });

        it('Set id "arr.1.num" as observable', () => {
            const ob = Observable(basicObject);

            const obNum = Observable(43);

            ob.set('arr.1.num', obNum);

            const clone = _.cloneDeep(basicObject);

            clone.arr[1].num = 43;

            expect(ob.value()).to.deep.equal(clone);
        });
    });

    describe('on:change :', () => {
        it('No id provided', () => {
            const ob = Observable(basicObject);

            const spy = createOnChangeSpy(ob);

            ob.set(42);

            expect(spy.calledOnce).to.be.true();
        });

        it('set no id provided', () => {
            const obA = Observable();
            const obB = Observable(obA);

            const spyA = createOnChangeSpy(obA);
            const spyB = createOnChangeSpy(obB);

            obA.set(42);

            expect(spyA.calledOnce).to.be.true();
            expect(spyB.calledOnce).to.be.true();

            expect(obA.value()).to.equal(42);
            expect(obB.value()).to.equal(42);
        });
    });

    describe('Get :', () => {
        it('no id provided', () => {
            const ob = Observable();

            const newOb = ob.get();

            expect(newOb).to.equal(ob);
        });


        describe('no id provided', () => {


            // it('undefined value', () => {
            //     const ob = Observable({
            //
            //     });
            //
            //     const newOb = ob.get();
            //
            //     expect(newOb).to.equal(ob);
            // });
        });
    });

    describe('toJS :', () => {

    });

    describe('Pause :', () => {

    });

    describe('Run :', () => {

    });

    // function buildTestObject() {
    //     return Observable({
    //         str: 'foo',
    //         num: 42,
    //         bool: true,
    //         obj: {
    //             str: 'foo',
    //             num: 42,
    //             bool: true,
    //             obj: {
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             },
    //             arr: [{
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             }, {
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             }]
    //         },
    //         arr: [{
    //             str: 'foo',
    //             num: 42,
    //             bool: true,
    //             obj: {
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             },
    //             arr: [{
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             }, {
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             }]
    //         }, {
    //             str: 'foo',
    //             num: 42,
    //             bool: true,
    //             obj: {
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             },
    //             arr: [{
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             }, {
    //                 str: 'foo',
    //                 num: 42,
    //                 bool: true
    //             }]
    //         }]
    //     });
    // }
    //
    // it('Build test object', () => {
    //     buildTestObject();
    // });
    //
    // describe('Run against test object', () => {
    //     beforeEach(function beforeEach() {
    //         this.mainObject = buildTestObject();
    //     });
    //
    //     describe('Set :', () => {
    //         it('No id provided', function test() {
    //             const ob = Observable();
    //
    //             ob.set(42);
    //
    //             expect(ob.value()).to.equal(42);
    //         });
    //     });
    //
    //     describe('on:change :', () => {
    //         it('set no id provided', () => {
    //             debugger;
    //
    //             const obA = Observable();
    //             const obB = Observable(obA);
    //
    //             const spyA = Sinon.spy();
    //             const spyB = Sinon.spy();
    //
    //             obA.on('change', spyA);
    //             obB.on('change', spyB);
    //
    //             obA.set(42);
    //
    //             expect(spyA.calledOnce).to.be.true();
    //             expect(spyB.calledOnce).to.be.true();
    //
    //             expect(obA.value()).to.equal(42);
    //             expect(obB.value()).to.equal(42);
    //         });
    //     });
    //
    //     describe('Get :', () => {
    //         it('no id provided', () => {
    //             const ob = Observable();
    //
    //             const newOb = ob.get();
    //
    //             expect(newOb).to.equal(ob);
    //         });
    //
    //
    //         describe('no id provided', () => {
    //
    //
    //             // it('undefined value', () => {
    //             //     const ob = Observable({
    //             //
    //             //     });
    //             //
    //             //     const newOb = ob.get();
    //             //
    //             //     expect(newOb).to.equal(ob);
    //             // });
    //         });
    //     });
    //
    //     describe('toJS :', () => {
    //
    //     });
    //
    //     describe('Pause :', () => {
    //
    //     });
    //
    //     describe('Unpause :', () => {
    //
    //     });
    // });

    describe('Heavy Tests', () => {
        it('other 1', () => {
            const ob = Observable({});

            ob.set('foo', false);

            expect(ob.value()).to.deep.equal({
                foo: false
            });

            ob.set('foo', {
                valid: true
            });

            expect(ob.value()).to.deep.equal({
                foo: {
                    valid: true
                }
            });
        });

        it('Merge 1', () => {
            // Verify that after two observables are merged the right events fire.

            const testDataA = _.cloneDeep(basicObject);
            const testDataB = _.cloneDeep(basicObject);

            const obA = Observable(testDataA);
            const obB = Observable(testDataB);

            const spyA = createOnChangeSpy(obA);
            const spyB = createOnChangeSpy(obB);

            obA.set(obB);

            // Nothing should have been called a nothing technicaly changed
            expect(spyA.called).to.be.false();
            expect(spyB.called).to.be.false();

            obB.set('str', 'bar');

            // Both should have fired their events once.
            expect(spyA.calledOnce).to.be.true();
            expect(spyB.calledOnce).to.be.true();

            testDataA.str = 'bar';

            expect(obA.value()).to.deep.equal(testDataA);
            expect(obB.value()).to.deep.equal(testDataA);
        });

        it('Merge 2', () => {
            // Verify that after two observables are merged the right events fire.

            const testDataA = _.cloneDeep(basicObject);
            const testDataB = _.cloneDeep(basicObject);

            const obA = Observable(testDataA);
            const obAObjNum = obA.get('obj.num');

            const obB = Observable(testDataB);
            const obBObj = obB.get('obj');
            const obBObjNum = obB.get('obj.num');

            const spyA = createOnChangeSpy(obA);
            const spyAObjNum = createOnChangeSpy(obAObjNum);
            const spyB = createOnChangeSpy(obB);
            const spyBObj = createOnChangeSpy(obBObj);
            const spyBObjNum = createOnChangeSpy(obBObjNum);

            obA.set('obj', obBObj);

            // Nothing should have been called a nothing technicaly changed
            expect(spyA.called).to.be.false();
            expect(spyAObjNum.called).to.be.false();
            expect(spyB.called).to.be.false();
            expect(spyBObj.called).to.be.false();
            expect(spyBObjNum.called).to.be.false();

            obB.set('obj.num', 24);

            // Both should have fired their events once.
            expect(spyA.calledOnce).to.be.true();
            expect(spyAObjNum.calledOnce).to.be.true();
            expect(spyB.calledOnce).to.be.true();
            expect(spyBObj.calledOnce).to.be.true();
            expect(spyBObjNum.calledOnce).to.be.true();

            testDataA.obj.num = 24;

            expect(obA.value()).to.deep.equal(testDataA);
            expect(obB.value()).to.deep.equal(testDataA);

            expect(obAObjNum.value()).to.deep.equal(testDataA.obj.num);
            expect(obBObj.value()).to.deep.equal(testDataA.obj);
            expect(obBObjNum.value()).to.deep.equal(testDataA.obj.num);
        });

        it('array test', () => {
            function checkForUnique(list, value, id) {
                const index = _.findIndex(list.value(), (content) => {
                    return content.value === value;
                });

                if (index <= -1) {
                    return 'dne';
                }

                const content = list.get(`${index}`);

                return content.value().owner === id ? 'owner' : 'fail';
            }

            const ob = Observable([]);

            let paused = false;

            const validate = (id) => {
                if (paused) {
                    return;
                }

                const ret = checkForUnique(ob, 'foo', id);

                if (ret === 'fail') {
                    // throw new Error('EXISTS!');
                } else if (ret === 'dne') {
                    paused = true;

                    ob.push({
                        value: 'foo',
                        owner: id
                    });

                    paused = false;
                }
            };

            validate('dudeA');

            ob.on('change', validate);

            validate('dudeB');
        });
    });
});

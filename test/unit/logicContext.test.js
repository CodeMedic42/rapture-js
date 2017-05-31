const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const _ = require('lodash');
const Sinon = require('sinon');
const EventEmitter = require('eventemitter3');
const LogicContext = require('../../src/logicContext.js');
const ShortId = require('shortid');
const Issue = require('../../src/issue.js');

Chai.use(DirtyChai);

const expect = Chai.expect;

function buildSpy(name) {
    const spy = Sinon.spy((...args) => {
        if (spy.$calls.length <= spy.$counter) {
            return undefined;
        }

        const callItem = spy.$calls[spy.$counter];

        spy.$counter += 1;

        if (_.isFunction(callItem.with)) {
            callItem.with(...args);
        }

        return callItem.returns;
    });

    spy.$name = name;

    spy.$calls = [];

    spy.$counter = 0;

    spy.$validate = () => {
        expect(spy.callCount).to.equal(spy.$calls.length);

        _.forEach(spy.$calls, (call) => {
            if (!_.isUndefined(call.on)) {
                expect(spy.calledOn(call.on)).to.be.true();
            }

            expect(spy.calledWith(...call.args)).to.be.true();
            expect(spy.returned(call.returns)).to.be.true();
        });
    };

    return spy;
}

function buildInitalGetRaw(on) {
    const spy = buildSpy('getRaw');

    spy.$calls.push({
        with: null,
        on,
        args: [],
        returns: 42
    });

    return spy;
}

function mockRuleContext() {
    const ruleContextMock = {
        tokenContext: new EventEmitter(),
        data: {},
        scope: {}
    };

    ruleContextMock.tokenContext.getRaw = buildInitalGetRaw(ruleContextMock.tokenContext);

    return ruleContextMock;
}

function mockLogicContext(type) {
    const logicContextMock = {
        state: buildSpy('statePrevious'),
        on: buildSpy('onPrevious'),
        ruleState: buildSpy('ruleState'),
    };

    logicContextMock.state.$calls.push({
        on: logicContextMock,
        args: [],
        returns: 'passing'
    });

    if (type === 'previous') {
        logicContextMock.on.$calls.push({
            on: logicContextMock,
            args: ['state', Sinon.match.func],
            returns: undefined
        });
    }

    return logicContextMock;
}

function buildMocks() {
    const mocks = {
        ruleContext: mockRuleContext(),
        parameters: [],
        onBuildCB: null,
        callbacks: {}
    };

    return mocks;
}

function validateControl(context, ruleContext, expectedControlStatus) {
    expect(_.isPlainObject(context._control.data)).to.be.true();
    expect(context._control.data.$shared).to.equal(ruleContext.data);

    expect(context._control.id).to.equal(context._id);
    expect(context._control.name).to.equal(context._name);
    expect(context._control.uuid).to.equal(context._uuid);

    expect(_.isPlainObject(context._control.data)).to.be.true();

    expect(context._control.state).to.deep.equal(expectedControlStatus);

    if (context._controlType === 'full') {
        expect(_.isFunction(context._control.set)).to.be.true();
        expect(_.isFunction(context._control.raise)).to.be.true();
        expect(_.isFunction(context._control.clear)).to.be.true();

        expect(_.isFunction(context._control.createRuleContext)).to.be.true();
        expect(_.isFunction(context._control.createRuleContextInScope)).to.be.true();
        expect(_.isFunction(context._control.buildLogicContext)).to.be.true();
        expect(_.isFunction(context._control.register)).to.be.true();
        expect(_.isFunction(context._control.unregister)).to.be.true();

        expect(context._control.scope).to.equal(ruleContext.scope);

        expect(_.keys(context._control).length).to.equal(14);
    } else if (context._controlType === 'set') {
        expect(_.isFunction(context._control.set)).to.be.true();

        expect(_.keys(context._control).length).to.equal(6);
    } else if (context._controlType === 'raise') {
        expect(_.isFunction(context._control.raise)).to.be.true();
        expect(_.isFunction(context._control.clear)).to.be.true();

        expect(_.keys(context._control).length).to.equal(7);
    } else {
        expect.fail();
    }
}

function validateStatus(observedStatus, expectedStatus) {
    expect(observedStatus).to.deep.equal(expectedStatus);
}

function validateCallbacks(context, mockData) {
    expect(context._onRun).to.equal(mockData.onRun);
    expect(context._onPause).to.equal(mockData.onPause);
    expect(context._onTeardown).to.equal(mockData.onTeardown);
}

function validateIssues(context, issues) {
    expect(context._livingIssues).to.deep.equal(issues);
}

function validateParameters(context, expected) {
    expect(context._parameters).to.deep.equal(expected);
}

function validateProperties(context, name, id, parent, previous) {
    expect(context._name).to.be.equal(name);

    expect(context._id).to.be.equal(id);

    expect(context._ruleContext).to.equal(parent);
    expect(context._previousLogicContext).to.equal(previous);
}

function validateSpies(mocks, properties) {
    mocks.ruleContext.tokenContext.getRaw.$validate();

    if (!_.isNil(mocks.callbacks.onBuild)) {
        mocks.callbacks.onBuild.$validate();
    }

    if (!_.isNil(mocks.callbacks.onDispose)) {
        mocks.callbacks.onDispose.$validate();
    }

    if (!_.isNil(mocks.callbacks.onStart)) {
        mocks.callbacks.onStart.$validate();
    }

    if (!_.isNil(mocks.callbacks.onStop)) {
        mocks.callbacks.onStop.$validate();
    }

    if (!_.isNil(mocks.callbacks.onValid)) {
        mocks.callbacks.onValid.$validate();
    }

    if (!_.isNil(mocks.callbacks.onInvalid)) {
        mocks.callbacks.onInvalid.$validate();
    }

    if (!_.isNil(mocks.onRaise)) {
        mocks.onRaise.$validate();
    }

    if (!_.isNil(mocks.onUpdate)) {
        mocks.onUpdate.$validate();
    }

    if (!_.isNil(mocks.onState)) {
        mocks.onState.$validate();
    }

    if (!_.isNil(properties.previous)) {
        properties.previous.on.$validate();
    }
}

function defineOnBuild() {
    const spy = this.mocks.callbacks.onBuild = buildSpy('onBuild');

    spy.$calls.push({
        with: null,
        on: undefined,
        args: [],
        returns: undefined
    });
}

// function defineOnStart() {
//     this.mocks.callbacks.onStart = buildSpy('onStart');
// }
//
// function defineOnStop() {
//     this.mocks.callbacks.onStart = buildSpy('onStop');
// }
//
// function defineOnValid() {
//     this.mocks.callbacks.onStart = buildSpy('onValid');
// }
//
// function defineOnInvalid() {
//     this.mocks.callbacks.onStart = buildSpy('onInvalid');
// }
//
// function defineOnDisposed() {
//     this.mocks.callbacks.onStart = buildSpy('onDisposed');
// }

describe('LogicContext :', () => {
    beforeEach(function beforeEach() {
        this.mocks = buildMocks();

        this.properties = {
            id: ShortId.generate(),
            name: ShortId.generate(),
            controlType: 'full',
            parent: this.mocks.ruleContext,
            previous: undefined
        };

        this.issues = [];

        this.processedParameters = {
            values: {},
            meta: {},
            contexts: {},
            listeners: {},
            state: {}
        };

        this.status = {
            previousRuleState: 'passing',
            runState: 'stopped',
            valueState: 'undefined',
            state: 'passing',
            ruleState: 'passing',
            validationState: 'passing',
            contentState: 'passing',
            parametersState: 'passing',
            validState: 'passing',
            evalPending: true,
            valueEmitPending: false,
            raiseEmitPending: false,
            stateEmitPending: false
        };

        this.getRawReturnValue = 42;

        this.currentValue = undefined;

        this.construct = () => {
            const context = LogicContext(this.properties,
                this.mocks.callbacks,
                this.mocks.parameters,
                this.options
            );

            this.mocks.onRaise = buildSpy('onRaise');
            this.mocks.onUpdate = buildSpy('onUpdate');
            this.mocks.onState = buildSpy('onState');

            context.on('raise', this.mocks.onRaise);
            context.on('update', this.mocks.onUpdate);
            context.on('state', this.mocks.onState);

            return context;
        };

        this.controlStatus = {};

        this.validate = (context) => {
            if (!_.isNil(this.mocks.callbacks.onBuild)) {
                this.mocks.callbacks.onBuild.$calls[0].args.push(context._control);
            }

            validateProperties(context, this.properties.name, this.properties.id, this.properties.parent, this.properties.previous);

            validateCallbacks(context, this.mocks);

            validateIssues(context, this.issues);

            validateParameters(context, this.processedParameters);

            validateControl(context, this.mocks.ruleContext, this.controlStatus);

            validateStatus(context._status, this.status);

            validateSpies(this.mocks, this.properties);

            expect(context._content).to.equal(this.mocks.ruleContext.tokenContext.getRaw.$calls[0].returns);
            expect(this._currentValue).to.equal(this.currentValue);
        };
    });

    describe('Construction :', () => {
        // it('general start', () => {
        //     try {
        //         LogicContext();
        //
        //         expect.fail();
        //     } catch (err) {
        //         expect(err).to.exist();
        //     }
        // });

        it('Minimum complement', function test() {
            const context = this.construct();

            this.validate(context);
        });

        describe('controlType :', () => {
            it('full', function test() {
                this.properties.controlType = 'full';

                const context = this.construct();

                this.validate(context);
            });

            it('set', function test() {
                this.properties.controlType = 'set';

                const context = this.construct();

                this.validate(context);
            });

            it('raise', function test() {
                this.properties.controlType = 'raise';

                const context = this.construct();

                this.validate(context);
            });
        });

        describe('onBuild :', () => {
            beforeEach(function beforeEach() {
                defineOnBuild.call(this);
            });

            it('onBuild does nothing', function test() {
                const context = this.construct();

                this.validate(context);
            });

            it('onBuild returns "foo" nothing changes', function test() {
                this.mocks.callbacks.onBuild.$calls[0].returns = 'foo';

                const context = this.construct();

                this.validate(context);
            });

            it('onBuild calls set with undefined', function test() {
                this.mocks.callbacks.onBuild.$calls[0].returns = 'foo';
                this.mocks.callbacks.onBuild.$calls[0].with = (context) => {
                    context.set();
                };

                const context = this.construct();

                this.currentValue = undefined;
                this.status.valueState = 'undefined';

                this.validate(context);
            });

            it('onBuild calls set with null', function test() {
                const newValue = null;

                this.mocks.callbacks.onBuild.$calls[0].returns = 'foo';
                this.mocks.callbacks.onBuild.$calls[0].with = (control) => {
                    control.set(newValue);
                };

                const context = this.construct();

                this.currentValue = newValue;
                // We are not running so the value is still marked as undefined
                this.status.valueState = 'undefined';

                this.validate(context);
            });

            it('onBuild calls set with value', function test() {
                const newValue = 'bar';

                this.mocks.callbacks.onBuild.$calls[0].returns = 'foo';
                this.mocks.callbacks.onBuild.$calls[0].with = (context) => {
                    context.set(newValue);
                };

                const context = this.construct();

                this.currentValue = newValue;
                // We are not running so the value is still marked as undefined
                this.status.valueState = 'undefined';

                this.validate(context);
            });

            it('onBuild calls raise with issue', function test() {
                const issue = Issue('test', undefined, undefined, 'issue message', 'error');

                this.issues.push(issue);

                this.mocks.callbacks.onBuild.$calls[0].returns = 'foo';
                this.mocks.callbacks.onBuild.$calls[0].with = (context) => {
                    context.raise(issue.type, issue.message, issue.severity);
                };

                const context = this.construct();

                // this.status.state = 'failing'; // Not failing because not running.
                this.status.validationState = 'failing';
                // this.status.fullValidationState = 'failing';

                this.validate(context);
            });

            it('onBuild calls raise with issue and set with value', function test() {
                const newValue = 'bar';

                const issue = Issue('test', undefined, undefined, 'issue message', 'error');

                this.issues.push(issue);

                this.mocks.callbacks.onBuild.$calls[0].returns = 'foo';
                this.mocks.callbacks.onBuild.$calls[0].with = (context) => {
                    context.raise(issue.type, issue.message, issue.severity);
                    context.set(newValue);
                };

                const context = this.construct();

                // We are not running so the value is still marked as undefined
                this.status.valueState = 'undefined';
                // Even though we are not running the VALIDATION is marked as failing. But...
                this.status.validationState = 'failing';
                // Because we are not running we are still marked as passing.
                this.status.state = 'passing';

                this.validate(context);
            });

            it('onBuild calls calls raise without an issue', function test() {
                this.mocks.callbacks.onBuild.$calls[0].returns = 'foo';
                this.mocks.callbacks.onBuild.$calls[0].with = (context) => {
                    context.raise();
                };

                const context = this.construct();

                // Even though we are not running the VALIDATION is marked as failing. But...
                this.status.validationState = 'failing';
                // Because we are not running we are still marked as passing.
                this.status.state = 'passing';

                this.validate(context);
            });

            it('onBuild calls calls clear', function test() {
                this.mocks.callbacks.onBuild.$calls[0].returns = 'foo';
                this.mocks.callbacks.onBuild.$calls[0].with = (context) => {
                    context.clear();
                };

                const context = this.construct();

                this.validate(context);
            });
        });

        describe('with previous logic context :', () => {
            it('is passing validation', function test() {
                this.properties.previous = mockLogicContext('previous');

                this.properties.previous.ruleState.$calls.push({
                    with: null,
                    on: undefined,
                    args: [],
                    returns: 'passing'
                });

                const context = this.construct();

                this.properties.previous.on.$calls[0].args.push(context);

                this.validate(context);
            });

            it('is failing validation', function test() {
                this.properties.previous = mockLogicContext('previous');

                this.properties.previous.ruleState.$calls.push({
                    with: null,
                    on: undefined,
                    args: [],
                    returns: 'failing'
                });

                const context = this.construct();

                this.status.state = 'passing';
                this.status.previousRuleState = 'failing';

                this.properties.previous.on.$calls[0].args.push(context);

                this.validate(context);
            });
        });
    });

    // describe('start :', () => {
    //     beforeEach(function beforeEach() {
    //         this.mocks.callbacks.onBuild = null;
    //         this.mocks.onRun = null;
    //         this.mocks.onPause = null;
    //         this.mocks.onTeardown = null;
    //     });
    //
    //     // it('no previousContext', function test() {
    //     //     const context = this.construct();
    //     //
    //     //     this.validate(context);
    //     //
    //     //     this.status.runState = 'started';
    //     //
    //     //     context.start();
    //     //
    //     //     this.validate(context);
    //     // });
    //     //
    //     // it('with previousContext which is passing validation', function test() {
    //     //     const context = this.construct();
    //     //
    //     //     this.properties.previous = this.mocks.logicContext;
    //     //
    //     //     this.validate(context);
    //     //
    //     //     this.status.runState = 'started';
    //     //
    //     //     context.start();
    //     //
    //     //     this.validate(context);
    //     // });
    // });
});

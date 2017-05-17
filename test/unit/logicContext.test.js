const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const _ = require('lodash');
const Sinon = require('sinon');
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
            expect(spy.calledOn(call.on)).to.be.true();
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

function buildInitalOnSetup() {
    const spy = buildSpy('onSetup');

    spy.$calls.push({
        with: null,
        on: null,
        args: [],
        returns: undefined
    });

    return spy;
}

function mockRuleContext() {
    const ruleContextMock = {
        tokenContext: {},
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
        onSetupCB: null
    };

    mocks.onSetup = buildInitalOnSetup();
    mocks.onRun = buildSpy('onRun');
    mocks.onPause = buildSpy('onPause');
    mocks.onTeardown = buildSpy('onTeardown');

    return mocks;
}

function validateControl(context, id, data, state, paramState, scope, isFull) {
    expect(context._control.data).to.equal(data);
    expect(context._control.id).to.equal(id);
    expect(context._control.state).to.equal(state);
    expect(context._control.paramState).to.equal(paramState);
    expect(_.isFunction(context._control.set)).to.be.true();
    expect(_.isFunction(context._control.raise)).to.be.true();

    if (isFull) {
        expect(_.isFunction(context._control.createRuleContext)).to.be.true();
        expect(_.isFunction(context._control.createRuleContextInScope)).to.be.true();
        expect(_.isFunction(context._control.buildLogicContext)).to.be.true();
        expect(_.isFunction(context._control.register)).to.be.true();
        expect(_.isFunction(context._control.unregister)).to.be.true();

        expect(context._control.scope).to.equal(scope);

        expect(_.keys(context._control).length).to.equal(12);
    } else {
        expect(_.keys(context._control).length).to.equal(6);
    }
}

function validateStatus(observedStatus, expectedStatus) {
    expect(observedStatus).to.deep.equal(expectedStatus);
    // expect(observedStatus.fullValidationState).to.be.equal(expectedStatus.fullValidationState);
    // expect(observedStatus.runState).to.be.equal(expectedStatus.runState);
    // expect(observedStatus.valueState).to.be.equal(expectedStatus.valueState);
    // expect(observedStatus.validationState).to.be.equal(expectedStatus.validationState);
    // expect(observedStatus.valueEmitPending).to.be.equal(expectedStatus.valueEmitPending);
    // expect(observedStatus.raiseEmitPending).to.be.equal(expectedStatus.raiseEmitPending);
    // expect(observedStatus.stateEmitPending).to.be.equal(expectedStatus.stateEmitPending);
    //
    // expect(_.keys(observedStatus).length).to.equal(7);
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

function validateProperties(context, name, parent, previous) {
    expect(context._name).to.be.equal(name);
    expect(_.startsWith(context._id, name)).to.be.true();

    expect(context._ruleContext).to.equal(parent);
    expect(context._previousLogicContext).to.equal(previous);
}

function validateSpies(mocks, properties) {
    mocks.ruleContext.tokenContext.getRaw.$validate();

    if (!_.isNil(mocks.onSetup)) {
        mocks.onSetup.$validate();
    }

    if (!_.isNil(mocks.onRun)) {
        mocks.onRun.$validate();
    }

    if (!_.isNil(mocks.onPause)) {
        mocks.onPause.$validate();
    }

    if (!_.isNil(mocks.onTeardown)) {
        mocks.onTeardown.$validate();
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

describe('LogicContext :', () => {
    beforeEach(function beforeEach() {
        this.mocks = buildMocks();

        this.properties = {
            name: ShortId.generate(),
            fullControl: true,
            parent: this.mocks.ruleContext,
            previous: undefined
        };

        this.issues = [];

        this.processedParameters = {
            values: {},
            meta: {},
            contexts: {},
            listeners: {}
        };

        this.control = {
            id: context._id,
            data: this.mocks.ruleContext.data,
            state: 'passing',
            paramState: 'passing',
            scope: undefined
        };

        this.status = {
            runState: 'stopped',
            valueState: 'undefined',
            validationState: 'passing',
            fullValidationState: 'passing',
            paramState: 'passing',
            valueEmitPending: false,
            raiseEmitPending: false,
            stateEmitPending: false
        };

        this.getRawReturnValue = 42;

        this.currentValue = undefined;

        this.construct = () => {
            const context = LogicContext(this.properties,
                this.mocks,
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

        this.validate = (context) => {
            this.control.id = context._id;
            this.control.scope = this.mocks.ruleContext.scope;

            if (!_.isNil(this.mocks.onSetup)) {
                this.mocks.onSetup.$calls[0].args.push(context._control, context._content);
            }

            validateProperties(context, this.properties.name, this.properties.parent, this.properties.previous);

            validateCallbacks(context, this.mocks);

            validateIssues(context, this.issues);

            validateParameters(context, this.processedParameters);

            validateControl(context, this.control.id, this.control.data, this.control.state, this.control.paramState, this.control.scope, this.properties.fullControl);

            validateStatus(context._status, this.status);

            validateSpies(this.mocks, this.properties);

            expect(context._content).to.equal(this.mocks.ruleContext.tokenContext.getRaw.$calls[0].returns);
            expect(this._currentValue).to.equal(this.currentValue);

            expect(context.state()).to.equal(this.status.fullValidationState);
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
            // const mocks = buildMocks();

            this.mocks.onSetup = undefined;
            this.mocks.onRun = undefined;
            this.mocks.onPause = undefined;
            this.mocks.onTeardown = undefined;

            const context = this.construct();

            this.validate(context);
        });

        describe('controlType :', () => {
            it('full', function test() {
                this.properties.fullControl = true;

                const context = this.construct();

                this.validate(context);
            });

            it('not full', function test() {
                this.properties.fullControl = false;

                const context = this.construct();

                this.validate(context);
            });
        });

        describe('onSetup :', () => {
            it('onSetup does nothing', function test() {
                const context = this.construct();

                this.validate(context);
            });

            it('onSetup returns "foo" nothing changes', function test() {
                this.mocks.onSetup.$calls[0].returns = 'foo';

                const context = this.construct();

                this.validate(context);
            });

            it('onSetup calls set with undefined', function test() {
                this.mocks.onSetup.$calls[0].returns = 'foo';
                this.mocks.onSetup.$calls[0].with = (context) => {
                    context.set();
                };

                const context = this.construct();

                this.currentValue = undefined;
                this.status.valueState = 'undefined';

                this.validate(context);
            });

            it('onSetup calls set with null', function test() {
                const newValue = null;

                this.mocks.onSetup.$calls[0].returns = 'foo';
                this.mocks.onSetup.$calls[0].with = (context) => {
                    context.set(newValue);
                };

                const context = this.construct();

                this.currentValue = newValue;
                // We are not running so the value is still marked as undefined
                this.status.valueState = 'undefined';

                this.validate(context);
            });

            it('onSetup calls set with value', function test() {
                const newValue = 'bar';

                this.mocks.onSetup.$calls[0].returns = 'foo';
                this.mocks.onSetup.$calls[0].with = (context) => {
                    context.set(newValue);
                };

                const context = this.construct();

                this.currentValue = newValue;
                // We are not running so the value is still marked as undefined
                this.status.valueState = 'undefined';

                this.validate(context);
            });

            it('onSetup calls raise with issue', function test() {
                const issue = Issue('test', undefined, undefined, 'issue message', 'error');

                this.issues.push(issue);

                this.mocks.onSetup.$calls[0].returns = 'foo';
                this.mocks.onSetup.$calls[0].with = (context) => {
                    context.raise(issue.type, issue.message, issue.severity);
                };

                const context = this.construct();

                this.status.validationState = 'failing';
                this.status.fullValidationState = 'failing';

                this.validate(context);
            });

            it('onSetup calls raise with issue and set with value', function test() {
                const newValue = 'bar';

                const issue = Issue('test', undefined, undefined, 'issue message', 'error');

                this.issues.push(issue);

                this.mocks.onSetup.$calls[0].returns = 'foo';
                this.mocks.onSetup.$calls[0].with = (context) => {
                    context.raise(issue.type, issue.message, issue.severity);
                    context.set(newValue);
                };

                const context = this.construct();

                // We are not running so the value is still marked as undefined
                this.status.valueState = 'undefined';
                this.status.validationState = 'failing';
                this.status.fullValidationState = 'failing';

                this.validate(context);
            });

            it('onSetup calls raise without issue', function test() {
                this.mocks.onSetup.$calls[0].returns = 'foo';
                this.mocks.onSetup.$calls[0].with = (context) => {
                    context.raise();
                };

                const context = this.construct();

                this.validate(context);
            });
        });

        describe('with previous logic context :', () => {
            it('is passing validation', function test() {
                this.properties.previous = mockLogicContext('previous');

                const context = this.construct();

                this.properties.previous.on.$calls[0].args.push(context);

                this.validate(context);
            });

            it('is failing validation', function test() {
                this.properties.previous = mockLogicContext('previous');

                this.properties.previous.state.$calls[0].returns = 'failing';
                // this.properties.previous.state.$calls.push(this.properties.previous.state.$calls[0]);

                const context = this.construct();

                this.status.fullValidationState = 'failing';
                this.control.state = 'failing';

                this.properties.previous.on.$calls[0].args.push(context);

                this.validate(context);
            });
        });
    });

    describe('start :', () => {
        beforeEach(function beforeEach() {
            this.mocks.onSetup = null;
            this.mocks.onRun = null;
            this.mocks.onPause = null;
            this.mocks.onTeardown = null;
        });

        // it('no previousContext', function test() {
        //     const context = this.construct();
        //
        //     this.validate(context);
        //
        //     this.status.runState = 'started';
        //
        //     context.start();
        //
        //     this.validate(context);
        // });
        //
        // it('with previousContext which is passing validation', function test() {
        //     const context = this.construct();
        //
        //     this.properties.previous = this.mocks.logicContext;
        //
        //     this.validate(context);
        //
        //     this.status.runState = 'started';
        //
        //     context.start();
        //
        //     this.validate(context);
        // });
    });
});

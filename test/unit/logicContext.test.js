const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const _ = require('lodash');
const Sinon = require('sinon');
const LogicContext = require('../../src/logicContext.js');
const ShortId = require('shortid');
const Issue = require('../../src/issue.js');

Chai.use(DirtyChai);

const expect = Chai.expect;

function buildSpy() {
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
    const spy = buildSpy();

    spy.$calls.push({
        with: null,
        on,
        args: [],
        returns: 42
    });

    return spy;
}

function buildInitalOnSetup() {
    const spy = buildSpy();

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

function buildMocks() {
    const mocks = {
        ruleContext: mockRuleContext(),
        parameters: [],
        onSetupCB: null
    };

    mocks.onSetup = buildInitalOnSetup();
    mocks.onRun = buildSpy();
    mocks.onPause = buildSpy();
    mocks.onTeardown = buildSpy();

    return mocks;
}

function validateControl(context, id, data, state, scope) {
    expect(context._context.data).to.equal(data);
    expect(context._context.id).to.equal(id);
    expect(context._context.state).to.equal(state);
    expect(_.isFunction(context._context.set)).to.be.true();
    expect(_.isFunction(context._context.raise)).to.be.true();

    if (context._fullControl) {
        expect(_.isFunction(context._context.createRuleContext)).to.be.true();
        expect(_.isFunction(context._context.createRuleContextInScope)).to.be.true();
        expect(_.isFunction(context._context.buildLogicContext)).to.be.true();
        expect(_.isFunction(context._context.register)).to.be.true();
        expect(_.isFunction(context._context.unregister)).to.be.true();

        expect(context._context.scope).to.equal(scope);

        expect(_.keys(context._context).length).to.equal(11);
    } else {
        expect(_.keys(context._context).length).to.equal(5);
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

function validateSpies(mocks) {
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
            state: 'pass',
            scope: undefined
        };

        this.status = {
            runState: 'stopped',
            valueState: 'undefined',
            validateState: 'pass',
            fullValidationState: 'pass',
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

            this.mocks.onRaise = buildSpy();
            this.mocks.onUpdate = buildSpy();
            this.mocks.onState = buildSpy();

            context.on('raise', this.mocks.onRaise);
            context.on('update', this.mocks.onUpdate);
            context.on('state', this.mocks.onState);

            return context;
        };

        this.validate = (context) => {
            this.control.id = context._id;
            this.control.scope = this.mocks.ruleContext.scope;

            if (!_.isNil(this.mocks.onSetup)) {
                this.mocks.onSetup.$calls[0].args.push(context._context, context._content);
            }

            validateProperties(context, this.properties.name, this.properties.parent, this.properties.previous);

            validateCallbacks(context, this.mocks);

            validateIssues(context, this.issues);

            validateParameters(context, this.processedParameters);

            validateControl(context, this.control.id, this.control.data, this.control.state, this.control.scope);

            validateStatus(context._status, this.status);

            validateSpies(this.mocks);

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
            // const mocks = buildMocks();

            this.mocks.onSetup = undefined;
            this.mocks.onRun = undefined;
            this.mocks.onPause = undefined;
            this.mocks.onTeardown = undefined;

            const context = this.construct();

            this.validate(context);
        });

        describe('type :', () => {
            it('raise', function test() {
                this.type = 'raise';

                const context = this.construct();

                this.validate(context);
            });

            it('set', function test() {
                this.type = 'set';

                const context = this.construct();

                this.validate(context);
            });

            it('full', function test() {
                this.type = 'full';

                const context = this.construct();

                this.validate(context);
            });

            it('other', function test() {
                this.type = 'other';

                try {
                    this.construct();

                    expect.fail();
                } catch (err) {
                    expect(err).to.exist();
                }
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
                this.status.currentState = 'undefined';
                this.status.determined = true;
                this.status.fullState = 'undefined';

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
                this.status.valueState = 'ready';
                this.status.currentState = 'ready';
                this.status.determined = true;
                this.status.fullState = 'ready';

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
                this.status.valueState = 'ready';
                this.status.currentState = 'ready';
                this.status.determined = true;
                this.status.fullState = 'ready';

                this.validate(context);
            });

            it('onSetup calls raise with issue', function test() {
                this.properties.type = 'raise';

                const issue = Issue('test', undefined, undefined, 'issue message', 'error');

                this.issues.push(issue);

                this.mocks.onSetup.$calls[0].returns = 'foo';
                this.mocks.onSetup.$calls[0].with = (context) => {
                    context.raise(issue.type, issue.message, issue.severity);
                };

                const context = this.construct();

                // This is automatcily set so that it can be gathered quickly. But control should only have the that value of the previous.
                this.status.currentState = 'failed';
                this.status.valueState = 'failed';
                this.status.determined = true;
                this.status.fullState = 'failed';

                this.validate(context);
            });

            it('onSetup calls raise without issue', function test() {
                this.properties.type = 'raise';

                const issue = Issue('test', undefined, undefined, 'issue message', 'error');

                this.issues.push(issue);

                this.mocks.onSetup.$calls[0].returns = 'foo';
                this.mocks.onSetup.$calls[0].with = (context) => {
                    context.raise(issue.type, issue.message, issue.severity);
                };

                const context = this.construct();

                // This is automatcily set so that it can be gathered quickly. But control should only have the that value of the previous.
                this.status.currentState = 'failed';
                this.status.valueState = 'failed';
                this.status.determined = true;
                this.status.fullState = 'failed';

                this.validate(context);
            });
        });
    });

    describe('start', () => {
        describe('onSetup not used', () => {
            // describe
        });

        describe('onSetup is used', () => {});
    });
});

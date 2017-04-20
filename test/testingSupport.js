const Chai = require('chai');
const DirtyChai = require('dirty-chai');
const _ = require('lodash');
const Console = require('console');
const Rapture = require('../src');

Chai.use(DirtyChai);

const expect = Chai.expect;

function baseValidate(testObject, rule) {
    const testData = JSON.stringify(testObject, null, 2);

    expect(rule, 'Rule Definition is created').to.be.exist();

    const session = Rapture.createSessionContext();
    expect(session, 'Session is created').to.be.exist();

    const context = session.createArtifactContext('artifactID', rule, testData);
    expect(context, 'context is created').to.be.exist();

    return context;
}

function validateIssue(issue, expectedIssue) {
    expect(issue.type, 'Issue type').to.be.equal(expectedIssue.type);
    expect(issue.location.rowStart, 'Issue location.rowStart.').to.be.equal(expectedIssue.rowStart);
    expect(issue.location.rowEnd, 'Issue location.rowEnd').to.be.equal(expectedIssue.rowEnd);
    expect(issue.location.columnStart, 'Issue location.columnStart').to.be.equal(expectedIssue.columnStart);
    expect(issue.location.columnEnd, 'Issue location.columnEnd').to.be.equal(expectedIssue.columnEnd);
    expect(issue.message, 'Issue Message').to.be.equal(expectedIssue.message);
    expect(issue.cause, 'Issue cause').to.be.equal(expectedIssue.cause);
    expect(issue.severity, 'Issue severity').to.be.equal(expectedIssue.severity);
}

module.exports.pass = function pass(testObject, rule) {
    const context = baseValidate(testObject, rule);

    const issues = context.issues();

    _.forEach(issues, issue => Console.log(issue.message));

    expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    expect(issues.length, 'Zero issues found.').to.be.equal(0);

    return context;
};

module.exports.fail = function fail(testObject, rule, ...args) {
    const context = baseValidate(testObject, rule);

    const expectedIssues = _.flattenDeep(args);

    const issues = context.issues();

    // _.forEach(issues, issue => Console.log(issue.message));

    expect(issues, 'Issues is an array').to.be.instanceOf(Array);
    expect(issues.length, 'One issue found.').to.be.equal(expectedIssues.length);

    _.forEach(expectedIssues, (expectedIssue, expectedIssueIndex) => {
        validateIssue(issues[expectedIssueIndex], expectedIssue);
    });

    return context;
};

module.exports.failWithException = function failWithException(testObject, rule, expectedMessage) {
    const testData = JSON.stringify(testObject, null, 2);

    expect(rule, 'Rule is created').to.be.exist();

    const session = Rapture.createSessionContext();
    expect(session, 'Session is created').to.be.exist();

    try {
        session.createArtifactContext('artifactID', rule, testData);

        expect.fail();
    } catch (err) {
        expect(err.message).to.be.equal(expectedMessage);
    }
};

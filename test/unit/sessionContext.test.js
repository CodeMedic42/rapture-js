/* eslint-disable import/no-extraneous-dependencies */
const Chai = require('chai');
const DirtyChai = require('dirty-chai');

const Rapture = require('../../src');
const SessionContext = require('../../src/sessionContext.js');
const ArtifactContext = require('../../src/artifactContext.js');

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('SessionContext Tests', () => {
    it('createSessionContext exists in Rapture', () => {
        expect(Rapture.createSessionContext, 'Must exist').to.exist();
        expect(Rapture.createSessionContext, 'Must be a function').to.be.instanceOf(Function);
    });

    it('createSession creates a SessionContext', () => {
        const sessionContext = Rapture.createSessionContext();

        expect(sessionContext, 'Must exist').to.exist();
        expect(sessionContext, 'Must be an instanceof SessionContext').to.be.instanceOf(SessionContext);
    });

    describe('createArtifactContext', () => {
        it('SessionContext has createArtifactContext', () => {
            const sessionContext = SessionContext();

            expect(sessionContext.createArtifactContext, 'Must exist').to.exist();
            expect(sessionContext.createArtifactContext, 'Must be a function').to.be.instanceOf(Function);
        });

        it('createArtifactContext creates an ArtifactContext', () => {
            const sessionContext = SessionContext();

            const artifactRule = Rapture.any();

            const testData = {};

            const artifactA = JSON.stringify(testData);

            const artifactContext = sessionContext.createArtifactContext('artifactID', artifactRule, artifactA);

            expect(artifactContext, 'Must exist').to.exist();
            expect(artifactContext, 'Must be an instanceof ArtifactContext').to.be.instanceOf(ArtifactContext);
        });
    });
});

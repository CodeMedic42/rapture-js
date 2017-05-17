/* eslint-disable import/no-extraneous-dependencies */

const Chai = require('chai');
const DirtyChai = require('dirty-chai');
// const _ = require('lodash');
// const Console = require('console');
const Rapture = require('../../src');

Chai.use(DirtyChai);

const expect = Chai.expect;

describe('Register and Require Integration Tests :', () => {
    // The job of this test is to focus on registering a dynamic id and then rebuilding that id and requiring it through the _session.
    it('Test A', () => {
        const testObjectA = {
            id: 'foo'
        };
        const testObjectB = {
            ref: 'foo'
        };

        let called = false;

        const ruleA = Rapture.object().valid({
            id: Rapture.string().register({
                id: Rapture.logic({
                    onSetup: (context, content) => context.set(`id/${content}`)
                }),
                scope: '__session'
            })
        });

        const ruleB = Rapture.object().valid({
            ref: Rapture.string().custom(Rapture.logic({
                require: {
                    id: 'idValue',
                    value: Rapture.logic({
                        onSetup: (context, content) => context.set(`id/${content}`)
                    })
                },
                onRun: (context, content, params) => {
                    expect(params.idValue).to.equal(content);

                    called = true;
                }
            }))
        });

        const testDataA = JSON.stringify(testObjectA, null, 2);
        const testDataB = JSON.stringify(testObjectB, null, 2);

        const session = Rapture.createSessionContext();

        const contextA = session.createArtifactContext('artifactA', ruleA, testDataA);
        const contextB = session.createArtifactContext('artifactB', ruleB, testDataB);

        expect(contextA.issues().length).to.equal(0);
        expect(contextB.issues().length).to.equal(0);
        expect(called).to.be.true();
    });
});

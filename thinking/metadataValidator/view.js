const Rapture = require('rapture');
const ObservableList = require('observableList');
const Common = require('./common.js');

const componentTemplateRule = null;

const componentBaseRule = Rapture.object(Rapture.scope()).keys({
    id: Rapture.string().min(1).define('componentType', (setup) => {
        setup.require('componentType');
        setup.require('components');

        setup.onRun((run, value) => {
            return `${run.params.componentType}/${value}`;
        }));

        setup.onSuccess((run, value) => {
            run.params.components.push({
                type: run.params.componentType,
                id: value
            });
        }));
    }),
    type: Rapture.string().min(1).define('componentType'),
    input: ,
    output: Rapture.string().min(1).allow(null)
    templates: Rapture.object.keys({
        [Common.patterns.standardPropertyPattern]: Rapture.defer(() => componentTemplateRule)
    })
}).required('id', 'type');

componentTemplateRule = componentTemplateRule.keys({
    children: Rapture.array().items(Rapture.defer(() => componentTemplateRule)),
    events: Rapture.object().keys({
        [Common.patterns.standardPropertyPattern]: Rapture.string().min(1)
    }).required(Common.patterns.standardPropertyPattern)
});

const componentRule = componentBaseRule.keys({
    children: Rapture.array().items(Rapture.defer(() => componentRule)),
});

function reduceToKeys(properties, set) {
    return _.reduce(properties, (keys, prop) => {
        keys[prop] = set;

        return keys;
    }, {});
}

const rulesRule = Rapture.object().keys({
    system: Rapture.object().keys({
        ready: rulesSchema(false),
        'load:view': rulesSchema(false)
    }),
    model: Rapture.object().keys((modelKeysSetup) => {
        modelKeysSetup.required('artifactModel');

        modelKeysSetup.onRun((modelKeysOnRun, tokenContext) => {
            const model = modelKeysOnRun.params.artifactModel;

            return {
                properties: Rapture.object().keys((propSetup) => {
                    propSetup.onRun((propRun, tokenContext) => {
                        return reduceToKeys(model.properties, rulesSchema(false));
                    };
                })
            };
        });
    }),
    components: Rapture.object().keys((componentsKeysSetup) => {
        componentsKeysSetup.required('components');

        componentsKeysSetup.onRun((componentsKeysOnRun, tokenContext) => {
            return _.reduce(componentsKeysOnRun.components, (keys, prop) => {
                keys[prop] = Rapture.object().keys({
                        events: Rapture.object().keys((eventsKeysSetup) => {
                            eventsKeysSetup.require('events', `component/${prop}/events`);

                            eventsKeysSetup.onRun((eventsKeysRun, tokenContext) => {
                                return reduceToKeys(eventsKeysRun.params.events, rulesSchema(false));
                            });
                        })
                    })
                });

                return keys;
            }, {});
        });
    });
});

function buildView() {
    return Rapture.object().keys({
        type: Rapture.string().min(1)
        model: Common.buildModel(),
        components: Rapture.array().min(1).items(componentRule).define('components', 'artifact', (setup) => {
            setup.onRun(() => {
                return new ObservableList();
            })
        }).define((setup) => {
            setup.require('fullArtifactID');
            setup.onRun((run) => {
                return `${run.params.fullArtifactID}/components`
            });
        }, 'artifact',
        (setup) => {
            setup.require('components');
            setup.onRun((run) => {
                return run.params.components;
            })
        }),
        commands: Common.buildCommandsRule(),
        rules: rulesRule
    }).required('model', 'presentation', 'type');
}

module.exports = buildView;

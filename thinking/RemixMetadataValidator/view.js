const component = jRule.object();

function reduceToKeys(properties, set) {
    return _.reduce(properties, (keys, prop) => {
        keys[prop] = set;

        return keys;
    }, {});
}

function buildView() {
    return jRule.object().keys({
        model: definedModelRule,
        components: jRule.array().min(1).items(component),
        commands: commandsRule,
        rules: jRule.object().keys({
            system: jRule.object().keys({
                ready: rulesSchema(false),
                'load:view': rulesSchema(false)
            }),
            model: jRule.object().keys(function modelKeysSetup() {
                this.required('artifactModel');

                this.onRun(function modelKeysOnRun(tokenContext) {
                    const model = this.params.artifactModel;

                    return {
                        properties: jRule.object().keys(function propertiesKeysSetup() {
                            this.onRun(function propertiesKeysOnRun(tokenContext) => {
                                return reduceToKeys(model.properties, rulesSchema(false));
                            };
                        })
                    };
                });
            }),
            components: jRule.object().keys(function componentsKeysSetup() {
                this.required('components');

                this.onRun(function componentsKeysOnRun(tokenContext) {
                    return _.reduce(this.components, (keys, prop) => {
                        keys[prop] = jRule.object().keys({
                                events: jRule.object().keys(function eventsKeysSetup() {
                                    this.require('events', `component/${prop}/events`);

                                    this.onRun(function eventsKeysOnRun(tokenContext) {
                                        return reduceToKeys(this.params.events, rulesSchema(false));
                                    });
                                })
                            })
                        });

                        return keys;
                    }, {});
                });
            });
        })
    }).required('model', 'presentation');
}

module.exports = buildView;

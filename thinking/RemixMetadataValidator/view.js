const component = rapture.object();

function reduceToKeys(properties, set) {
    return _.reduce(properties, (keys, prop) => {
        keys[prop] = set;

        return keys;
    }, {});
}

function buildView() {
    return rapture.object().keys({
        model: definedModelRule,
        components: rapture.array().min(1).items(component),
        commands: commandsRule,
        rules: rapture.object().keys({
            system: rapture.object().keys({
                ready: rulesSchema(false),
                'load:view': rulesSchema(false)
            }),
            model: rapture.object().keys(function modelKeysSetup() {
                this.required('artifactModel');

                this.onRun(function modelKeysOnRun(tokenContext) {
                    const model = this.params.artifactModel;

                    return {
                        properties: rapture.object().keys(function propertiesKeysSetup() {
                            this.onRun(function propertiesKeysOnRun(tokenContext) => {
                                return reduceToKeys(model.properties, rulesSchema(false));
                            };
                        })
                    };
                });
            }),
            components: rapture.object().keys(function componentsKeysSetup() {
                this.required('components');

                this.onRun(function componentsKeysOnRun(tokenContext) {
                    return _.reduce(this.components, (keys, prop) => {
                        keys[prop] = rapture.object().keys({
                                events: rapture.object().keys(function eventsKeysSetup() {
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

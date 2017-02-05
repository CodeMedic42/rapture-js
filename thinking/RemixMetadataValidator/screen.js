const layoutRule = jRule.object(jRule.scope()).keys({
    view: jRule.string().defined(function viewDefinedSetup() {
        this.onRun(function viewDefinedOnRun(value) {
            return `asset/${value}`;
        });
    }).define('targetView', function viewDefineSetup() {
        this.require('childKeys', function viewDefineTargetSetup() {
            this.require('targetComponent', () => {
                this.require('targetComponentId', () => {
                    this.onRun((value) => {
                        return `asset/${value}/component`;
                    })
                });

                this.onRun(() => {
                    return this.params.targetComponentId;
                });
            });
            this.onRun(function viewDefineTargetOnRun(value) {
                this
                return `asset/${value}/component`;
            });
        });

        this.onRun(function viewDefineOnRun() {
            return this.params.target;
        });
    }),


    children: jRule.object().keys(function childrenKeysSetup() {
        this.require('targetView');
        this.onRun(function childrenKeysOnRun() {

        });
    })
});

"layout": {
    "view": "container",
    "children": {
      "content": {
        "view": "beneficiaries-content"
      }
    }
  },

function buildScreen() {
    return jRule.object().keys({
        model: definedModelRule,
        views: jRule.array().min(1).items(buildAssetRule(true, false)),
        layout: layoutRule
        commands: commandsRule,
        rules: jRule.any()
    }).required('model', 'presentation');
}

module.exports = buildScreen;

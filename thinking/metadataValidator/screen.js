const layoutRule = rapture.object(rapture.scope()).keys({
    view: rapture.string().defined(function viewDefinedSetup() {
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


    children: rapture.object().keys(function childrenKeysSetup() {
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
    return rapture.object().keys({
        model: definedModelRule,
        views: rapture.array().min(1).items(buildAssetRule(true, false)),
        layout: layoutRule
        commands: commandsRule,
        rules: rapture.any()
    }).required('model', 'presentation');
}

module.exports = buildScreen;

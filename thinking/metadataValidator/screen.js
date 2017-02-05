const Rapture = require('rapture');
const Common = require('./common.js');

const assetBindingTypeRule = Rapture.string().valid('view'))

function buildLayoutKeys(components) {
    return _.reduce(components, (keys, component) => {
        if (component.type == 'core.view') {
            keys[component.id] = Rapture.defer(() => layoutRule);
        }

        return keys;
    }, {});
}

const layoutRule = Rapture.object(Rapture.scope()).keys({
    view: Rapture.string().defined((setupContext) {
        setupContext.onRun((runContext, value) => {
            return `asset/${value}`;
        });
    }).define('targetViewComponents', null, (targetViewComponentsSetup) {
        targetViewComponentsSetup.require('assetComponents', (assetComponentsSetup) => {
            assetComponentsSetup.require('assetBindingId', (assetBindingIdSetup) {
              assetBindingIdSetup.onRun((assetBindingIDRun, value) {
                  return `asset/${value}/bindingId`;
              });
            });

            assetComponentsSetup.onRun((assetComponentsRun) => {
                return `${assetComponentsRun.params.assetBindingId}/components`
            });
        });

        targetViewComponentsSetup.onRun((targetViewComponentsRun) => {
            return targetViewComponentsRun.params.assetComponents;
        }),
    }),
    children: Rapture.object().keys((keysSetup) => {
        keysSetup.require('targetViewComponents');

        keysSetup.onRun((keysRun) {
            keysRun.params.targetViewComponents.onChange((components) => {
                keysRun.set(buildLayoutKeys(components));
            });

            return buildLayoutKeys(keysRun.params.targetViewComponents);
        });
    })
});

function buildScreen() {
    return Rapture.object().keys({
        model: Common.buildModel(),
        views: Rapture.array().min(1).items(buildAssetRule(true, false, assetBindingTypeRule)),
        layout: layoutRule
        commands: Common.buildCommandsRule(),
        rules: Rapture.any()
    }).required('model', 'views');
}

module.exports = buildScreen;

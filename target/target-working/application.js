const Rapture = require('rapture');
const Common = require('./common.js');

function buildArtifactRefRule(type) {
    return Rapture.object().keys({
        id: Rapture.string().defined((setupContext) => {
            setupContext.onRun((runContext, value) => {
                return `${type}/${value}`
            });
        })
    }).required('id');
}

const routingRule = Rapture.object(Rapture.scope()).keys({
    routes: Rapture.array().min(1).items(Rapture.object().keys({
        id: Rapture.string().min(1).define((setupContext) => {
            setupContext.onRun((runContext, value) => {
                return `route/${value}`;
            });
        }, 'artifact', (setupContext) => {
            setupContext.require('routeDef');
            setupContext.onRun((runContext) => {
                return runContext.params.routeDef;
            });
        }));
        route: Rapture.string().allow('')
        path: Rapture.array().items(Rapture.string().allow(''))
    }).require('id', 'route', 'path').define('routeDef'),
});

const assetBindingTypeRule = Rapture.string().valid('workflow', 'status'))

function buildApplication() {
    return Rapture.object().keys({
        workflows: Rapture.array().items(buildArtifactRefRule('workflow')),
        statuses: Rapture.array().items(buildArtifactRefRule('status')),
        screens: Rapture.array().items(buildArtifactRefRule('screen')),
        views: Rapture.array().items(buildArtifactRefRule('view')),
        root: Common.buildAssetRule(false, false, assetBindingTypeRule),
        routing: routingRule
    }).required('workflows', 'statuses', 'screens', 'views', 'root', 'routing');
}

module.exports = buildApplication;

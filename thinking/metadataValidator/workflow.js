const common = require('./common.js');

const routesRule = rapture.array().min(1).items(rapture.object().keys({
    route: rapture.string().allow('').define((setupContext) => {
        setupContext.onRun((runContext, routeValue) => {
            return `route/${routeValue}`;
        });
    }),
    expression: rulesSchema(false).allow(null),
    state: rapture.string().defined((setupContext) => {
        setupContext.onRun((runContext, stateValue) => {
            return `asset/${stateValue}`;
        });
    })
}).required('route', 'state'));

const redirectsRule = rapture.array().items(
    rapture.object().keys({
        condition: Schemas.ConditionSchema,
        route: rapture.string().defined((setupContext) => {
            setupContext.onRun((runContext, routeValue) => {
                return `route/${routeValue}`;
            });
        })
    }).required('route', 'condition');
);

function buildWorkflow() {
    return rapture.object().keys({
        model: common.buildModel(),
        type: rapture.string().valid('presentation', 'process').define('workflowType', 'artifact'),
        states: rapture.array().min(1).items(common.buildAssetRule(true, true)),
        routes: routesRule,
        start: rapture.string().defined((setupContext) => {
            setupContext.onRun((runContext, startValue) => {
                return `route/${startValue}`
            });
        }
        redirect: redirectsRule,
        commands: commandsRule,
        rules: rapture.any()
    }).required('model', 'type', 'states', 'start', 'routes');
}

module.exports = buildWorkflow;

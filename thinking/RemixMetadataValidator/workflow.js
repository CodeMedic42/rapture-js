const common = require('./common.js');

const routesRule = jRule.array().min(1).items(jRule.object().keys({
    route: jRule.string().allow('').define((setupContext) => {
        setupContext.onRun((runContext, routeValue) => {
            return `route/${routeValue}`;
        });
    }),
    expression: rulesSchema(false).allow(null),
    state: jRule.string().defined((setupContext) => {
        setupContext.onRun((runContext, stateValue) => {
            return `asset/${stateValue}`;
        });
    })
}).required('route', 'state'));

const redirectsRule = jRule.array().items(
    jRule.object().keys({
        condition: Schemas.ConditionSchema,
        route: jRule.string().defined((setupContext) => {
            setupContext.onRun((runContext, routeValue) => {
                return `route/${routeValue}`;
            });
        })
    }).required('route', 'condition');
);

function buildWorkflow() {
    return jRule.object().keys({
        model: common.buildModel(),
        type: jRule.string().valid('presentation', 'process').define('workflowType', 'artifact'),
        states: jRule.array().min(1).items(common.buildAssetRule(true, true)),
        routes: routesRule,
        start: jRule.string().defined((setupContext) => {
            setupContext.onRun((runContext, startValue) => {
                return `route/${startValue}`
            });
        }
        redirect: redirectsRule,
        commands: commandsRule,
        rules: jRule.any()
    }).required('model', 'type', 'states', 'start', 'routes');
}

module.exports = buildWorkflow;

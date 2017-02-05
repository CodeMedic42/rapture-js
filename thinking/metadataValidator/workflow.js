const Rapture = require('rapture');
const Common = require('./common.js');

const routesRule = Rapture.array().min(1).items(Rapture.object().keys({
    route: Rapture.string().allow('').define((setupContext) => {
        setupContext.onRun((runContext, routeValue) => {
            return `route/${routeValue}`;
        });
    }),
    expression: rulesSchema(false).allow(null),
    state: Rapture.string().defined((setupContext) => {
        setupContext.onRun((runContext, stateValue) => {
            return `asset/${stateValue}`;
        });
    })
}).required('route', 'state'));

const redirectsRule = Rapture.array().items(
    Rapture.object().keys({
        condition: Schemas.ConditionSchema,
        route: Rapture.string().defined((setupContext) => {
            setupContext.onRun((runContext, routeValue) => {
                return `route/${routeValue}`;
            });
        })
    }).required('route', 'condition');
);

function checkWorkflowType(expectedType) {
   return (setupContext) => {
      setupContext.require('workflowType');
      setupContext.onRun((runContext) => {
         return runContext.params.workflowType === expectedType;
      })
   }
}

const assetBindingTypeRule = Rapture.string()
   .if(checkWorkflowType('process'), Rapture.string().valid('workflow', 'status'))
   .elseIf(checkWorkflowType('presentation'), Rapture.string().valid('workflow', 'screen'))

function buildWorkflow() {
    return Rapture.object().keys({
        model: Common.buildModel(),
        type: Rapture.string().valid('presentation', 'process').define('workflowType', 'artifact'),
        states: Rapture.array().min(1).items(Common.buildAssetRule(true, true, assetBindingTypeRule)),
        routes: routesRule,
        start: Rapture.string().defined((setupContext) => {
            setupContext.onRun((runContext, startValue) => {
                return `route/${startValue}`
            });
        }
        redirect: redirectsRule,
        commands: Common.buildCommandsRule(),
        rules: Rapture.any()
    }).required('model', 'type', 'states', 'start', 'routes');
}

module.exports = buildWorkflow;

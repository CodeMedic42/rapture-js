const Rapture = require('rapture');
const Common = require('./common.js');

const assetBindingTypeRule = Rapture.string().valid('workflow', 'screen'));

function buildStatus() {
    return Rapture.object().keys({
        model: Common.buildModel(),
        presentation: buildAssetRule(true, false, assetBindingTypeRule),
        commands: Common.buildCommandsRule(),
        rules: Rapture.any()
    }).required('model', 'presentation');
}

module.exports = buildStatus;

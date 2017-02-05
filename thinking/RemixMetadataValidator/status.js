function buildStatus() {
    return jRule.object().keys({
        model: definedModelRule,
        presentation: buildAssetRule(true, false),
        commands: commandsRule,
        rules: jRule.any()
    }).required('model', 'presentation');
}

module.exports = buildStatus;

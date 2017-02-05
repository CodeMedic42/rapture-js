function buildStatus() {
    return rapture.object().keys({
        model: definedModelRule,
        presentation: buildAssetRule(true, false),
        commands: commandsRule,
        rules: rapture.any()
    }).required('model', 'presentation');
}

module.exports = buildStatus;

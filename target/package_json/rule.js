const Rapture = require('../../src');

module.exports = Rapture.object().keys({
    name: Rapture.string().min(1).max(214)
    .custom((set) => {
        set.options({
            onFaultChange: true
        });
        set.onRun((control, contents) => {
            if (contents[0] === '.' || contents[0] === '_') {
                control.raise('schema', 'Cannot start with "." or "_".', 'error');
            } else if (!contents.match(/^[a-z\d._~-]*$/)) {
                control.raise('schema', 'Cannot have uppercase or non-URL-safe characters', 'error');
            } else {
                control.raise();
            }
        });
    }),
    version: Rapture.version(),
    description: Rapture.string(),
    main: Rapture.string(),
    scripts: Rapture.object(),
    author: Rapture.string(),
    license: Rapture.string(),
    dependencies: Rapture.object(),
    devDependencies: Rapture.object()
}).required('name', 'version');

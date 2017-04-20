Living and Breathing
multi artifact knowledge
custom run time logic

// Sen A
// All keys allowed
Rapture.object();

// Sen B
// All keys allowed
Rapture.object().keys();

// Sen C
// No keys allowed
Rapture.object().keys({});

// Sen D
// Only "foo" is allowed    
Rapture.object().keys({}).keys({
    foo: Rapture.string()
});

// If keys is never registered What happens?
// Are all keys allowed? Yes, because If we assume this is happen as a second set of keys like in Sen D we do not want to add to what is already existing. Plus also we plan on raising a warning that keys does not exist.
// Are no keys allowed? No
Rapture.object().keys((setupContext) => {
    setupContext.require('keys');

    setupContext.onRun((control, contents, current, params) => {
        return params.keys;
    });
});

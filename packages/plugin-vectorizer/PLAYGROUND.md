
Define feature flags 

Feature Enabled 
Feature Permissions 





```JS 
// define 
feature.register('featureName')
feature.unregister('featureName')

// if the feature does not exist it always evaluates to flse
feature.setEnabled('featureName', true)
feature.setEnabled('featureName', false)
feature.setEnabled('featureName', (context) => { return true
});

feature.setPermission('featureName', (context) => { return true;
})
feature.setPermission('featureName', (context) => { return true;
})
feature.setPermission('featureName', (context) => { return true;
})

feature.setSupported('featureName', (context) => { return true
})

feature.can(featureName, context) {
    if (!this.isSupported(featureName)) return;
    if (!this.isAllowed(featureName)) return;
    if (!this.isEnabled(featureName)) return;
}

```


```JS
    // check if simd is suppored 
feature.register("simd");
feature.setEnabled("simd", (ctx) => {
    if (feature.canUse("browser", ctx))
        return (typeof SIMD !== "undefined");
    });


```

feature.isEnabled



# Example share featur
```JS

// we can register a unique identifier that has potentially dependencies to other features
feature.register("my.command", (ctx) => {}, ["fill", {"opt": { optional: true}}])


// the integrator
feature.setPermission("share.dialog", (ctx) => {})
feature.setEnabled("share.dialog", (ctx) => {})

// register dependecy that also need to be checked

// can will check if the feature and the dependencies are met 

if (feature.can("my.command",ctx)) {
    feature.run("my.command", args, ctx)
}

feature
    .try("my.command")?
    .run(args, ctx)

feature.wrap(func, ["feature"]) {
    return () => {
        // check features
        return T | undefined
    }
}


```


```JS

// only run when imgly scope img.ly arrange is set and whatever is in there evaluates to true
feature.register("vectorize", ctx => {
    if (ctx.blockIds) // do some checks on the thing
}, ["imgly.arrange", "imgly.block.setPositionX"]) 


function vectorize(image) {
    
}

export const vectorize = feature.wrap(vectorize, ["vectorize"])

//Vectorize will only run if feature is enabled 


feature.setPermission("vectorize", "deny") // no one will be able to run it
feature.setEnabled("vectorize", true)


// checkout cancancan

FEATURES/PERMISSIONS/SCOPES
// checkout Abilities
// results = Allow
class Abilities {
    
    #permission = Map() // featureName -> (func: boolean) | boolean
    #enabled = Map() // featureName -> (func: boolean) | boolean
    #definition = Map() // featureName -> (func: boolean) | boolean
    #dependencies = Map() // featureName -> (func: boolean) | boolean


    // all need allow, defer, deny

    can(featureName, ctx) => {
        if (this.#enabled[featureName] && (!this.#enabled[featureName]?.(ctx))) return false;
        if (this.#enabled[featureName] && (!this.#permission[featureName]?.(ctx)())) return false;
        if (this.#enabled[featureName] && (!this.#definition[featureName]?.(ctx)())() return false;
        // when decision s deferred to this feature then don't care
        // when deicison is false
        const deps = this.dependencies[featureName]?? []
        if (!deps.every(dep => this.isEnabled(dep, ctx))) return false
        return true
    }
   
}


abilities.define("read", {blockIds} => {
    if (!blockIds)
})

abilities.can("read", {blockIds})

abilities.define("block.setPositionX", ([id, value] => { 
    if (!id) return "deny"
    // if (!value) we don't care about the value here
// can cehck wether or not to run 
}))
abilities.define("block.setPositionX", ["block.arrange"])

// put a lock in front of setPosition
// this modifies the prototype 
abilities.lock("block.setPositionX", setPosition, Block)


abilities.setPermission("block.setPosition")

block.setPosition.can?(blockId)

block.setPosition.allowed?(BlockId)


block.setPosition?.(blockId, value)
// check feature avaiability else use 
blcok = ability.guard(block) //this will create a proxy to the object with each function being overwritten

if (!block) return
if (!block.setPosition) return
if (!block.getPosition) return
if (!block.value) return


//enabled
//permission
//other


```
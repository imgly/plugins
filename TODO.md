- [ ] How can I list all plugins that are active
- [ ] How can I deactivate a plugin later completely? `enableFeatures`, but this must be per "command". A plugin might contribute multiple features? 
- [ ] we should pass the PluginContext with separate `imgly: {engine?: ImglyEngine, editor?: ImglyEditor, ui?: ImglyUI`
- [ ] We can already establish the name 'imgly"  for the PLUGINS
- [ ] `unstable_getCanvasMenuOrder` should maybe be called `unstable_getCanvasMenuEntries`
- [ ] `unstable_setCanvasMenuOrder` should maybe be called `unstable_setCanvasMenuEntries`
- [ ] `unstable_enableFeatures` what is it used for. the button is not displayed when I check it internally
- [ ] `unstable_enableFeatures` should get the blocks it should evaluate it for. It's not always the selected ones in every scenario.
- [ ] `enable_features` could probably better be named `enableFeatureInContext()`
- [ ] What is the intention of the `builder.Button` first parameter, where is the id used later? 
- [ ] (Exkurs) How can I change the type of a block to another. E.g. Change a Graphic Block into a Group Block for Vectorizer and the ID should stay the same and all properties that are relevant. "Turn into"
- [ ] The separation of ui and engine is sometimes too hard to use. I propose not to make it dependent on initUI and init. But more like lifecycles in general and always pass {ui?, engine, editor}
- [ ] `upload` should maybe be part of the asset sources and/or part of engine

- [ ] `listPanels` function is missing to know which panels exists and are registers
- [ ] `registerComponents` should get `cesdk` and not only `engine` 
- [ ] **Naming correction** 
  - [ ] IMGLY = { ui: IMGLYUI, engine: IMGLYEngine }
  - [ ] CESDK = { ui: CESDKUI, engine: CESDKEngine }
  - Get rid of high level functions maybe
- [ ] SDK should use dynamic import internally to save space and also not load on non supported platforms
- [ ] Commands should be define as should be `func params {context: {engine, ui}, params: any}` 
- [ ] `hasMetadata` should be `hasMetaDataKey` because it's referring to an entry or item not if the whole metadata is existing
- [ ] `lifetime/unsubscribe` is totally missing from plugin apu. E.g. VSCode offers a `subscribe` to register all that need to be called when the plugin is `unloaded`


- [ ] Clarify semantics of `label`, `titel`, and `id`
  - [ ] Label is used for translation  
- it's `block.export` but not `scene.export` as I would expect
- `pages` should have design units
- `pages` should have their type e.g. video vs static
- `docuements` are just groups and as such leverage multi-editing


- How to work with `scopes` and `features`. Can I define custom scopes? Do we handle scopes in `enabledFeature
- There seems to be no API like `findAllScopes()` to enumerate scopes
- Is there an option to add customs scopes. 
- `isEnableFeature` should be evaluated by the UI and the commands already?
- I think scopes 
- `block.ungroup(bId)` should return the Ids of the items in the group
- block has no `getScope` and `setScope` to define the hierarchies. Here is an issue when dealing with hiearchies. We need to have the same thing available as with global scopes
  - Editor : Allow, Defer, Deny
    - Scene: Allow, Defer, Deny
      - Collection: Allow, Defer, Deny
        - Element: Allow, (Defer,) Deny


- `getEffects` api seems unsimilar to all `findAllScopes` etc. Maybe
- `UploadCallbackContext` not found in exports


- `MultiSelection` across multiple pages does not work!!! 
- `Engine disposed` is logged everytime


- `Unsubribe` mechanism. We need to know and be able todo cleanup of commands. E.g. removeCommand and than also cleanup all dependencies
- In VSCode every register function also returns the "unsubscribe" and "free" function. 


- `stroke/join` properties are not exposed it seems if you list all properties
- Default Stroke grey seems not a good choice as default
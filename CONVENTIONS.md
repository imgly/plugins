## Conventions

- all exports from `commands.ts` are treated and registered as commands. The `id` is autogenerated from `${manifest.id}.commands.${exportname}
- commands can be categorized by `_`. As such `block_bringToFront` belong to category `block` 
- id and category can also be manually overwritten in the `manifest` 
- translation keys are the id of the command. use `en.json`
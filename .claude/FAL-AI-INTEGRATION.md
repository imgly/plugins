# CLAUDE.md - Project-Specific Instructions

## Fal.ai Model Integration Process (AUTOMATIC WORKFLOW)

When a user requests to add a new fal.ai model (e.g., "add fal-ai/model-name"), **AUTOMATICALLY EXECUTE ALL STEPS** in sequence:

### AUTOMATIC EXECUTION RULES
⚠️ **CRITICAL**: When you see "add fal-ai/..." or similar request:
1. **DO NOT WAIT** for user confirmation between steps
2. **EXECUTE ALL 3 STEPS** automatically in sequence
3. **ONLY STOP** if an error occurs that requires user input
4. Each agent will output instructions for the next step - **FOLLOW THEM IMMEDIATELY**

### Step 1: Route the Model (AUTOMATIC)
```
IMMEDIATELY use Task tool with:
- subagent_type: "fal-ai-model-router"
- description: "Route model type"
- prompt: "Analyze and route model: [EXACT_MODEL_NAME]"
```

The router outputs: `ROUTE_TO_AGENT: {agent-name}`

### Step 2: Generate Provider (AUTOMATIC - NO PAUSE)
**IMMEDIATELY** after router completes, based on its output:

- If router outputs `ROUTE_TO_AGENT: fal-ai-provider-generator-t2i`:
  ```
  IMMEDIATELY use Task tool with:
  - subagent_type: "fal-ai-provider-generator-t2i"
  - description: "Generate t2i provider"
  - prompt: "Create complete provider implementation for model: [EXACT_MODEL_NAME]"
  ```

- If router outputs `ROUTE_TO_AGENT: fal-ai-provider-generator-i2i`:
  ```
  IMMEDIATELY use Task tool with:
  - subagent_type: "fal-ai-provider-generator-i2i"
  - description: "Generate i2i provider"
  - prompt: "Create complete provider implementation for model: [EXACT_MODEL_NAME]"
  ```

- If router outputs `ROUTE_TO_AGENT: fal-ai-provider-generator-t2v`:
  ```
  IMMEDIATELY use Task tool with:
  - subagent_type: "fal-ai-provider-generator-t2v"
  - description: "Generate t2v provider"
  - prompt: "Create complete provider implementation for model: [EXACT_MODEL_NAME]"
  ```

- If router outputs `ROUTE_TO_AGENT: fal-ai-provider-generator-i2v`:
  ```
  IMMEDIATELY use Task tool with:
  - subagent_type: "fal-ai-provider-generator-i2v"
  - description: "Generate i2v provider"
  - prompt: "Create complete provider implementation for model: [EXACT_MODEL_NAME]"
  ```

### Step 3: Integration Check (AUTOMATIC - NO PAUSE)
**MANDATORY**: The generator ALWAYS ends with `ROUTE_TO_AGENT: pnpm-workflow-fixer`. You MUST **IMMEDIATELY** execute:

```
IMMEDIATELY use Task tool with:
- subagent_type: "pnpm-workflow-fixer"
- description: "Fix integration"
- prompt: "Verify and fix integration for [EXACT_MODEL_NAME]. Ensure provider is added to index.ts and ai-demo.tsx. Run pnpm build to verify."
```

⚠️ **CRITICAL**: Even if you don't see the ROUTE_TO_AGENT output clearly, ALWAYS run pnpm-workflow-fixer after the generator completes. This is NON-NEGOTIABLE.

## WORKFLOW AUTOMATION RULES

1. **TRIGGER WORDS**: When user says "add fal-ai/..." → Start Step 1 IMMEDIATELY
2. **NO PAUSES**: Execute Step 1 → Step 2 → Step 3 without waiting
3. **FOLLOW ROUTING**: Each agent may output `ROUTE_TO_AGENT:` - IMMEDIATELY launch that agent
4. **ERROR HANDLING**: Only pause if an agent reports an error requiring user input
5. **COMPLETION**: After Step 3, report success with a brief summary

## Example Automatic Execution

User: "add fal-ai/imagen4/preview"

You IMMEDIATELY:
1. Launch fal-ai-model-router (no pause)
2. Router outputs → Launch indicated generator (no pause)  
3. Generator completes → Launch pnpm-workflow-fixer (no pause)
4. Report: "✅ Successfully added fal-ai/imagen4/preview"

## Integration Validation

The pnpm-workflow-fixer will automatically:
- Add provider to `/src/fal-ai/index.ts` exports
- Add provider to `ai-demo.tsx` with proper middleware
- Run `pnpm build` to verify no errors
- Fix any integration issues found

## CRITICAL REMINDERS

⚠️ **DO NOT**:
- Ask "Should I proceed?" between steps
- Wait for user confirmation after each agent
- Stop unless there's an actual error
- Skip the pnpm-workflow-fixer step (it's MANDATORY)

✅ **DO**:
- Execute all steps automatically
- Follow `ROUTE_TO_AGENT:` instructions immediately
- ALWAYS run pnpm-workflow-fixer after generator (even if ROUTE_TO_AGENT is unclear)
- Only report final success/failure to user
- Use exact model names in all prompts

## TROUBLESHOOTING

If the workflow stops after Step 2:
- The generator outputs `ROUTE_TO_AGENT: pnpm-workflow-fixer` at the end
- You MUST detect this and immediately launch pnpm-workflow-fixer
- Pattern to watch for: Any text containing "ROUTE_TO_AGENT: pnpm-workflow-fixer"
- This is the MOST COMMON failure point - be vigilant!
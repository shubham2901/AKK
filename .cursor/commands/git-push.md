# Git: commit and push (bash only)

**Cursor custom commands are chat prompts.** To avoid using the model, run one of these yourself (Terminal or Task — not Agent chat):

## Terminal (project root)

Replace the message in quotes:

```bash
npm run git:push -- "YOUR COMMIT MESSAGE"
```

Or:

```bash
bash scripts/git-commit-push.sh "YOUR COMMIT MESSAGE"
```

## VS Code / Cursor Task (prompts for message, no LLM)

1. Command Palette → **Tasks: Run Task**
2. Choose **Git: commit and push**
3. Enter your commit message when prompted

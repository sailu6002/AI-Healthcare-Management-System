# AI Model Project Rules

## Scope

- Work mainly inside the ai-model directory.
- Do not modify frontend, backend, or database files without approval.
- Do not delete existing files unless necessary.

## Git Workflow

- Always run git pull before starting work.
- Check git status before making changes.
- Review changes before committing.
- Use meaningful commit messages.
- Push completed work after testing.

## Code Standards

- Write clean and modular code.
- Keep preprocessing, training, prediction, and recommendation logic separate.
- Do not modify unrelated files.
- Handle errors appropriately.
- Document important functions and model assumptions.

## Machine Learning Rules

- Prevent data leakage.
- Keep training and testing data separate.
- Evaluate models using appropriate metrics.
- Save trained models and preprocessing artifacts properly.
- Keep experiments reproducible where practical.

## Healthcare Safety

- Present model outputs as risk assessments, not confirmed diagnoses.
- Do not claim that a patient definitely has a disease.
- Recommendations should support medical decision-making and not replace a qualified healthcare professional.

## Development Workflow

For every major task:

1. Inspect the relevant existing files.
2. Explain the proposed approach.
3. Create a plan before major implementation.
4. Implement only the approved scope.
5. Test the implementation.
6. Review and summarize the changes.
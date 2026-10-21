# Regression restoration

When the owner says a feature went backward, restore its established behavior before proposing a redesign.

- Find the relevant prior requirements and Git history. Use the owner's last-working time to identify the baseline; record exact commits and timestamps.
- Compare the baseline with the regression and current build. Recover the original controls, state model, persistence, and connected UI behavior together.
- Keep unrelated newer work. Do not roll back the whole site to repair one feature.
- Do not substitute newly invented controls for existing interactions without the owner's request.
- Exercise the actual affected interactions and saved-state reload. Run required deployment checks.
- Report deployment status separately from authenticated browser verification. Never describe untested signed-in behavior as verified.

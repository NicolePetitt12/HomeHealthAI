# Security Cleanup
## Removed
Removed an obfuscated JavaScript payload appended to eslint.config.mjs after the intended ESLint configuration.
The removed payload included the requested indicators global['!'] and _$_1e42.
The payload also assigned require/module into global and contained a large shuffled/minified execution blob appended to the config file.
Replaced eslint.config.mjs with the minimal intended ESLint configuration only.
Repository scan performed
Scanned 190 text-like repository files from the main branch.
Searched for:global['!']
_$_1e42
global['_V']
JavaScript eval / Function constructor patterns
unexpected global assignments to require or module
large minified lines appended to config-like files

Only eslint.config.mjs matched the malicious appended-payload indicators.
Two Function matches were reviewed as false positives in SQL/database documentation for PostgreSQL functions.
Validation
No npm install, npm scripts, lint, test, build, or repository scripts were run.
No app behavior changes are intended beyond removing the suspicious injected ESLint config payload.
Manual follow-up needed
Create a branch and pull request with only eslint.config.mjs and this SECURITY_CLEANUP.md.
Review repository history to identify when the payload was introduced.
Rotate any credentials that may have been exposed on machines or CI environments that ran the infected config.
Reinstall dependencies from a trusted lockfile/source on any affected machines.
Review GitHub app and branch permissions; this cleanup could not be pushed from the current environment because the GitHub integration returned 403 Resource not accessible by integration when creating or updating refs.

# Agent name here

## Types of changes

What types of changes does your code introduce?
_Put an `x` in the boxes that apply_

- [ ] New Agent
- [ ] Fix an agent error
- [ ] Update an agent logic/test/documentation
- [ ] Code style update (formatting, renaming)
- [ ] Other (please describe):

## New Agent PR readiness

- [ ] `npm install` command works (i.e. package-lock is updated properly)
- [ ] The `name` and `description` fields of `package.json` describe the agent properly
- [ ] All the libraries listed in `package.json` are being used
- [ ] All the development libraries are in `devDependencies` section of `package.json`
- [ ] The agent README is updated
- [ ] The agent README sufficiently describes what the agent does
- [ ] All the alerts that the agent emits are listed in the README
- [ ] The txn/block examples listed in the README generate the expected findings
- [ ] Code is easy to follow and/or properly commented
- [ ] Agent contains tests
- [ ] All tests pass when running `npm test`
- [ ] Tests are not making real network calls (i.e. network interaction is properly mocked)
- [ ] Tests cover all the paths (i.e. negative & positive test cases)
- [ ] When the tests complete, no warning/errors are shown
- [ ] `npm start` works without errors when executed using a jsonRpcUrl for each of the networks specified in the README
- [ ] The networks specified in the README and the networks are listed in the `package.json` are the same
- [ ] The code does what the README describes
- [ ] Network calls are properly being cached (if duplicated calls can occur)
- [ ] A performance review has been done (e.g. `Promise.all` is used whenever possible)
- [ ] The findings fields are filled out correctly
- [ ] Findings `protocol` is specified (if the agent is for a specific one)
- [ ] `metadata` of the findings contains all the information needed.
- [ ] The SDK methods are being used appropriately (e.g. `filterLog`, `filterFunction`, `getEthersProvider`)
- [ ] `ABI`s match the contracts used / `args` used from `LogDescriptions` exists in the `ABI`s
- [ ] The agent follows Forta recommended [best practices](https://docs.forta.network/en/latest/best-practices/)
- [ ] Agent can recover from failed error calls when they can fail (e.g. errors are being caught on calls that can fail)
- [ ] `repository` is added in the `package.json`

## Comments (optional)

If there is some useful information or important note for reviewing/understanding this agent please describe it here.

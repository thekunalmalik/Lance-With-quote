# Deployed Addresses

## Local Ganache Network (5777)

### Fixed Deployment (April 10, 2026)
- **Projects**: 0x30BF41d5E78a8Ea3779474450C782203Cda3636a
- **RequestManager**: 0x7DC9f3509aD5079B82C12D7B32075db5eE868b57

**Changes in this deployment:**
- Removed `projectsContract.closeProject()` call from `acceptQuotation()` and `acceptRequest()`
- This fixes the authorization error: "Only the employer can close this project"
- Projects close automatically when quotation is accepted or request is fulfilled

### Previous Ropsten Deployment

[0xe00145e22b21d4eecA656b1FeAaF5e878c18B318](https://ropsten.etherscan.io/address/0xe00145e22b21d4eecA656b1FeAaF5e878c18B318)


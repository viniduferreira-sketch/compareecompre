// Runs independently of the importer, including after workflow cancellation.
const endpoint=process.env.AWIN_IMPORT_ENDPOINT;
if(!endpoint||new URL(endpoint).protocol!=='https:')throw new Error('Configure published endpoint.');
const identity=await fetch(`${process.env.ACTIONS_ID_TOKEN_REQUEST_URL}&audience=compareecompre-awin-import`,{headers:{Authorization:`Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}`},signal:AbortSignal.timeout(15000)});
if(!identity.ok)throw new Error(`GitHub identity failed (HTTP ${identity.status}).`);
const {value}=await identity.json();
const conclusion=['success','cancelled'].includes(process.env.AWIN_JOB_STATUS)?process.env.AWIN_JOB_STATUS:'failure';
const response=await fetch(endpoint,{method:'POST',headers:{Authorization:`Bearer ${value}`,'Content-Type':'application/json'},body:JSON.stringify({action:'workflowEnd',conclusion,...(process.env.AWIN_IMPORT_ID?{importId:process.env.AWIN_IMPORT_ID}:{})}),signal:AbortSignal.timeout(20000)});
if(!response.ok)throw new Error(`Awin final status failed (HTTP ${response.status}).`);
console.info('Awin workflow final status recorded.');
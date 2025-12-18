// **********************************************************************************
// CONSTANTS
// **********************************************************************************

const testAuditResultsMap = new Map()

// const 
// const createFlakyTestAuditHtmlReport = (spec, testAuditResults) => {
//     const auditReportName = spec.name

//     return `
// <!doctype html>
// <html>
//   <head>
//     <title>Flaky Test Audit Report Suite - ${spec.fileName}</title>

//     <style>
//       body,
//       html {
//         font-family: arial, sans-serif;
//         font-size: 11pt;
//       }

//       #visualization {
//         box-sizing: border-box;
//         width: 100%;
//         height: 300px;
//       }
//     </style>
//         <!-- note: moment.js must be loaded before vis-timeline-graph2d or the embedded version of moment.js is used -->
//     <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.24.0/moment.min.js"></script>

//     <script src="https://unpkg.com/vis-timeline@latest/standalone/umd/vis-timeline-graph2d.min.js"></script>
//     <link
//       href=".https://unpkg.com/vis-timeline@latesthttps://unpkg.com/vis-timeline@latest/styles/vis-timeline-graph2d.min.css"
//       rel="stylesheet"
//       type="text/css"
//     />
//   </head>
//   <body>
//     <h1>Flaky Test Audit Report - ${spec.fileName}</h1>
//     <div>Suite: ${spec.relative}</div>
//     <div>Number of tests executed${spec.name}</div>
//   </body>
// </html>
// `
// }

// **********************************************************************************
// PUBLIC FUNCTIONS
// **********************************************************************************

const createSuiteAuditHtmlReport = (spec, testAuditResults) => {
    console.log('------------------------------------------------------------- createFlakyTestAuditReport')
    console.log(spec)
    console.log(testAuditResults)


}


// **********************************************************************************
// PRIVATE FUNCTIONS
// **********************************************************************************



export default {
    createSuiteAuditHtmlReport,
}
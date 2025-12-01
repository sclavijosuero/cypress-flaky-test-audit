const addFlakyTestAuditTasks = (on) => {

    on("task", {

        displayTestDataInTerminal(testData) {
            console.log(testData)
            return null;
        },

        displayListInTerminal(list) {
            console.log(list.join('\n'))
            return null;
        },

        displayTableInTerminal(table) {
            console.table(table)
            return null;
        }
    })
}

module.exports = addFlakyTestAuditTasks;
const addFlakyTestAuditTasks = (on) => {

    on("task", {

        "displayStringTerminal": (str)=> {
            console.log(str)
            return null;
        },

        "displayTableTerminal": (table) => {
            console.table(table)
            return null;
        }
    })
}

module.exports = addFlakyTestAuditTasks;
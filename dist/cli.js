#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander = require("commander");
const main_1 = require("./main");
const inquirer = require("inquirer");
const moment = require("moment");
let eventHandler = new main_1.default();
let newEvent;
eventHandler.onReady(() => {
    const program = new commander.Command();
    program
        .version('0.0.1')
        .name('howLong')
        .usage('[keyword]')
        .arguments('[keyword]')
        .option('-f, --full', 'full message')
        .option('-a, --add', 'add event')
        .option('-u, --update', 'update event')
        .option('-d, --delete', 'delete event')
        .action(function (keyword) {
        // if(keyword){
        eventHandler.findItemsAndPrint(keyword);
        // }
    });
    program.parse(process.argv);
    if (program.add) {
        promptAdd(eventHandler)
            .then(item => {
            handleAdd(eventHandler, item);
        });
    }
    if (program.delete) {
        chooseEvent(eventHandler)
            .then(event => {
            console.log(`Event: ${event} will be delete`);
            promptConfirm()
                .then(() => {
                handleDelete(eventHandler, event);
            })
                .catch(e => console.log(e));
        });
    }
    if (program.update) {
        chooseEvent(eventHandler)
            .then(oldEvent => {
            console.log('Now input one new event');
            promptAdd(eventHandler, [getEventName(oldEvent)])
                .then(newItem => {
                const newEvent = newItem.event + '-' + newItem.date;
                handleUpdate(eventHandler, newEvent, oldEvent);
            });
        })
            .catch(e => console.log(e));
    }
});
// escapeList: a list of needn't check events
function promptAdd(handler, escapeList = []) {
    return new Promise((resolve, reject) => {
        const questions = [
            {
                type: 'input',
                name: 'event',
                message: "What happen …… :",
                validate: function (value) {
                    console.log(escapeList);
                    console.log(value);
                    return !escapeList.includes(value) && handler.checkHasExit(value)
                        ? 'Event has exit!'
                        : true;
                }
            },
            {
                type: 'input',
                name: 'date',
                message: "Happen when …… :",
                default: function () {
                    return moment(new Date()).format('YYYY/MM/DD');
                },
            },
        ];
        inquirer.prompt(questions).then((answers) => {
            console.log('Event will be add: ');
            newEvent = answers;
            console.log(JSON.stringify(newEvent, null, '  '));
            promptConfirm()
                .then(() => resolve(newEvent))
                .catch(e => reject(e));
        });
    });
}
function chooseEvent(handler) {
    return new Promise((resolve, reject) => {
        const questions = [
            {
                type: 'input',
                name: 'keyword',
                message: "Input a keyword: ",
            },
        ];
        inquirer.prompt(questions)
            .then((answers) => {
            const { keyword } = answers;
            const items = handler.findItems(keyword);
            inquirer
                .prompt([
                {
                    type: 'list',
                    name: 'event',
                    message: 'Choose one event to update',
                    choices: items.map(item => item.event + '-' + item.date)
                },
            ])
                .then((answers) => {
                resolve(answers.event);
            })
                .catch(e => reject(e));
        });
    });
}
function promptConfirm() {
    const questions = [
        {
            type: 'input',
            name: 'confirm',
            message: "Are you sure ? (Y/N)",
            validate: function (value) {
                if (['y', 'n'].includes(value.toLowerCase().trim())) {
                    return true;
                }
                return 'Please enter Y or N';
            },
        },
    ];
    return new Promise((resolve, reject) => {
        inquirer.prompt(questions)
            .then((answers) => {
            answers.confirm.toLowerCase().trim() === 'y'
                ? resolve()
                : reject();
        })
            .catch(e => reject(e));
    });
}
function handleAdd(handler, item) {
    const { event, date } = item;
    handler.addEvent(event, date);
    console.log('Add completely!!!');
}
function handleDelete(handler, item) {
    handler.deleteEvent(item);
    console.log('Delete completely!!!');
}
function handleUpdate(handler, newEvent, oldEvent) {
    handler.updateEvent(newEvent, oldEvent);
    console.log(`${oldEvent} has update to ${newEvent} completely!!!`);
}
function getEventName(event) {
    return event.split('-')[0];
}
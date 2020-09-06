#!/usr/bin/env node
import * as commander from 'commander'
import EventHandler, { EventItem } from './main'
import * as inquirer from 'inquirer'
import * as moment from 'moment'

let handler = new EventHandler()
let newEvent: EventItem

handler.onReady(() => {
  const program = new commander.Command()

  program
    .version('0.0.2')
    .name('longago')
    .usage('[keyword]')
    .arguments('[keyword]')
    .option('-f, --full', 'full message')
    .option('-a, --add', 'add event')
    .option('-u, --update', 'update event')
    .option('-d, --delete', 'delete event')
    .action(function (keyword) {
      // if(keyword){
        // common search and print
        handler.findItemsAndPrint(keyword)
      // }
    });

  program.parse(process.argv)

  if(program.add) {
    promptNewEvent()
    .then(item => {
      handleAdd(item)
    })
  }

  if(program.delete) {
    chooseEvent()
      .then(event => {
        console.log(`Event: ${event} will be delete`)

        promptConfirm()
        .then(() => {
          handleDelete(event)
        })
        .catch(e => console.log(e))
      })
  }

  if(program.update) {
    chooseEvent()
      .then( oldEvent => {
        console.log('Now input one new event')

        promptNewEvent([getEventName(oldEvent)])
          .then(newItem => {
            const newEvent = newItem.event + '-' + newItem.date
            handleUpdate(newEvent, oldEvent)
          })
      })
      .catch(e => console.log(e))
  }
})

// escapeList: a list of needn't check events name(without date message)
function promptNewEvent( escapeList: string[] = []): Promise<EventItem> {
  return new Promise((resolve, reject) => {
    const questions = [
      {
        type: 'input',
        name: 'event',
        message: "What happen …… :",
        validate: function(value: string) {
          return !escapeList.includes(value) && handler.checkHasExit(value)
          ? 'Event has exit!'
          : true
        }
      },
      {
        type: 'input',
        name: 'date',
        message: "Happen when …… :",
        default: function () {
          return moment(new Date()).format('YYYY/MM/DD')
        },
      },
    ];
    
    inquirer.prompt(questions).then((answers) => {
      console.log('Event will be add: ')
      newEvent = answers
      console.log(JSON.stringify(newEvent, null, '  '));

      promptConfirm()
        .then(() => resolve(newEvent))
        .catch(e => reject(e))
    });
  })
}

// ask user to choose one event
function chooseEvent(): Promise<string>{
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
      const {keyword} = answers
      const items = handler.findItems(keyword)
    
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
          resolve(answers.event)
        })
        .catch(e => reject(e))
    })
  })
}

function promptConfirm(): Promise<void>{
  const questions = [
    {
      type: 'input',
      name: 'confirm',
      message: "Are you sure ? (Y/N)",
      validate: function (value: string) {
        if(['y', 'n'].includes(value.toLowerCase().trim())) {
          return true
        }
        return 'Please enter Y or N';
      },
    },
  ]

  return new Promise((resolve, reject) => {
    inquirer.prompt(questions)
    .then((answers) => {
      answers.confirm.toLowerCase().trim() === 'y'
        ? resolve()
        : reject()
    })
    .catch(e => reject(e))
  })
}

function handleAdd( item: EventItem){
  const {event, date} = item
  handler.addEvent(event, date)
  console.log('Add completely!!!')
}

function handleDelete( item: string){
  handler.deleteEvent(item)
  console.log('Delete completely!!!')
}

function handleUpdate( newEvent: string, oldEvent: string){
  handler.updateEvent(newEvent, oldEvent)
  console.log(`${oldEvent} has update to ${newEvent} completely!!!`)
}

function getEventName(event: string){
  return event.split('-')[0]
}
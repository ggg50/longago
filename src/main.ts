import * as fs from 'fs'
const homedir = require('os').homedir() 
const home = process.env.HOME || homedir 
const p = require('path')
const fullPath = p.join(home, 'data/base.md') 

export interface EventItem {
  event: string
  date: string
}

export default class EventHandler {
  // public text: string = ''
  public innerText: string = ''
  public eventList: EventItem[] = []
  public eventNameList: string[] = []
  public readyFn: Function = () => {}
  public hasInit: boolean = false

  constructor(){
    this.init()
  }

  get text(){
    return this.innerText
  }

  set text(value: string){
    this.parseText()
    this.innerText = value
  }

  public init(){
    this.innerReadFile()
    .then(data => {
      this.text = data
      
      this.hasInit = true
      this.readyFn()
    })
    .catch(e => console.log(e))
  }

  public findItemsAndPrint(keyword: string){
    this.findItems(keyword).forEach(this.printEvent)
  }

  public parseText(){
    this.eventList =  this.text.split('\n').map(item => {
      const [event, date] = item.split('-')
      return {event, date}
    })
    this.eventNameList = this.eventList.map(item => item.event)
  }

  public checkHasExit(event: string){
    return this.eventNameList.includes(event)
  }

  public updateEvent(newEvent: string, oldEvent: string){
    this.deleteEvent(oldEvent)
    this.addEvent(newEvent)
  }

  public deleteEvent(text: string, date?: string) {
    this.text = date
      ? this.text.replace(new RegExp(text + '-' + date + '\n?'), '')
      : this.text.replace(new RegExp(text + '\n?'), '')

    this.innerWriteFile()
  }

  // text: can be 'event-date' or 'event' and 'date'
  public addEvent(text: string, date?: string){
    this.text = date 
      ? this.text + '\n' + text + '-' + date
      : this.text + '\n' + text

    this.innerWriteFile()
  }

  public innerReadFile(): Promise<string>{
    return new Promise((resolve, reject) => {
      fs.readFile(fullPath, "utf8", (err, d) => {
        if(err) reject(err)
        this.text = d
        resolve(d)
      })
    })
  }

  public innerWriteFile() {
    fs.writeFileSync(fullPath, this.text)
  }

  public findItems(keyword: string): EventItem[]{
    return this.eventList.filter(item => {
      return item.event.indexOf(keyword) > -1
    })
  }

  // 读取后才执行
  public onReady(fn: Function) {
    if(this.hasInit) {
      fn.call(this)
    } else {
      this.readyFn = fn
    }
  }
  
  // text: event-date
  public printEvent(text: string | EventItem) {
    let event: string, date: string

    if(typeof text === 'string') {
      const [event1, date1] = text.split('-')
      event = event1
      date = date1
    } else {
      const {event: event2, date: date2} = text
      event = event2
      date = date2
    }

    if(/\d{8}.test(date)/) date = date.replace(/(\d{4})(\d{2})(\d{2})/, '$1/$2/$3')
    const time = new Date(date).getTime()
    const now = new Date().getTime()
    const distance = now - time
  
    const year = Math.floor(distance / 31536000000)
    const day = Math.ceil((distance - 31536000000 * year) / 86400000)
    const totalDay = Math.ceil(distance / 86400000)
    console.log('-'.repeat(20))
    console.log(`事件: ${event}`)
    console.log(`时间: ${date}`)
    console.log(`距今: ${year > 0 ? year + '年' : ''}${day} 天 (总计 ${totalDay} 天)`)
  }
}

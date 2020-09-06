"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const homedir = require('os').homedir();
const home = process.env.HOME || homedir;
const p = require('path');
const fullPath = p.join(home, 'data/base.md');
class EventHandler {
    constructor() {
        // public text: string = ''
        this.innerText = '';
        this.eventList = [];
        this.eventNameList = [];
        this.readyFn = () => { };
        this.hasInit = false;
        this.init();
    }
    get text() {
        return this.innerText;
    }
    set text(value) {
        this.innerText = value;
        this.parseText();
        this.innerWriteFile();
    }
    init() {
        this.innerReadFile()
            .then(data => {
            this.text = data;
            this.hasInit = true;
            this.readyFn();
        })
            .catch(e => console.log(e));
    }
    findItemsAndPrint(keyword) {
        this.findItems(keyword).forEach(this.printEvent);
    }
    parseText() {
        this.eventList = this.text.split('\n').map(item => {
            const [event, date] = item.split('-');
            return { event, date };
        });
        this.eventNameList = this.eventList.map(item => item.event);
    }
    checkHasExit(event) {
        return this.eventNameList.includes(event);
    }
    updateEvent(newEvent, oldEvent) {
        this.deleteEvent(oldEvent);
        this.addEvent(newEvent);
    }
    deleteEvent(text, date) {
        this.text = date
            ? this.text.replace(new RegExp(text + '-' + date + '\n?'), '')
            : this.text.replace(new RegExp(text + '\n?'), '');
    }
    // text: can be 'event-date' or 'event' and 'date'
    addEvent(text, date) {
        this.text = date
            ? this.text + '\n' + text + '-' + date
            : this.text + '\n' + text;
    }
    innerReadFile() {
        return new Promise((resolve, reject) => {
            fs.readFile(fullPath, "utf8", (err, d) => {
                if (err)
                    reject(err);
                this.text = d;
                resolve(d);
            });
        });
    }
    innerWriteFile() {
        fs.writeFileSync(fullPath, this.text);
    }
    findItems(keyword) {
        return this.eventList.filter(item => {
            return item.event.indexOf(keyword) > -1;
        });
    }
    // 读取后才执行
    onReady(fn) {
        if (this.hasInit) {
            fn.call(this);
        }
        else {
            this.readyFn = fn;
        }
    }
    // text: event-date
    printEvent(text) {
        let event, date;
        if (typeof text === 'string') {
            const [event1, date1] = text.split('-');
            event = event1;
            date = date1;
        }
        else {
            const { event: event2, date: date2 } = text;
            event = event2;
            date = date2;
        }
        if (/\d{8}.test(date)/)
            date = date.replace(/(\d{4})(\d{2})(\d{2})/, '$1/$2/$3');
        const time = new Date(date).getTime();
        const now = new Date().getTime();
        const distance = now - time;
        const year = Math.floor(distance / 31536000000);
        const day = Math.ceil((distance - 31536000000 * year) / 86400000);
        const totalDay = Math.ceil(distance / 86400000);
        console.log('-'.repeat(20));
        console.log(`事件: ${event}`);
        console.log(`时间: ${date}`);
        console.log(`距今: ${year > 0 ? year + '年' : ''}${day} 天 (总计 ${totalDay} 天)`);
    }
}
exports.default = EventHandler;

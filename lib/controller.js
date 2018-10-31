
/* IMPORTS */

const cluster = require('cluster');
const cores   = require('os').cpus().length;
const EventEmitter   = require('events');
const path = require('path');

let self;  // Share memory between callback

/**
 *
 * Provides high-level tools to manage the worker cluster
 * 
 * @param {Array} image_list Paths of images to process
 * @param {*} options Program parameters, a Options object/class
 */
function Controller(image_list, options) {


  self = this;

  this.image_list = image_list;
  this.image_count = image_list.length;
  this.pointer = 0;
  this.options = options;

  this.workers;
  this.errors = [];
  this.completed = [];
  this.completed_count = 0;
  this.progressEmitter = new EventEmitter();


  /**
   * Generate the workers
   */
  this.prepare = function() {

    const required_workers = options.max_threads === 0 ? Math.min(this.image_list.length, cores) : Math.min(this.image_list.length, options.max_threads);
    this.workers = new Array(required_workers);  // Reserve space for the number of workers

    cluster.setupMaster({
      exec: path.join(__dirname, 'worker.js')
    });

    for (let i = 0; i !== required_workers; i++) {
      this.workers[i] = cluster.fork();
      this.workers[i].send({
        code: 'SETUP',
        data: this.options
      });

    }

  }


  this.run = async function() {

    cluster.on('message', handleWorker);
    const worker_count = this.workers.length;
    
    for (let i = 0; i !== worker_count; i++) {
      this.workers[i].send({
        code: 'TASK',
        data: this.image_list[this.pointer]
      });
      this.pointer++;
    }

    // Wait for all tasks to complete
    return new Promise(resolve => cluster.once('complete', resolve));
  }

  
  /**
   * Handle the response from the worker, and remove the listener if complete
   * @param {*} data The response from the worker
   */
  function handleWorker(worker, response) {

    // Self is used to pass "this" to the handler

    if (response.code === 'ERROR') {
      self.errors.push(response.error);
      self.completed_count++;

    } else if (response.code === 'OK') {
      self.completed.push(response.data);
      self.completed_count++;

    } else if (response.code === 'NOPT') {
      worker.send({code: 'SETUP', data: this.options});
      worker.send({code: 'TASK', data: response.data}); // Resend the same job
    } else {
      throw {reason: 'Got an unknown code from worker: ' + response.code};
    }

    // Signal the progress update
    self.progressEmitter.emit('progress', self.completed_count / self.image_count);

    if (self.pointer !== self.image_count) {
      worker.send({code: 'TASK', data: self.image_list[self.pointer]});
      self.pointer++;
    }

    if (self.completed_count === self.image_count) {
      cluster.emit('complete');
      cluster.removeListener('message', handleWorker);
    }

  }

  this.shutdown = function() {
    const number_workers = this.workers.length;
    for (let i = 0; i !== number_workers; i++) {
      this.workers[i].send({code: "EXIT"});
    }
    this.workers = [];
  }

  this.getResult = function() {
    return { completed: this.completed, errors: this.errors };
  }

}


module.exports = Controller;

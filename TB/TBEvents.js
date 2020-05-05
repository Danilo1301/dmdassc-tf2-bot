class TBEvents {
  constructor() {
    this.events_name = {};
  }

  Setup() { return this.On.bind(this); }

  On(e, fn) {
    if(!this.events_name[e]) {
      this.events_name[e] = [];
    }
    this.events_name[e].push(fn);
  }

  TriggerEvent(e, args) {
    if(this.events_name[e]) {
      for (var f of this.events_name[e]) {
        f.apply(this, [].slice.call(args || []))
      }
    }
  }
}

module.exports = TBEvents;

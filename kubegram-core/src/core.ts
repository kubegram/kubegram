import { EventBus } from '@kubegram/common-events';

export class KubegramCore {
  eventBus: EventBus;
  
  constructor() {
    this.eventBus = new EventBus({ enableCache: true });
  }
  
  async initialize() {}
  async shutdown() {}
}

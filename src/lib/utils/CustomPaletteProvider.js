/**
 * Custom palette provider that exposes more BPMN elements
 */
export default class CustomPaletteProvider {
  constructor(palette, create, elementFactory, spaceTool, lassoTool, handTool, globalConnect, translate) {
    this.palette = palette;
    this.create = create;
    this.elementFactory = elementFactory;
    this.spaceTool = spaceTool;
    this.lassoTool = lassoTool;
    this.handTool = handTool;
    this.globalConnect = globalConnect;
    this.translate = translate;

    palette.registerProvider(this);
  }

  getPaletteEntries() {
    const actions = {};
    const create = this.create;
    const elementFactory = this.elementFactory;
    const translate = this.translate;

    function createAction(type, group, className, title, options = {}) {
      function createListener(event) {
        const shape = elementFactory.createShape({ type, ...options });
        create.start(event, shape);
      }

      return {
        group: group,
        className: className,
        title: title,
        action: {
          dragstart: createListener,
          click: createListener
        }
      };
    }

    // Tools
    actions['hand-tool'] = {
      group: 'tools',
      className: 'bpmn-icon-hand-tool',
      title: translate('Activate the hand tool'),
      action: {
        click: (event) => {
          this.handTool.activateHand(event);
        }
      }
    };

    actions['lasso-tool'] = {
      group: 'tools',
      className: 'bpmn-icon-lasso-tool',
      title: translate('Activate the lasso tool'),
      action: {
        click: (event) => {
          this.lassoTool.activateSelection(event);
        }
      }
    };

    actions['space-tool'] = {
      group: 'tools',
      className: 'bpmn-icon-space-tool',
      title: translate('Activate the create/remove space tool'),
      action: {
        click: (event) => {
          this.spaceTool.activateSelection(event);
        }
      }
    };

    actions['global-connect-tool'] = {
      group: 'tools',
      className: 'bpmn-icon-connection-multi',
      title: translate('Activate the global connect tool'),
      action: {
        click: (event) => {
          this.globalConnect.start(event);
        }
      }
    };

    // Events
    actions['create.start-event'] = createAction(
      'bpmn:StartEvent',
      'event',
      'bpmn-icon-start-event-none',
      translate('Create StartEvent')
    );

    actions['create.intermediate-event'] = createAction(
      'bpmn:IntermediateThrowEvent',
      'event',
      'bpmn-icon-intermediate-event-none',
      translate('Create Intermediate/Boundary Event')
    );

    actions['create.end-event'] = createAction(
      'bpmn:EndEvent',
      'event',
      'bpmn-icon-end-event-none',
      translate('Create EndEvent')
    );

    // Activities
    actions['create.task'] = createAction(
      'bpmn:Task',
      'activity',
      'bpmn-icon-task',
      translate('Create Task')
    );

    actions['create.subprocess-expanded'] = createAction(
      'bpmn:SubProcess',
      'activity',
      'bpmn-icon-subprocess-expanded',
      translate('Create expanded SubProcess'),
      { isExpanded: true }
    );

    // Gateways
    actions['create.exclusive-gateway'] = createAction(
      'bpmn:ExclusiveGateway',
      'gateway',
      'bpmn-icon-gateway-none',
      translate('Create Gateway')
    );

    // Data
    actions['create.data-object'] = createAction(
      'bpmn:DataObjectReference',
      'data',
      'bpmn-icon-data-object',
      translate('Create DataObjectReference')
    );

    actions['create.data-store'] = createAction(
      'bpmn:DataStoreReference',
      'data',
      'bpmn-icon-data-store',
      translate('Create DataStoreReference')
    );

    // Participants
    actions['create.participant-expanded'] = {
      group: 'collaboration',
      className: 'bpmn-icon-participant',
      title: translate('Create Pool/Participant'),
      action: {
        dragstart: (event) => {
          const shape = elementFactory.createParticipantShape();
          create.start(event, shape);
        },
        click: (event) => {
          const shape = elementFactory.createParticipantShape();
          create.start(event, shape);
        }
      }
    };

    return actions;
  }
}

CustomPaletteProvider.$inject = [
  'palette',
  'create',
  'elementFactory',
  'spaceTool',
  'lassoTool',
  'handTool',
  'globalConnect',
  'translate'
];

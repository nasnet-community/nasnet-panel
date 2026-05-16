import type { Interface, InterfaceResponse } from '../../api';

export const toInterfaceResponses = (list: Interface[]): InterfaceResponse[] =>
  list.map((i) => ({
    id: i.name,
    name: i.name,
    type: i.type,
    running: i.running,
    disabled: i.disabled ?? false,
    mac: i.mac,
    comment: i.comment,
  }));

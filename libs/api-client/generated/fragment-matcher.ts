
      export interface PossibleTypesResultData {
        possibleTypes: {
          [key: string]: string[]
        }
      }
      const result: PossibleTypesResultData = {
  "possibleTypes": {
    "Connection": [
      "InterfaceConnection",
      "RouterConnection"
    ],
    "Edge": [
      "InterfaceEdge",
      "RouterEdge"
    ],
    "Node": [
      "Interface",
      "Router",
      "User"
    ]
  }
};
      export default result;
    
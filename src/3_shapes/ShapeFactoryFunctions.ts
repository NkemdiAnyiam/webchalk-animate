import { ShapeFactoryFunctions_Connector, WebchalkConnectorElement } from "./elements/WebchalkConnectorElement";
import type { Webchalk } from "../Webchalk";


/**
 * @ignore
 */
export const shapeFactoryFunctions: ShapeFactoryFunctions_Connector = {
  drawConnector: WebchalkConnectorElement.create,
};

/**
 * An object containing various functions that can be used to create
 * WebChalk's custom HTML elements. Access via {@link Webchalk.shapes}.
 * 
 * @see {@link Webchalk.shapes}
 * 
 * @interface
 */
export type ShapeFactoryFunctions = typeof shapeFactoryFunctions;
